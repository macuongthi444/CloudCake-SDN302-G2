const express = require('express');
const { shopController } = require('../controller');
const VerifyJwt = require('../middlewares/verifyJwt');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

const shopRouter = express.Router();

//================ ROUTES CÔNG KHAI (PUBLIC) ================//
// Lấy danh sách tất cả cửa hàng đang hoạt động (cho người dùng chưa đăng nhập)
shopRouter.get("/public", shopController.getAllShops);

// Lấy thông tin cửa hàng theo ID (cho người dùng chưa đăng nhập)
shopRouter.get("/public/:id", shopController.getShopById);

//================ ROUTES YÊU CẦU ĐĂNG NHẬP ================//
// Tạo cửa hàng mới (bất kỳ ai đã đăng nhập)
shopRouter.post("/create", VerifyJwt.verifyToken, shopController.createShop);

// Lấy cửa hàng của người dùng hiện tại
shopRouter.get("/my-shop", VerifyJwt.verifyToken, shopController.getShopByUserId);

// Cập nhật thông tin cửa hàng (của chính họ hoặc admin)
shopRouter.put("/edit/:id", [VerifyJwt.verifyToken, VerifyJwt.isShopOwner], shopController.updateShop);

// Upload hình ảnh cho cửa hàng (logo hoặc image_cover)
// Sử dụng middleware đã cập nhật để xử lý upload qua Cloudinary
shopRouter.post(
  "/upload/:id", 
  [VerifyJwt.verifyToken, VerifyJwt.isShopOwner], 
  uploadMiddleware.uploadShopImage, 
  shopController.uploadShopImage
);

//================ ROUTES CHỈ CHO ADMIN ================//
// Lấy tất cả cửa hàng (kể cả pending, chỉ admin)
shopRouter.get("/list", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.getAllShops);

// Lấy cửa hàng theo ID (chi tiết hơn, chỉ admin)
shopRouter.get("/find/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.getShopById);

// Xóa cửa hàng (chỉ admin)
shopRouter.delete("/delete/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.deleteShop);

// Thống kê cửa hàng (cho cả admin và seller)
shopRouter.get("/statistics", [VerifyJwt.verifyToken, VerifyJwt.isAdminOrSeller], shopController.getShopStatistics);

// Duyệt cửa hàng (chỉ admin)
shopRouter.put("/approve/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.approveShop);

// Từ chối duyệt cửa hàng (chỉ admin)
shopRouter.put("/reject/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.rejectShop);

// Mở khóa cửa hàng đã bị khóa (chỉ admin)
shopRouter.put("/unlock/:id", [VerifyJwt.verifyToken, VerifyJwt.isAdmin], shopController.unlockShop);

module.exports = shopRouter;