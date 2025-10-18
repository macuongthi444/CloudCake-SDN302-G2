// src/controllers/index.js
const authController = require('./auth.controller')
const userController = require('./user.controller')
const roleController = require('./role.controller')

module.exports = {
    authController,
    userController,
    roleController
}