const express = require('express')
const bodyParser = require('body-parser')
const { authController } = require('../controller')
const VerifySignUp = require('../middlewares/verifySignUp')

const AuthRouter = express.Router()
AuthRouter.use(bodyParser.json())

// Route đăng ký người dùng
AuthRouter.post("/signup", [VerifySignUp.checkExistUser, VerifySignUp.checkExistRoles], authController.signUp);

// Route đăng nhập người dùng
AuthRouter.post("/signin", authController.signIn);

// Route xác thực bằng Google
AuthRouter.get('/google', authController.googleAuth);

// Route callback sau khi xác thực Google
AuthRouter.get('/google/callback', authController.googleAuthCallback);

module.exports = AuthRouter; // Xuất AuthRouter để sử dụng ở nơi khác