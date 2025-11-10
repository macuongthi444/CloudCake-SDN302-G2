const createHttpError = require('http-errors')
const db = require('../models')
const Order = db.order
const Cart = db.cart
const PaymentMethod = db.paymentMethod
const User = db.user
const Address = db.address

async function createFromCart(req, res, next) {
  try {
    const { userId, paymentCode = 'COD', shippingAddress = {}, notes } = req.body
    if (!userId) throw createHttpError.BadRequest('userId is required')

    // Load cart with populated products to get shopId
    const cart = await Cart.findOne({ userId }).populate('items.productId', 'shopId')
    if (!cart || !cart.items || cart.items.length === 0) {
      throw createHttpError.BadRequest('Cart is empty')
    }

    // Get shopId from first product
    const firstProduct = cart.items[0]?.productId
    const shopId = firstProduct?.shopId || cart.items[0]?.productId?.shopId
    if (!shopId) {
      throw createHttpError.BadRequest('Cannot determine shop from cart items')
    }

    // Get user's default address or use provided one
    let finalShippingAddress = shippingAddress
    if (!shippingAddress.recipientName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.address_line1) {
      const user = await User.findById(userId).lean()
      const defaultAddr = await Address.findOne({ user_id: userId, status: true }).sort({ createdAt: -1 }).lean()
      if (defaultAddr) {
        finalShippingAddress = {
          recipientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Customer',
          phone: defaultAddr.phone || user?.phone || '',
          city: defaultAddr.city || 'Ho Chi Minh',
          address_line1: defaultAddr.address_line1 || 'Address not provided',
          address_line2: defaultAddr.address_line2,
          district: defaultAddr.district,
          ward: defaultAddr.ward,
          postalCode: defaultAddr.postalCode
        }
      } else if (user) {
        finalShippingAddress = {
          recipientName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Customer',
          phone: user.phone || '',
          city: 'Ho Chi Minh',
          address_line1: 'Address not provided'
        }
      } else {
        finalShippingAddress = {
          recipientName: 'Customer',
          phone: '',
          city: 'Ho Chi Minh',
          address_line1: 'Address not provided'
        }
      }
    }

    // Find payment method by code; if missing, upsert a basic one
    let pm = await PaymentMethod.findOne({ paymentCode })
    if (!pm) {
      pm = new PaymentMethod({
        name: paymentCode,
        paymentCode,
        isActive: true,
        isOnline: paymentCode !== 'COD',
        supportsRefund: paymentCode !== 'COD'
      })
      await pm.save()
    }

    // Calculate amounts
    const subtotal = cart.items.reduce((sum, it) => {
      const price = Number(it.price || 0)
      const quantity = Number(it.quantity || 0)
      return sum + (price * quantity)
    }, 0)
    const shippingFee = 0
    const discount = 0
    const totalAmount = subtotal + shippingFee - discount

    // Validate totalAmount
    if (totalAmount <= 0) {
      throw createHttpError.BadRequest(`Invalid cart total: ${totalAmount}. Cart must have items with valid prices.`)
    }

    console.log('Order creation:', {
      userId,
      cartItemsCount: cart.items.length,
      subtotal,
      totalAmount,
      items: cart.items.map(it => ({
        productName: it.productName,
        quantity: it.quantity,
        price: it.price,
        total: it.quantity * it.price
      }))
    })

    // Map items to order schema - ensure productId is ObjectId
    const items = cart.items.map(it => ({
      productId: it.productId?._id || it.productId, // Handle both populated and non-populated
      variantId: it.variantId,
      productName: it.productName,
      variantName: it.variantName,
      quantity: Number(it.quantity || 0),
      unitPrice: Number(it.price || 0),
      totalPrice: Number(it.quantity || 0) * Number(it.price || 0),
      image: it.image
    }))

    // Pick a shipping method; try default or any active
    const ShippingMethod = db.shippingMethod
    let shipping = await ShippingMethod.findOne({ isDefault: true, isActive: true })
    if (!shipping) shipping = await ShippingMethod.findOne({ isActive: true })
    if (!shipping) {
      // As a last resort, create a FREE default
      shipping = new ShippingMethod({ name: 'Miễn phí', code: 'FREE', feeType: 'FREE', isActive: true, isDefault: true })
      await shipping.save()
    }

    // Create order with appropriate status
    // For VNPay: status = PENDING, paymentStatus = PENDING (waiting for payment)
    // For COD: status = PENDING, paymentStatus = PENDING (will be confirmed after COD confirmation)
    const order = new Order({
      userId,
      shopId,
      items,
      subtotal,
      shippingFee,
      discount,
      totalAmount,
      paymentMethodId: pm._id,
      paymentCode: paymentCode, // Store payment code for easy checking
      status: 'PENDING', // Explicitly set to PENDING
      paymentStatus: 'PENDING', // Explicitly set to PENDING - will be updated after payment
      shippingMethodId: shipping._id,
      shippingAddress: finalShippingAddress,
      notes
    })

    await order.save()
    
    console.log('Order created:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentCode,
      note: paymentCode === 'VNPAY' ? 'Order created, waiting for VNPay payment confirmation' : 'Order created for COD'
    })

    // Clear cart after creating order for COD (immediate payment confirmation)
    // For VNPay, cart will be cleared after successful payment in vnpay callback
    if (paymentCode === 'COD') {
      try {
        cart.items = []
        cart.totalPrice = 0
        await cart.save()
        
        // Invalidate cache
        const cache = require('../utils/cache')
        cache.delete(`cart:${userId}`)
        
        console.log('Cart cleared after COD order creation:', order._id)
      } catch (clearError) {
        console.error('Error clearing cart after COD order:', clearError)
        // Don't fail the order creation if cart clearing fails
      }
    }

    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params
    if (!id) throw createHttpError.BadRequest('Order ID is required')
    
    // Check if id is a valid ObjectId (24 hex characters)
    const mongoose = require('mongoose')
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
    
    let order
    if (isValidObjectId) {
      // Search by _id if it's a valid ObjectId
      order = await Order.findById(id)
        .populate('userId', 'firstName lastName email')
        .populate('shopId', 'name')
        .populate('paymentMethodId', 'name paymentCode')
        .populate('shippingMethodId', 'name')
    } else {
      // Search by orderNumber if it's not a valid ObjectId
      // Support both formats: ORD-YYYYMMDD-XXXX and ORDYYYYMMDDXXXX
      // If id doesn't have dashes, try to convert to format with dashes
      // Example: ORD202511090001 -> ORD-20251109-0001
      if (!id.includes('-') && id.startsWith('ORD') && id.length >= 11) {
        // Try to parse: ORD + YYYYMMDD + XXXX
        const match = id.match(/^ORD(\d{8})(\d+)$/)
        if (match) {
          const [, datePart, seqPart] = match
          const formattedOrderNumber = `ORD-${datePart}-${seqPart.padStart(4, '0')}`
          // Try both formats
          order = await Order.findOne({
            $or: [
              { orderNumber: id },
              { orderNumber: formattedOrderNumber }
            ]
          })
            .populate('userId', 'firstName lastName email')
            .populate('shopId', 'name')
            .populate('paymentMethodId', 'name paymentCode')
            .populate('shippingMethodId', 'name')
        } else {
          // Fallback: search as-is
          order = await Order.findOne({ orderNumber: id })
            .populate('userId', 'firstName lastName email')
            .populate('shopId', 'name')
            .populate('paymentMethodId', 'name paymentCode')
            .populate('shippingMethodId', 'name')
        }
      } else {
        // Search with dashes format
        order = await Order.findOne({ orderNumber: id })
          .populate('userId', 'firstName lastName email')
          .populate('shopId', 'name')
          .populate('paymentMethodId', 'name paymentCode')
          .populate('shippingMethodId', 'name')
      }
    }
    
    if (!order) throw createHttpError.NotFound('Order not found')
    res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

async function getByUserId(req, res, next) {
  try {
    const { userId } = req.params
    if (!userId) throw createHttpError.BadRequest('userId is required')
    
    const orders = await Order.find({ userId })
      .populate('shopId', 'name')
      .populate('paymentMethodId', 'name paymentCode')
      .populate('shippingMethodId', 'name')
      .sort({ createdAt: -1 })
      .lean()
    
    res.status(200).json(orders)
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel an order
 * Only allows cancellation for PENDING and CONFIRMED orders
 */
async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params
    const { reason, cancelledBy = 'USER' } = req.body
    
    if (!orderId) throw createHttpError.BadRequest('Order ID is required')
    
    // Find order by ObjectId or orderNumber
    const mongoose = require('mongoose')
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId)
    let order
    
    if (isValidObjectId) {
      order = await Order.findById(orderId)
    } else {
      // Search by orderNumber
      if (!orderId.includes('-') && orderId.startsWith('ORD') && orderId.length >= 11) {
        const match = orderId.match(/^ORD(\d{8})(\d+)$/)
        if (match) {
          const [, datePart, seqPart] = match
          const formattedOrderNumber = `ORD-${datePart}-${seqPart.padStart(4, '0')}`
          order = await Order.findOne({
            $or: [
              { orderNumber: orderId },
              { orderNumber: formattedOrderNumber }
            ]
          })
        } else {
          order = await Order.findOne({ orderNumber: orderId })
        }
      } else {
        order = await Order.findOne({ orderNumber: orderId })
      }
    }
    
    if (!order) throw createHttpError.NotFound('Order not found')
    
    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED']
    if (!cancellableStatuses.includes(order.status)) {
      throw createHttpError.BadRequest(
        `Không thể hủy đơn hàng ở trạng thái "${order.status}". ` +
        `Chỉ có thể hủy đơn hàng ở trạng thái: ${cancellableStatuses.join(', ')}`
      )
    }
    
    // Check if order is already cancelled
    if (order.status === 'CANCELLED') {
      throw createHttpError.BadRequest('Đơn hàng đã được hủy trước đó')
    }
    
    // Check user permission (only allow user to cancel their own orders)
    const userId = req.userId || req.user?.id || req.user?._id
    if (userId && order.userId.toString() !== userId.toString()) {
      // Check if user is admin or shop owner
      const user = await User.findById(userId).lean()
      const isAdmin = user?.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN')
      const isShopOwner = order.shopId && user?.shopId?.toString() === order.shopId.toString()
      
      if (!isAdmin && !isShopOwner) {
        throw createHttpError.Forbidden('Bạn không có quyền hủy đơn hàng này')
      }
    }
    
    // Restore inventory if order was CONFIRMED (might have deducted inventory)
    if (order.status === 'CONFIRMED' && order.items && order.items.length > 0) {
      try {
        const ProductVariant = db.productVariant
        for (const item of order.items) {
          if (item.variantId) {
            const variant = await ProductVariant.findById(item.variantId)
            if (variant && variant.inventory) {
              variant.inventory.quantity = (variant.inventory.quantity || 0) + (item.quantity || 0)
              await variant.save()
              console.log(`Restored ${item.quantity} units of variant ${item.variantId}`)
            }
          }
        }
      } catch (inventoryError) {
        console.error('Error restoring inventory:', inventoryError)
        // Continue with cancellation even if inventory restore fails
      }
    }
    
    // Update order status
    order.status = 'CANCELLED'
    order.cancelledAt = new Date()
    if (reason) {
      order.cancellationReason = reason
    }
    
    // Handle payment status
    // If order was paid, mark payment as pending refund (actual refund should be handled separately)
    if (order.paymentStatus === 'PAID') {
      // For VNPay: payment status can be changed to REFUNDED after actual refund
      // For COD: no refund needed
      if (order.paymentCode === 'VNPAY') {
        // Keep as PAID until actual refund is processed
        // Or change to REFUNDED if refund is automatic
        // For now, we'll keep it as PAID and require manual refund processing
        console.log('Order was paid via VNPay, refund should be processed separately')
      }
      // For COD, no action needed
    }
    
    await order.save()
    
    console.log('Order cancelled:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      cancelledBy
    })
    
    res.status(200).json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason
      }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { createFromCart, getById, getByUserId, cancelOrder }
