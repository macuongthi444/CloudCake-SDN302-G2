const express = require('express')
const bodyParser = require('body-parser')
const { productController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')
const { uploadMultiple, uploadOptionalMultiple } = require('../middlewares/upload')

const ProductRouter = express.Router()
ProductRouter.use(bodyParser.json())

// Public routes - no auth required
ProductRouter.get("/list", productController.getAll)
ProductRouter.get("/find/:id", productController.getById)
ProductRouter.get("/shop/:shopId", productController.getByShop)

// Protected routes - require Seller or Admin
ProductRouter.post(
    "/create",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    uploadMultiple, // Allow multiple images
    productController.create
)

ProductRouter.put(
    "/edit/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    uploadOptionalMultiple, // Only uploads if files are present, ignores errors if no files
    productController.update
)

ProductRouter.delete(
    "/delete/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productController.deleteById
)

module.exports = ProductRouter


