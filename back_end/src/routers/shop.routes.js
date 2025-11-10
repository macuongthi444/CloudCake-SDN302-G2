const express = require('express')
const bodyParser = require('body-parser')
const { shopController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')
const uploadMiddleware = require('../middlewares/upload');

const ShopRouter = express.Router()
ShopRouter.use(bodyParser.json())

// Public routes
ShopRouter.get("/list", shopController.getAll)
ShopRouter.get("/find/:id", shopController.getById)

// Protected routes
ShopRouter.get("/my-shop", authJwt.verifyToken, shopController.getMyShop)
ShopRouter.post("/create", authJwt.verifyToken, shopController.create);
ShopRouter.put("/edit/:id", [authJwt.verifyToken, authJwt.isShopOwner], shopController.update);


// Lấy cửa hàng theo ID (chi tiết hơn, chỉ admin)
ShopRouter.get("/find/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.getById);

// Xóa cửa hàng (chỉ admin)
ShopRouter.delete("/delete/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.deleteShop);


// Duyệt cửa hàng (chỉ admin)
ShopRouter.put("/approve/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.approveShop);

// Từ chối duyệt cửa hàng (chỉ admin)
ShopRouter.put("/reject/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.rejectShop);

// Mở khóa cửa hàng đã bị khóa (chỉ admin)
ShopRouter.put("/unlock/:id", [authJwt.verifyToken, authJwt.isAdmin], shopController.unlockShop);
ShopRouter.post(
  "/upload/:id", 
  [authJwt.verifyToken, authJwt.isShopOwner], 
  uploadMiddleware.uploadShopImage, 
  shopController.uploadShopImage
);
module.exports = ShopRouter

