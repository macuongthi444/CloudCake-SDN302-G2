const createHttpError = require('http-errors')
const db = require('../models')
const Order = db.order
const Cart = db.cart
const vnpayService = require('../services/vnpay.service')
const cache = require('../utils/cache')
const mongoose = require('mongoose')

/**
 * Helper function to find order by either ObjectId or orderNumber
 * Supports both formats: ORD-YYYYMMDD-XXXX and ORDYYYYMMDDXXXX
 */
async function findOrderByIdOrNumber(id) {
  if (!id) return null
  
  // Check if id is a valid ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
  
  if (isValidObjectId) {
    // Search by _id if it's a valid ObjectId
    return await Order.findById(id)
  } else {
    // Search by orderNumber if it's not a valid ObjectId
    // Support both formats: ORD-YYYYMMDD-XXXX and ORDYYYYMMDDXXXX
    if (!id.includes('-') && id.startsWith('ORD') && id.length >= 11) {
      // Try to parse: ORD + YYYYMMDD + XXXX
      const match = id.match(/^ORD(\d{8})(\d+)$/)
      if (match) {
        const [, datePart, seqPart] = match
        const formattedOrderNumber = `ORD-${datePart}-${seqPart.padStart(4, '0')}`
        // Try both formats
        return await Order.findOne({
          $or: [
            { orderNumber: id },
            { orderNumber: formattedOrderNumber }
          ]
        })
      } else {
        // Fallback: search as-is
        return await Order.findOne({ orderNumber: id })
      }
    } else {
      // Search with dashes format
      return await Order.findOne({ orderNumber: id })
    }
  }
}

async function createPaymentUrl(req, res, next) {
  try {
    const { orderId } = req.body
    if (!orderId) throw createHttpError.BadRequest('orderId is required')
    
    const order = await Order.findById(orderId).lean()
    if (!order) throw createHttpError.NotFound('Order not found')
    
    // Validate order has valid totalAmount
    if (!order.totalAmount || order.totalAmount <= 0) {
      console.error('VNPay: Order has invalid totalAmount', {
        orderId: order._id,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal
      })
      throw createHttpError.BadRequest(`Order has invalid total amount: ${order.totalAmount}. Cannot proceed with payment.`)
    }
    
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1'
    const { paymentUrl } = await vnpayService.createPaymentUrl(order, clientIp)
    res.status(200).json({ paymentUrl })
  } catch (error) {
    console.error('VNPay createPaymentUrl error:', error)
    next(error)
  }
}

