const express = require('express')
const bodyParser = require('body-parser')
const { productVariantController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const ProductVariantRouter = express.Router()
ProductVariantRouter.use(bodyParser.json())

// Public routes
/**
 * @swagger
 * tags:
 *   - name: ProductVariant
 *     description: Biến thể sản phẩm
 */
/**
 * @swagger
 * /api/product-variant/product/{productId}:
 *   get:
 *     summary: Danh sách biến thể theo sản phẩm
 *     tags: [ProductVariant]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
ProductVariantRouter.get("/product/:productId", productVariantController.getByProductId)
/**
 * @swagger
 * /api/product-variant/find/{id}:
 *   get:
 *     summary: Xem biến thể theo ID
 *     tags: [ProductVariant]
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
ProductVariantRouter.get("/find/:id", productVariantController.getById)

// Admin only - Get all variants with filters
/**
 * @swagger
 * /api/product-variant/list:
 *   get:
 *     summary: Danh sách biến thể (Admin)
 *     tags: [ProductVariant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
ProductVariantRouter.get(
    "/list",
    authJwt.verifyToken,
    authJwt.isAdmin,
    productVariantController.getAll
)

// Protected routes - require Seller or Admin
/**
 * @swagger
 * /api/product-variant/create:
 *   post:
 *     summary: Tạo biến thể
 *     tags: [ProductVariant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
ProductVariantRouter.post(
    "/create",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.create
)

/**
 * @swagger
 * /api/product-variant/edit/{id}:
 *   put:
 *     summary: Cập nhật biến thể
 *     tags: [ProductVariant]
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
ProductVariantRouter.put(
    "/edit/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.update
)

/**
 * @swagger
 * /api/product-variant/delete/{id}:
 *   delete:
 *     summary: Xóa biến thể
 *     tags: [ProductVariant]
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
ProductVariantRouter.delete(
    "/delete/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.deleteById
)

module.exports = ProductVariantRouter













