const express = require('express')
const bodyParser = require('body-parser')
const { shopController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const ShopRouter = express.Router()
ShopRouter.use(bodyParser.json())

// Public routes
ShopRouter.get("/list", shopController.getAll)
ShopRouter.get("/find/:id", shopController.getById)

// Protected routes
ShopRouter.get("/my-shop", authJwt.verifyToken, shopController.getMyShop)
ShopRouter.post("/create", authJwt.verifyToken, authJwt.isSeller, shopController.create)
ShopRouter.put("/edit/:id", authJwt.verifyToken, authJwt.isSellerOrAdmin, shopController.update)
ShopRouter.put("/status/:id", authJwt.verifyToken, authJwt.isAdmin, shopController.updateStatus)

module.exports = ShopRouter














