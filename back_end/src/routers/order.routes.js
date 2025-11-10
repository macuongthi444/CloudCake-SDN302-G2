const express = require('express')
const bodyParser = require('body-parser')
const { orderController } = require('../controller')
const VerifyJwt = require('../middlewares/verifyJwt')

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

module.exports = orderRouter