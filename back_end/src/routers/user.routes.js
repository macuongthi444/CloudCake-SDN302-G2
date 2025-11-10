const express = require('express')
const bodyParser = require('body-parser')
const { userController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')


const userRouter = express.Router()
userRouter.use(bodyParser.json())

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Quản lý người dùng
 */

/**
 * @swagger
 * /api/user/create:
 *   post:
 *     summary: Tạo người dùng
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/users'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
userRouter.post("/create", userController.create)

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
userRouter.get("/list", userController.getAllUser)

/**
 * @swagger
 * /api/user/edit/{id}:
 *   put:
 *     summary: Cập nhật người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
userRouter.put("/edit/:id", userController.update)

/**
 * @swagger
 * /api/user/delete/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     tags: [User]
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
 *         description: Xóa thành công
 */
userRouter.delete("/delete/:id", userController.deleteUser)

/**
 * @swagger
 * /api/user/find/{email}:
 *   get:
 *     summary: Tìm người dùng theo email
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 */
userRouter.get("/find/:email",userController.existedUser)

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Truy cập công khai
 *     tags: [User]
 *     responses:
 *       200:
 *         description: OK
 */
userRouter.get("/all", userController.accessAll)

/**
 * @swagger
 * /api/user/member:
 *   get:
 *     summary: Truy cập vai trò Member
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
userRouter.get("/member", [authJwt.verifyToken] ,userController.accessByMember)

/**
 * @swagger
 * /api/user/admin:
 *   get:
 *     summary: Truy cập vai trò Admin
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
userRouter.get("/admin", [authJwt.verifyToken], [authJwt.isAdmin] ,userController.accessByAdmin)

/**
 * @swagger
 * /api/user/seller:
 *   get:
 *     summary: Truy cập vai trò Seller
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
userRouter.get("/seller", [authJwt.verifyToken], [authJwt.isSeller] ,userController.accessBySeller)


/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Lấy người dùng theo ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 */
userRouter.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Quên mật khẩu
 *     tags: [User]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Đã gửi email reset
 */
userRouter.post('/forgot-password', userController.forgotPassword);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [User]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
userRouter.post('/reset-password', userController.resetPassword);
module.exports = userRouter;