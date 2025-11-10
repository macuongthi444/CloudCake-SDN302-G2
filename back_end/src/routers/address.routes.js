const express = require('express')
const bodyParser = require('body-parser')
const addressController = require('../controller/address.controller')
const authJwt = require('../middlewares/jwtAuth')

const AddressRouter = express.Router()
AddressRouter.use(bodyParser.json())

/**
 * @swagger
 * tags:
 *   - name: Address
 *     description: Quản lý địa chỉ người dùng
 */

/**
 * @swagger
 * /api/address/list:
 *   get:
 *     summary: Danh sách địa chỉ (cần đăng nhập)
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
AddressRouter.get('/list', authJwt.verifyToken, addressController.getList)

/**
 * @swagger
 * /api/address/user/{userId}:
 *   get:
 *     summary: Lấy địa chỉ theo userId
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
AddressRouter.get('/user/:userId', authJwt.verifyToken, addressController.getByUserId)

/**
 * @swagger
 * /api/address/find/{id}:
 *   get:
 *     summary: Xem địa chỉ theo ID
 *     tags: [Address]
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
AddressRouter.get('/find/:id', authJwt.verifyToken, addressController.getById)

/**
 * @swagger
 * /api/address/create:
 *   post:
 *     summary: Tạo địa chỉ
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
AddressRouter.post('/create', authJwt.verifyToken, addressController.create)

/**
 * @swagger
 * /api/address/edit/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Address]
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
AddressRouter.put('/edit/:id', authJwt.verifyToken, addressController.update)

/**
 * @swagger
 * /api/address/delete/{id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Address]
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
AddressRouter.delete('/delete/:id', authJwt.verifyToken, addressController.deleteById)

module.exports = AddressRouter


