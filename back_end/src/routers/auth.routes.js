const express = require('express')
const bodyParser = require('body-parser')
const { authController } = require('../controller')
const VerifySignUp = require('../middlewares/verifySignUp')

const AuthRouter = express.Router()
AuthRouter.use(bodyParser.json())

// Route đăng ký người dùng
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/users'
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
AuthRouter.post("/signup", [VerifySignUp.checkExistUser, VerifySignUp.checkExistRoles], authController.signUp);

// Route đăng nhập người dùng
/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT
 *       401:
 *         description: Sai thông tin đăng nhập
 */
AuthRouter.post("/signin", authController.signIn);

// Route xác thực bằng Google
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Bắt đầu OAuth Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect đến Google
 */
AuthRouter.get('/google', authController.googleAuth);

// Route callback sau khi xác thực Google
/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback OAuth Google
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *       400:
 *         description: Lỗi callback
 */
AuthRouter.get('/google/callback', authController.googleAuthCallback);

module.exports = AuthRouter; // Xuất AuthRouter để sử dụng ở nơi khác