const express = require('express')
const bodyParser = require('body-parser')
const { orderController } = require('../controller')
const VerifyJwt = require('../middlewares/verifyJwt')
const vnpayController = require('../controller/vnpay.controller')

const orderRouter = express.Router()
orderRouter.use(bodyParser.json())

// Lấy tất cả đơn đặt hàng (chỉ admin có quyền)
orderRouter.get("/list", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], orderController.getAllOrders)
// Lấy đơn đặt hàng theo ID
orderRouter.get("/find/:id", [VerifyJwt.verifyToken], orderController.getOrderById)
// Lấy đơn đặt hàng theo ID người dùng
orderRouter.get("/user/:userId", [VerifyJwt.verifyToken], orderController.getOrdersByUserId)
// Tạo đơn đặt hàng mới
orderRouter.post("/create", [VerifyJwt.verifyToken], orderController.createOrder)
// Cập nhật trạng thái đơn hàng (chỉ admin và seller có quyền)
orderRouter.put("/status/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdminOrSeller], orderController.updateOrderStatus)
// Hủy đơn hàng
orderRouter.put("/cancel/:id", [VerifyJwt.verifyToken], orderController.cancelOrder)
//  Từ chối đơn hàng (dành cho seller)
orderRouter.put("/reject/:id", [VerifyJwt.verifyToken, VerifyJwt.isSeller], orderController.rejectOrderBySeller)
// Xóa đơn hàng (xóa mềm) (chỉ admin có quyền)
orderRouter.delete("/delete/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], orderController.deleteOrder)
// Lấy thống kê đơn hàng (chỉ admin có quyền)
orderRouter.get("/statistics", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], orderController.getOrderStatistics)
orderRouter.get("/shop/:shopId", [VerifyJwt.verifyToken, VerifyJwt.isSeller], orderController.getOrdersByShopId)
orderRouter.get("/refunds", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], orderController.getOrdersNeedingRefund)
// Đánh dấu đã hoàn tiền cho đơn hàng
orderRouter.put("/refund/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], orderController.markAsRefunded)
orderRouter.post('/create-from-cart', authJwt.verifyToken, orderController.createFromCart)
orderRouter.get('/find/:id', authJwt.verifyToken, orderController.getById)
orderRouter.get('/user/:userId', authJwt.verifyToken, orderController.getByUserId)

// VNPay callback route (public, no auth required)
// Handle both correct format (?params) and incorrect format (&params)
orderRouter.get('/vnpay-callback*', (req, res, next) => {
  console.log('\n========== VNPay: CALLBACK ROUTE HIT ==========')
  console.log('Original req.url:', req.url)
  console.log('Original req.path:', req.path)
  console.log('Original req.query:', req.query)
  console.log('Original req.originalUrl:', req.originalUrl)
  
  // If URL has params appended with & instead of ?, fix it
  // VNPay sometimes redirects to: /vnpay-callback&vnp_TmnCode=... instead of /vnpay-callback?vnp_TmnCode=...
  if (req.url.includes('&vnp_') && !req.url.includes('?vnp_')) {
    console.log('⚠️ VNPay callback URL has incorrect format (using & instead of ?), fixing...')
    
    // Parse the malformed URL
    const urlParts = req.url.split('&')
    if (urlParts.length > 1) {
      // First part is the path, rest are query params
      const path = urlParts[0]
      const queryString = urlParts.slice(1).join('&')
      
      // Reconstruct URL with proper query string
      req.url = path + '?' + queryString
      console.log('Fixed req.url:', req.url)
      
      // Re-parse query using url module
      const url = require('url')
      const parsed = url.parse(req.url, true)
      req.query = parsed.query
      console.log('Fixed req.query:', req.query)
    }
  } else if (req.url.includes('?vnp_')) {
    console.log('✅ VNPay callback URL format is correct')
  }
  
  console.log('Final req.url:', req.url)
  console.log('Final req.query:', req.query)
  console.log('==========================================\n')
  
  return vnpayController.returnCallback(req, res, next)
})

module.exports = orderRouter




