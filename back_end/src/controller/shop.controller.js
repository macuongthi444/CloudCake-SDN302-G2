const db = require("../models")
const Shop = db.shop
const User = db.user
const createHttpError = require('http-errors')

// Get all shops (public)
async function getAll(req, res, next) {
    try {
        const { status, isActive } = req.query
        const query = {}
        
        if (status) query.status = status
        if (isActive !== undefined) query.isActive = isActive === 'true'

        const shops = await Shop.find(query)
            .populate('ownerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean() // Tối ưu performance
        
        res.status(200).json(shops)
    } catch (error) {
        next(error)
    }
}

// Get shop by ID (public)
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const shop = await Shop.findById(id)
            .populate('ownerId', 'firstName lastName email')

        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        res.status(200).json(shop)
    } catch (error) {
        next(error)
    }
}

// Get shop by owner ID (protected)
async function getMyShop(req, res, next) {
    try {
        const userId = req.userId
        
        const shop = await Shop.findOne({ ownerId: userId })
            .populate('ownerId', 'firstName lastName email')

        if (!shop) {
            return res.status(200).json(null)
        }

        res.status(200).json(shop)
    } catch (error) {
        next(error)
    }
}

// Create shop (Seller only)
async function create(req, res, next) {
    try {
        const userId = req.userId
        
        // Check if user already has a shop
        const existingShop = await Shop.findOne({ ownerId: userId })
        if (existingShop) {
            throw createHttpError.BadRequest("You already have a shop")
        }

        const {
            name,
            description,
            logo,
            coverImage,
            address,
            phone,
            email,
            openingHours,
            bankAccount
        } = req.body

        if (!name) {
            throw createHttpError.BadRequest("Shop name is required")
        }

        const newShop = new Shop({
            name,
            description,
            logo,
            coverImage,
            ownerId: userId,
            address: address || {},
            phone,
            email,
            openingHours: openingHours || {},
            bankAccount: bankAccount || {},
            status: 'PENDING',
            isActive: false
        })

        await newShop.save()
        
        const populatedShop = await Shop.findById(newShop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(201).json(populatedShop)
    } catch (error) {
        next(error)
    }
}

// Update shop (Owner or Admin)
async function update(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const shop = await Shop.findById(id)
        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        // Check permissions
        if (!isAdmin && shop.ownerId.toString() !== userId) {
            throw createHttpError.Forbidden("You can only update your own shop")
        }

        // Update fields
        const updatableFields = [
            'name', 'description', 'logo', 'coverImage',
            'address', 'phone', 'email', 'openingHours', 'bankAccount'
        ]

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object') {
                    shop[field] = { ...shop[field], ...req.body[field] }
                } else {
                    shop[field] = req.body[field]
                }
            }
        })

        await shop.save()
        
        const populatedShop = await Shop.findById(shop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(200).json(populatedShop)
    } catch (error) {
        next(error)
    }
}

// Update shop status (Admin only)
async function updateStatus(req, res, next) {
    try {
        const { id } = req.params
        const { status } = req.body

        if (!['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].includes(status)) {
            throw createHttpError.BadRequest("Invalid status")
        }

        const shop = await Shop.findById(id)
        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        shop.status = status
        shop.isActive = status === 'ACTIVE'

        await shop.save()
        
        const populatedShop = await Shop.findById(shop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(200).json({
            message: "Shop status updated successfully",
            shop: populatedShop
        })
    } catch (error) {
        next(error)
    }
}

const shopController = {
    getAll,
    getById,
    getMyShop,
    create,
    update,
    updateStatus
}

module.exports = shopController





