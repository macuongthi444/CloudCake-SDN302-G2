const express = require('express')
const bodyParser = require('body-parser')
const { cartController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const CartRouter = express.Router()
CartRouter.use(bodyParser.json())

// Create a new cart
CartRouter.post("/create", cartController.createCart)

// Get cart by user ID
CartRouter.get("/user/:userID", cartController.getCartByUserId)

// Add item to cart
CartRouter.post("/add-item", cartController.addItem)

// Update item quantity in cart
CartRouter.put("/update-item", cartController.updateItem)

// Remove item from cart
CartRouter.delete("/remove-items/:id", cartController.removeItem)

// Clear all items from cart
CartRouter.delete("/clear/:id", cartController.clearCart)

module.exports = CartRouter


