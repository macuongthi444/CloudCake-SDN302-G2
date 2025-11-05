const express = require('express')
const bodyParser = require('body-parser')
const { productVariantController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const ProductVariantRouter = express.Router()
ProductVariantRouter.use(bodyParser.json())

// Public routes
ProductVariantRouter.get("/product/:productId", productVariantController.getByProductId)
ProductVariantRouter.get("/find/:id", productVariantController.getById)

// Protected routes - require Seller or Admin
ProductVariantRouter.post(
    "/create",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.create
)

ProductVariantRouter.put(
    "/edit/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.update
)

ProductVariantRouter.delete(
    "/delete/:id",
    authJwt.verifyToken,
    authJwt.isSellerOrAdmin,
    productVariantController.deleteById
)

module.exports = ProductVariantRouter





