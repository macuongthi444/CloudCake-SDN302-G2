const express = require('express')
const bodyParser = require('body-parser')
const { paymentController } = require('../controller')
const vnpayController = require('../controller/vnpay.controller')
const authJwt = require('../middlewares/jwtAuth')

const PaymentRouter = express.Router()
PaymentRouter.use(bodyParser.json())

// Get list of payment methods (requires login)
/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Phương thức thanh toán và VNPay
 */
/**
 * @swagger
 * /api/payment/list:
 *   get:
 *     summary: Danh sách phương thức thanh toán
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
PaymentRouter.get("/list", authJwt.verifyToken, paymentController.getList)

// Get payment method by ID (requires login)
/**
 * @swagger
 * /api/payment/find/{id}:
 *   get:
 *     summary: Xem phương thức thanh toán
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
PaymentRouter.get("/find/:id", authJwt.verifyToken, paymentController.getById)

// Create payment method (requires Admin)
/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Tạo phương thức thanh toán (Admin)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
PaymentRouter.post("/create", authJwt.verifyToken, authJwt.isAdmin, paymentController.create)

// Update payment method (requires Admin)
/**
 * @swagger
 * /api/payment/edit/{id}:
 *   put:
 *     summary: Cập nhật phương thức thanh toán (Admin)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
PaymentRouter.put("/edit/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.update)

// Delete payment method (requires Admin)
/**
 * @swagger
 * /api/payment/delete/{id}:
 *   delete:
 *     summary: Xóa phương thức thanh toán (Admin)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa
 */
PaymentRouter.delete("/delete/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.deleteById)

// Toggle payment method status (requires Admin)
/**
 * @swagger
 * /api/payment/toggle-status/{id}:
 *   put:
 *     summary: Bật/Tắt phương thức thanh toán (Admin)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
PaymentRouter.put("/toggle-status/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.toggleStatus)

// VNPay payment endpoints (public callbacks; creation requires auth)
/**
 * @swagger
 * /api/payment/vnpay/create:
 *   post:
 *     summary: Tạo URL thanh toán VNPay
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL thanh toán
 */
PaymentRouter.post('/vnpay/create', authJwt.verifyToken, vnpayController.createPaymentUrl)
/**
 * @swagger
 * /api/payment/vnpay/return:
 *   get:
 *     summary: VNPay return
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: OK
 */
PaymentRouter.get('/vnpay/return', vnpayController.returnCallback)
/**
 * @swagger
 * /api/payment/vnpay/ipn:
 *   post:
 *     summary: VNPay IPN
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: OK
 */
PaymentRouter.post('/vnpay/ipn', vnpayController.ipn)

module.exports = PaymentRouter


