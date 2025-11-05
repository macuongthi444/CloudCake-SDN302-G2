const db = require("../models")
const Cart = db.cart
const createHttpError = require('http-errors')
const cache = require('../utils/cache')

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
        
        // Xóa cache khi tạo cart mới
        cache.delete(`cart:${userId}`);
        
        res.status(201).json(newCart)
    } catch (error) {
        next(error)
    }
}

// Get cart by user ID
async function getCartByUserId(req, res, next) {
    try {
        const { userID } = req.params
        
        // Cache cart data (cart thay đổi thường xuyên nhưng vẫn cache ngắn hạn)
        const cacheKey = `cart:${userID}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('Cache-Control', 'private, max-age=60'); // 1 minute
            return res.status(200).json(cached);
        }

        // Sử dụng .lean() để tăng tốc độ
        const cart = await Cart.findOne({ userId: userID })
            .populate('userId', 'firstName lastName email')
            .lean()

        if (!cart) {
            const emptyCart = {
                userId: userID,
                items: [],
                totalPrice: 0
            };
            cache.set(cacheKey, emptyCart, 60000); // Cache 1 phút
            return res.status(200).json(emptyCart)
        }

        // Cache cart
        cache.set(cacheKey, cart, 60000); // Cache 1 phút (cart thay đổi thường xuyên)
        
        res.set('Cache-Control', 'private, max-age=60');
        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Add item to cart
async function addItem(req, res, next) {
    try {
        const { userId, productId, variantId, productName, variantName, quantity, price, image } = req.body

        if (!userId || !productId || !variantId || !productName || !variantName || !quantity || !price) {
            throw createHttpError.BadRequest("Missing required fields: userId, productId, variantId, productName, variantName, quantity, price")
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

        // Check if same product variant already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId.toString() && 
                    item.variantId.toString() === variantId.toString()
        )

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            cart.items[existingItemIndex].quantity += quantity
        } else {
            // Add new item to cart
            cart.items.push({
                productId,
                variantId,
                productName,
                variantName,
                quantity,
                price,
                image
            })
        }

        await cart.save()
        
        // Xóa cache khi update cart
        cache.delete(`cart:${userId}`);
        
        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Update item quantity in cart
async function updateItem(req, res, next) {
    try {
        const { userId, productId, variantId, quantity } = req.body

        if (!userId || !productId || !variantId || !quantity) {
            throw createHttpError.BadRequest("Missing required fields: userId, productId, variantId, quantity")
        }

        if (quantity <= 0) {
            throw createHttpError.BadRequest("Quantity must be greater than 0")
        }

        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw createHttpError.NotFound("Cart not found")
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId.toString() && 
                    item.variantId.toString() === variantId.toString()
        )

        if (itemIndex === -1) {
            throw createHttpError.NotFound("Item not found in cart")
        }

        cart.items[itemIndex].quantity = quantity
        await cart.save()

        // Invalidate cache for this user's cart
        try {
            cache.delete(`cart:${userId}`)
        } catch (e) {
            console.warn('Cache delete failed for updateItem:', e.message)
        }

        res.status(200).json(cart)
    } catch (error) {
        next(error)
    }
}

// Remove item from cart
async function removeItem(req, res, next) {
    try {
        const { id } = req.params // variant ID
        // Get userId from query params or body (DELETE can have query params)
        const userId = req.query.userId || req.body.userId

        if (!userId) {
            throw createHttpError.BadRequest("User ID is required")
        }

        if (!id) {
            throw createHttpError.BadRequest("Variant ID is required")
        }

        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw createHttpError.NotFound("Cart not found")
        }

        const itemIndex = cart.items.findIndex(
            item => item.variantId && item.variantId.toString() === id.toString()
        )

        if (itemIndex === -1) {
            throw createHttpError.NotFound("Item not found in cart")
        }

        cart.items.splice(itemIndex, 1)
        await cart.save()

        // Invalidate cache when item removed
        try {
            cache.delete(`cart:${userId}`)
        } catch (e) {
            console.warn('Cache delete failed for removeItem:', e.message)
        }

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

        // Invalidate cache when cart cleared
        try {
            cache.delete(`cart:${id}`)
        } catch (e) {
            console.warn('Cache delete failed for clearCart:', e.message)
        }

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


