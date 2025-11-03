const db = require("../models")
const ProductVariant = db.productVariant
const Product = db.product
const Shop = db.shop
const createHttpError = require('http-errors')

// Get variants by product ID (public)
async function getByProductId(req, res, next) {
    try {
        const { productId } = req.params
        const { isActive } = req.query

        const query = { productId }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true'
        }

        const variants = await ProductVariant.find(query)
            .sort({ 'attributes.size': 1, createdAt: -1 })
        
        res.status(200).json(variants)
    } catch (error) {
        next(error)
    }
}

// Get variant by ID (public)
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const variant = await ProductVariant.findById(id)
            .populate('productId', 'name shopId')

        if (!variant) {
            throw createHttpError.NotFound("Product variant not found")
        }

        res.status(200).json(variant)
    } catch (error) {
        next(error)
    }
}

// Create variant (Seller/Admin only)
async function create(req, res, next) {
    try {
        const userId = req.userId
        const {
            productId,
            name,
            attributes,
            price,
            discountedPrice,
            sku,
            weight,
            image,
            inventory
        } = req.body

        if (!productId || !name || !price) {
            throw createHttpError.BadRequest("ProductId, name, and price are required")
        }

        // Check permissions
        const product = await Product.findById(productId)
        if (!product) {
            throw createHttpError.NotFound("Product not found")
        }

        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')
        if (!isAdmin) {
            const shop = await Shop.findById(product.shopId)
            if (!shop || shop.ownerId.toString() !== userId) {
                throw createHttpError.Forbidden("You can only add variants to products from your own shop")
            }
        }

        const newVariant = new ProductVariant({
            productId,
            name,
            attributes: attributes || {},
            price,
            discountedPrice: discountedPrice || null,
            sku: sku || `VAR-${Date.now()}`,
            weight: weight || { value: 0, unit: 'g' },
            image: image || null,
            isActive: true,
            inventory: inventory || {
                quantity: 0,
                lowStockThreshold: 10,
                trackInventory: true
            }
        })

        await newVariant.save()
        res.status(201).json(newVariant)
    } catch (error) {
        next(error)
    }
}

// Update variant (Seller can only update their own, Admin can update any)
async function update(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const variant = await ProductVariant.findById(id).populate('productId')
        if (!variant) {
            throw createHttpError.NotFound("Variant not found")
        }

        // Check permissions
        if (!isAdmin) {
            const shop = await Shop.findById(variant.productId.shopId)
            if (!shop || shop.ownerId.toString() !== userId) {
                throw createHttpError.Forbidden("You can only update variants from your own shop")
            }
        }

        // Update fields
        const updatableFields = [
            'name', 'attributes', 'price', 'discountedPrice', 'sku',
            'weight', 'image', 'isActive', 'inventory'
        ]

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
                    variant[field] = { ...variant[field], ...req.body[field] }
                } else {
                    variant[field] = req.body[field]
                }
            }
        })

        await variant.save()
        res.status(200).json(variant)
    } catch (error) {
        next(error)
    }
}

// Delete variant (Seller can only delete their own, Admin can delete any)
async function deleteById(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const variant = await ProductVariant.findById(id).populate('productId')
        if (!variant) {
            throw createHttpError.NotFound("Variant not found")
        }

        // Check permissions
        if (!isAdmin) {
            const shop = await Shop.findById(variant.productId.shopId)
            if (!shop || shop.ownerId.toString() !== userId) {
                throw createHttpError.Forbidden("You can only delete variants from your own shop")
            }
        }

        await ProductVariant.findByIdAndDelete(id)
        res.status(200).json({
            message: "Variant deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}

const productVariantController = {
    getByProductId,
    getById,
    create,
    update,
    deleteById
}

module.exports = productVariantController




