const express = require('express')
const bodyParser = require('body-parser')
const { cartController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const CartRouter = express.Router()
CartRouter.use(bodyParser.json())

// Create a new cart
/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Quản lý giỏ hàng
 */
/**
 * @swagger
 * /api/cart/create:
 *   post:
 *     summary: Tạo giỏ hàng
 *     tags: [Cart]
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
CartRouter.post("/create", cartController.createCart)

// Get cart by user ID
/**
 * @swagger
 * /api/cart/user/{userID}:
 *   get:
 *     summary: Lấy giỏ hàng theo userID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
CartRouter.get("/user/:userID", cartController.getCartByUserId)

// Add item to cart
/**
 * @swagger
 * /api/cart/add-item:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: OK
 */
CartRouter.post("/add-item", cartController.addItem)

// Update item quantity in cart
/**
 * @swagger
 * /api/cart/update-item:
 *   put:
 *     summary: Cập nhật số lượng
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: OK
 */
CartRouter.put("/update-item", cartController.updateItem)

// Remove item from cart
/**
 * @swagger
 * /api/cart/remove-items/{id}:
 *   delete:
 *     summary: Xóa item trong giỏ
 *     tags: [Cart]
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
CartRouter.delete("/remove-items/:id", cartController.removeItem)

// Clear all items from cart
/**
 * @swagger
 * /api/cart/clear/{id}:
 *   delete:
 *     summary: Xóa toàn bộ giỏ
 *     tags: [Cart]
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
CartRouter.delete("/clear/:id", cartController.clearCart)

module.exports = CartRouter


