const express = require('express')
const bodyParser = require('body-parser')
const { productController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')
const { uploadMultiple, uploadOptionalMultiple } = require('../middlewares/upload')

const ProductRouter = express.Router()
ProductRouter.use(bodyParser.json())

// Public routes - no auth required
/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Quản lý sản phẩm
 */
/**
 * @swagger
 * /api/product/list:
 *   get:
 *     summary: Danh sách sản phẩm
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: OK
 */
ProductRouter.get("/list", productController.getAll)
/**
 * @swagger
 * /api/product/find/{id}:
 *   get:
 *     summary: Chi tiết sản phẩm
 *     tags: [Product]
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
ProductRouter.get("/find/:id", productController.getById)
/**
 * @swagger
 * /api/product/shop/{shopId}:
 *   get:
 *     summary: Sản phẩm theo Shop
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
ProductRouter.get("/shop/:shopId", productController.getByShop)

// Protected routes - require Seller or Admin
/**
 * @swagger
 * /api/product/create:
 *   post:
 *     summary: Tạo sản phẩm
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
ProductRouter.post(
    "/create",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    uploadMultiple, // Allow multiple images
    productController.create
)

/**
 * @swagger
 * /api/product/edit/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
ProductRouter.put(
    "/edit/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    uploadOptionalMultiple, // Only uploads if files are present, ignores errors if no files
    productController.update
)

/**
 * @swagger
 * /api/product/delete/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [Product]
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
ProductRouter.delete(
    "/delete/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productController.deleteById
)

module.exports = ProductRouter


