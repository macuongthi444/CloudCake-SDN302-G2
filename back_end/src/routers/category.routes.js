const express = require('express')
const bodyParser = require('body-parser')
const { categoryController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const CategoryRouter = express.Router()
CategoryRouter.use(bodyParser.json())

// Public routes
/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: Danh mục sản phẩm
 */
/**
 * @swagger
 * /api/category/list:
 *   get:
 *     summary: Danh sách danh mục
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: OK
 */
CategoryRouter.get("/list", categoryController.getAll)
/**
 * @swagger
 * /api/category/find/{id}:
 *   get:
 *     summary: Chi tiết danh mục
 *     tags: [Category]
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
CategoryRouter.get("/find/:id", categoryController.getById)

// Admin only routes
/**
 * @swagger
 * /api/category/create:
 *   post:
 *     summary: Tạo danh mục (Admin)
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
CategoryRouter.post("/create", authJwt.verifyToken, authJwt.isAdmin, categoryController.create)
/**
 * @swagger
 * /api/category/edit/{id}:
 *   put:
 *     summary: Cập nhật danh mục (Admin)
 *     tags: [Category]
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
CategoryRouter.put("/edit/:id", authJwt.verifyToken, authJwt.isAdmin, categoryController.update)
/**
 * @swagger
 * /api/category/delete/{id}:
 *   delete:
 *     summary: Xóa danh mục (Admin)
 *     tags: [Category]
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
CategoryRouter.delete("/delete/:id", authJwt.verifyToken, authJwt.isAdmin, categoryController.deleteById)

module.exports = CategoryRouter