async function returnCallback(req, res, next) {
  console.log('\n========== VNPay: RETURN CALLBACK - START ==========')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Request query keys:', Object.keys(req.query))
  console.log('Request query:', JSON.stringify(req.query, null, 2))
  
  try {
    // VNPay may send URL-encoded values, ensure we decode them properly
    // Express usually handles this automatically, but let's ensure all values are properly decoded
    const queryParams = { ...req.query }
    
    // Decode any URL-encoded values (Express should do this, but ensure it's done)
    Object.keys(queryParams).forEach(key => {
      if (typeof queryParams[key] === 'string') {
        // Decode if needed (Express usually does this, but double-check)
        try {
          queryParams[key] = decodeURIComponent(queryParams[key])
        } catch (e) {
          // If decode fails, use original value
          console.warn(`Warning: Could not decode param ${key}:`, queryParams[key])
        }
      }
    })
    
    console.log('Processed query params:', JSON.stringify(queryParams, null, 2))
    console.log('Calling vnpayService.verifyReturn...')
    const result = vnpayService.verifyReturn(queryParams)
    const orderId = result.orderId
    
    console.log('Verify result:', {
      isValid: result.isValid,
      isSuccess: result.isSuccess,
      orderId: result.orderId,
      responseCode: result.responseCode
    })
    
    // Update order status if payment is successful
    if (result.isValid && result.isSuccess && orderId) {
      try {
        const order = await findOrderByIdOrNumber(orderId)
        if (order) {
          // Only update if order is still PENDING (not already processed)
          if (order.paymentStatus === 'PENDING' && order.status === 'PENDING') {
            order.paymentStatus = 'PAID'
            order.status = 'CONFIRMED' // Change status to CONFIRMED after successful payment
            order.transactionId = req.query.vnp_TransactionNo || req.query.vnp_BankTranNo
            order.paymentMeta = { ...(order.paymentMeta || {}), vnpay: req.query }
            await order.save()
            
            console.log('Order updated after successful VNPay payment:', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              paymentStatus: order.paymentStatus,
              status: order.status
            })
          } else {
            console.warn('Order already processed, skipping update:', {
              orderId: order._id,
              currentPaymentStatus: order.paymentStatus,
              currentStatus: order.status
            })
          }
          
          // Clear cart after successful VNPay payment
          try {
            const cart = await Cart.findOne({ userId: order.userId })
            if (cart) {
              cart.items = []
              cart.totalPrice = 0
              await cart.save()
              
              // Invalidate cache
              cache.delete(`cart:${order.userId}`)
              
              console.log('Cart cleared after successful VNPay payment:', orderId)
            }
          } catch (clearError) {
            console.error('Error clearing cart after VNPay payment:', clearError)
            // Don't fail the payment confirmation if cart clearing fails
          }
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError)
        // Continue even if update fails
      }
    } else if (result.isValid && !result.isSuccess && orderId) {
      // Payment failed but signature is valid
      // DO NOT clear cart - user may want to retry payment
      // Update order paymentStatus to FAILED but keep status as PENDING (user can retry)
      try {
        const order = await findOrderByIdOrNumber(orderId)
        if (order) {
          // Only update if order is still PENDING
          if (order.paymentStatus === 'PENDING' && order.status === 'PENDING') {
            order.paymentStatus = 'FAILED'
            order.paymentMeta = { ...(order.paymentMeta || {}), vnpay: req.query }
            await order.save()
            console.log('VNPay payment failed, order updated to FAILED (can retry):', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              paymentStatus: order.paymentStatus,
              status: order.status
            })
          }
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError)
      }
    } else if (!result.isValid && orderId) {
      // Invalid signature - order remains PENDING, user can retry
      console.warn('VNPay signature invalid, order remains PENDING:', {
        orderId,
        isValid: result.isValid,
        isSuccess: result.isSuccess
      })
    }
    
    // Get orderNumber for redirect URL (use orderNumber instead of ObjectId for cleaner URLs)
    let orderNumber = ''
    if (orderId) {
      try {
        const order = await findOrderByIdOrNumber(orderId)
        if (order && order.orderNumber) {
          orderNumber = order.orderNumber
        } else if (mongoose.Types.ObjectId.isValid(orderId)) {
          // If orderId is already an ObjectId and we couldn't find order, use it as fallback
          orderNumber = orderId
        } else {
          // If orderId is already an orderNumber, use it directly
          orderNumber = orderId
        }
      } catch (err) {
        console.warn('Could not fetch orderNumber for redirect:', err)
        // Fallback: if orderId is not an ObjectId, assume it's already an orderNumber
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          orderNumber = orderId
        }
      }
    }
    
    // Redirect to frontend with payment result (use orderNumber instead of orderId)
    const frontendUrl = vnpayService.frontendUrl || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/payment-result?` + new URLSearchParams({
      success: result.isSuccess ? 'true' : 'false',
      orderId: orderNumber || orderId || '', // Prefer orderNumber, fallback to orderId
      message: result.isSuccess ? 'Thanh toán thành công' : (result.isValid ? 'Thanh toán thất bại' : 'Chữ ký không hợp lệ')
    }).toString()
    
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('VNPay return callback error:', error)
    const frontendUrl = vnpayService.frontendUrl || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/payment-result?success=false&message=Lỗi xử lý thanh toán`)
  }
}

async function ipn(req, res, next) {
  try {
    const result = await vnpayService.handleIpn(req.query)
    if (result.status) {
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' })
    }
    return res.status(200).json({ RspCode: '97', Message: result.reason || 'Signature/Amount invalid' })
  } catch (error) {
    console.error('VNPay IPN error:', error)
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' })
  }
}

module.exports = { createPaymentUrl, returnCallback, ipn }





