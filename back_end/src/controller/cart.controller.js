const db = require("../models")
const Cart = db.cart
const createHttpError = require('http-errors')

// Create a new cart
async function createCart(req, res, next) {
    try {
        const { userId } = req.body

        if (!userId) {
            throw createHttpError.BadRequest("User ID is required")
        }

        // Check if cart already exists for this user
        const existingCart = await Cart.findOne({ userId })
        if (existingCart) {
            return res.status(200).json(existingCart)
        }

        const newCart = new Cart({
            userId,
            items: [],
            totalPrice: 0
        })

        await newCart.save()
        res.status(201).json(newCart)
    } catch (error) {
        next(error)
    }
}

// Get cart by user ID
async function getCartByUserId(req, res, next) {
    try {
        const { userID } = req.params
        const cart = await Cart.findOne({ userId: userID }).populate('userId', 'firstName lastName email')

        if (!cart) {
            return res.status(200).json({
                userId: userID,
                items: [],
                totalPrice: 0
            })
        }

        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Add item to cart
async function addItem(req, res, next) {
    try {
        const { userId, productId, productName, quantity, price, image } = req.body

        if (!userId || !productId || !productName || !quantity || !price) {
            throw createHttpError.BadRequest("Missing required fields")
        }

        if (quantity <= 0) {
            throw createHttpError.BadRequest("Quantity must be greater than 0")
        }

        if (price <= 0) {
            throw createHttpError.BadRequest("Price must be greater than 0")
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId })
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                totalPrice: 0
            })
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId.toString()
        )

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            cart.items[existingItemIndex].quantity += quantity
        } else {
            // Add new item to cart
            cart.items.push({
                productId,
                productName,
                quantity,
                price,
                image
            })
        }

        await cart.save()
        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Update item quantity in cart
async function updateItem(req, res, next) {
    try {
        const { userId, productId, quantity } = req.body

        if (!userId || !productId || !quantity) {
            throw createHttpError.BadRequest("Missing required fields")
        }

        if (quantity <= 0) {
            throw createHttpError.BadRequest("Quantity must be greater than 0")
        }

        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw createHttpError.NotFound("Cart not found")
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId.toString()
        )

        if (itemIndex === -1) {
            throw createHttpError.NotFound("Item not found in cart")
        }

        cart.items[itemIndex].quantity = quantity
        await cart.save()

        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Remove item from cart
async function removeItem(req, res, next) {
    try {
        const { id } = req.params // product ID
        const { userId } = req.body

        if (!userId) {
            throw createHttpError.BadRequest("User ID is required")
        }

        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw createHttpError.NotFound("Cart not found")
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === id.toString()
        )

        if (itemIndex === -1) {
            throw createHttpError.NotFound("Item not found in cart")
        }

        cart.items.splice(itemIndex, 1)
        await cart.save()

        res.status(200).json({
            message: "Item removed from cart successfully",
            cart
        })
    } catch (error) {
        next(error)
    }
}

// Clear all items from cart
async function clearCart(req, res, next) {
    try {
        const { id } = req.params // user ID

        const cart = await Cart.findOne({ userId: id })

        if (!cart) {
            throw createHttpError.NotFound("Cart not found")
        }

        cart.items = []
        cart.totalPrice = 0
        await cart.save()

        res.status(200).json({
            message: "Cart cleared successfully",
            cart
        })
    } catch (error) {
        next(error)
    }
}

const cartController = {
    createCart,
    getCartByUserId,
    addItem,
    updateItem,
    removeItem,
    clearCart
}

module.exports = cartController


