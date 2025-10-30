// src/controllers/index.js
const authController = require('./auth.controller')
const userController = require('./user.controller')
const roleController = require('./role.controller')
const paymentController = require('./payment.controller')
const cartController = require('./cart.controller')

module.exports = {
    authController,
    userController,
    roleController,
    paymentController,
    cartController
}