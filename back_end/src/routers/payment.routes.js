const express = require('express')
const bodyParser = require('body-parser')
const { paymentController } = require('../controller')
const vnpayController = require('../controller/vnpay.controller')
const authJwt = require('../middlewares/jwtAuth')

const PaymentRouter = express.Router()
PaymentRouter.use(bodyParser.json())

// Get list of payment methods (requires login)
PaymentRouter.get("/list", authJwt.verifyToken, paymentController.getList)

// Get payment method by ID (requires login)
PaymentRouter.get("/find/:id", authJwt.verifyToken, paymentController.getById)

// Create payment method (requires Admin)
PaymentRouter.post("/create", authJwt.verifyToken, authJwt.isAdmin, paymentController.create)

// Update payment method (requires Admin)
PaymentRouter.put("/edit/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.update)

// Delete payment method (requires Admin)
PaymentRouter.delete("/delete/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.deleteById)

// Toggle payment method status (requires Admin)
PaymentRouter.put("/toggle-status/:id", authJwt.verifyToken, authJwt.isAdmin, paymentController.toggleStatus)

// VNPay payment endpoints (public callbacks; creation requires auth)
PaymentRouter.post('/vnpay/create', authJwt.verifyToken, vnpayController.createPaymentUrl)
PaymentRouter.get('/vnpay/return', vnpayController.returnCallback)
PaymentRouter.post('/vnpay/ipn', vnpayController.ipn)

module.exports = PaymentRouter


