const express = require('express')
const bodyParser = require('body-parser')
const { shopController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')
const uploadMiddleware = require('../middlewares/upload');

const ShopRouter = express.Router()
ShopRouter.use(bodyParser.json())

// Public routes
/**
 * @swagger
 * tags:
 *   - name: Shop
 *     description: Quản lý cửa hàng
 */
/**
 * @swagger
 * /api/shop/list:
 *   get:
 *     summary: Danh sách cửa hàng
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: OK
 */
ShopRouter.get("/list", shopController.getAll)
/**
 * @swagger
 * /api/shop/find/{id}:
 *   get:
 *     summary: Xem cửa hàng theo ID
 *     tags: [Shop]
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
ShopRouter.get("/find/:id", shopController.getById)

// Protected routes
/**
 * @swagger
 * /api/shop/my-shop:
 *   get:
 *     summary: Lấy cửa hàng của tôi
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
ShopRouter.get("/my-shop", authJwt.verifyToken, shopController.getMyShop)
/**
 * @swagger
 * /api/shop/create:
 *   post:
 *     summary: Tạo cửa hàng
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
ShopRouter.post("/create", authJwt.verifyToken, shopController.create);
/**
 * @swagger
 * /api/shop/edit/{id}:
 *   put:
 *     summary: Cập nhật cửa hàng (chủ shop)
 *     tags: [Shop]
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
ShopRouter.put("/edit/:id", [authJwt.verifyToken, authJwt.isShopOwner], shopController.update);


// Lấy cửa hàng theo ID (chi tiết hơn, chỉ admin)
/**
 * @swagger
 * /api/shop/find/{id}:
 *   get:
 *     summary: Xem chi tiết cửa hàng (Admin)
 *     tags: [Shop]
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
ShopRouter.get("/find/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.getById);

// Xóa cửa hàng (chỉ admin)
/**
 * @swagger
 * /api/shop/delete/{id}:
 *   delete:
 *     summary: Xóa cửa hàng (Admin)
 *     tags: [Shop]
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
ShopRouter.delete("/delete/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.deleteShop);


// Duyệt cửa hàng (chỉ admin)
/**
 * @swagger
 * /api/shop/approve/{id}:
 *   put:
 *     summary: Duyệt cửa hàng (Admin)
 *     tags: [Shop]
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
ShopRouter.put("/approve/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.approveShop);

// Từ chối duyệt cửa hàng (chỉ admin)
/**
 * @swagger
 * /api/shop/reject/{id}:
 *   put:
 *     summary: Từ chối cửa hàng (Admin)
 *     tags: [Shop]
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
ShopRouter.put("/reject/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.rejectShop);

// Mở khóa cửa hàng đã bị khóa (chỉ admin)
/**
 * @swagger
 * /api/shop/unlock/{id}:
 *   put:
 *     summary: Mở khóa cửa hàng (Admin)
 *     tags: [Shop]
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
ShopRouter.put("/unlock/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.unlockShop);
ShopRouter.post(
  "/upload/:id", 
  [authJwt.verifyToken, authJwt.isShopOwner], 
  uploadMiddleware.uploadShopImage, 
  shopController.uploadShopImage
);
ShopRouter.get(
  "/my-products",
  authJwt.verifyToken,
  shopController.getMyProducts
);
module.exports = ShopRouter

