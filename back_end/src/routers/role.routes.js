const express = require('express')
const bodyParser = require('body-parser')
const { roleController } = require('../controller')

const RoleRouter = express.Router()
RoleRouter.use(bodyParser.json())

/**
 * @swagger
 * tags:
 *   - name: Role
 *     description: Vai trò người dùng
 */

/**
 * @swagger
 * /api/role/create:
 *   post:
 *     summary: Tạo vai trò
 *     tags: [Role]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
RoleRouter.post("/create", roleController.create)

/**
 * @swagger
 * /api/role/all:
 *   get:
 *     summary: Danh sách vai trò
 *     tags: [Role]
 *     responses:
 *       200:
 *         description: OK
 */
RoleRouter.get("/all", roleController.getAllRoles)

module.exports = RoleRouter