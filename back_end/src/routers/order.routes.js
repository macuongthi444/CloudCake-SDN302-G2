const express = require('express')
const bodyParser = require('body-parser')
const { orderController } = require('../controller')
const VerifyJwt = require('../middlewares/jwtAuth')
const authJwt = require('../middlewares/jwtAuth')
const vnpayController = require('../controller/vnpay.controller')

// Require directly from file to avoid cache issues
let orderController;
try {
    // Clear cache if exists
    delete require.cache[require.resolve('../controller/order.controller')];
    orderController = require('../controller/order.controller');
    
    // Debug: Check if functions are defined
    console.log('OrderController loaded. Available methods:', Object.keys(orderController));
    console.log('updateOrderStatus type:', typeof orderController.updateOrderStatus);
    console.log('cancelOrder type:', typeof orderController.cancelOrder);
    console.log('rejectOrderBySeller type:', typeof orderController.rejectOrderBySeller);
    
    if (!orderController.updateOrderStatus) {
        console.error('ERROR: orderController.updateOrderStatus is undefined!');
    }
    if (!orderController.cancelOrder) {
        console.error('ERROR: orderController.cancelOrder is undefined!');
    }
    if (!orderController.rejectOrderBySeller) {
        console.error('ERROR: orderController.rejectOrderBySeller is undefined!');
    }
    if (!orderController.createFromCart) {
        console.error('ERROR: orderController.createFromCart is undefined!');
    }
} catch (error) {
    console.error('ERROR loading orderController:', error);
    throw error;
}



const orderRouter = express.Router()
orderRouter.use(bodyParser.json())

// Use the controller directly
const controller = orderController

orderRouter.post('/create-from-cart', authJwt.verifyToken, controller.createFromCart)
orderRouter.get('/find/:id', authJwt.verifyToken, controller.getById)
orderRouter.get('/user/:userId', authJwt.verifyToken, controller.getByUserId)
orderRouter.post('/:orderId/cancel', authJwt.verifyToken, controller.cancelOrder)
// Lấy tất cả đơn đặt hàng (chỉ admin có quyền)
orderRouter.get("/list", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], controller.getAllOrders)
// Lấy đơn đặt hàng theo ID
orderRouter.get("/find/:id", [VerifyJwt.verifyToken], controller.getOrderById)
// Lấy đơn đặt hàng theo ID người dùng
orderRouter.get("/user/:userId", [VerifyJwt.verifyToken], controller.getOrdersByUserId)
// Tạo đơn đặt hàng mới
orderRouter.post("/create", [VerifyJwt.verifyToken], controller.createOrder)
// Cập nhật trạng thái đơn hàng (chỉ admin và seller có quyền)
orderRouter.put("/status/:id", [VerifyJwt.verifyToken, VerifyJwt.isSellerOrAdmin], controller.updateOrderStatus)
// Hủy đơn hàng
orderRouter.put("/cancel/:id", [VerifyJwt.verifyToken], controller.cancelOrder)
//  Từ chối đơn hàng (dành cho seller)
orderRouter.put("/reject/:id", [VerifyJwt.verifyToken, VerifyJwt.isSeller], controller.rejectOrderBySeller)
// Xóa đơn hàng (xóa mềm) (chỉ admin có quyền)
orderRouter.delete("/delete/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], controller.deleteOrder)
// Lấy thống kê đơn hàng (chỉ admin có quyền)
orderRouter.get("/statistics", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], controller.getOrderStatistics)
orderRouter.get("/shop/:shopId", [VerifyJwt.verifyToken, VerifyJwt.isSeller], controller.getOrdersByShopId)
orderRouter.get("/refunds", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], controller.getOrdersNeedingRefund)
// Đánh dấu đã hoàn tiền cho đơn hàng
orderRouter.post('/create-from-cart', VerifyJwt.verifyToken, orderController.createFromCart)
orderRouter.get('/find/:id', VerifyJwt.verifyToken, orderController.getById)
orderRouter.get('/user/:userId', VerifyJwt.verifyToken, orderController.getByUserId)
orderRouter.put("/refund/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], controller.markAsRefunded)

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




