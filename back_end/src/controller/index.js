// src/controllers/index.js
const authController = require('./auth.controller')
const userController = require('./user.controller')
const roleController = require('./role.controller')
const paymentController = require('./payment.controller')
const cartController = require('./cart.controller')
const productController = require('./product.controller')
const productVariantController = require('./product-variant.controller')
const categoryController = require('./category.controller')
const shopController = require('./shop.controller')
const orderController = require('./order.controller')
const addressController = require('./address.controller')

module.exports = {
    authController,
    userController,
    roleController,
    paymentController,
    cartController,
    productController,
    productVariantController,
    categoryController,
    shopController,
    orderController,
    addressController,
}