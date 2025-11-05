const db = require("../models")
const Product = db.product
const ProductVariant = db.productVariant
const Shop = db.shop
const Category = db.category
const createHttpError = require('http-errors')
// const cache = require('../utils/cache') // Tạm thời comment để tránh lỗi

// Get all products (public - no auth required)
async function getAll(req, res, next) {
    try {
        const { 
            categoryId, 
            shopId, 
            search, 
            minPrice, 
            maxPrice,
            isActive,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = -1
        } = req.query

        // Build query
        const query = {}
        
        if (categoryId) query.categoryId = categoryId
        if (shopId) query.shopId = shopId
        if (isActive !== undefined) query.isActive = isActive === 'true'
        
        // Text search - sử dụng regex thay vì text index
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ]
        }
        
        // Price filter
        if (minPrice || maxPrice) {
            const priceConditions = []
            
            if (minPrice) {
                priceConditions.push(
                    { discountedPrice: { $gte: parseInt(minPrice) } },
                    { basePrice: { $gte: parseInt(minPrice) } }
                )
            }
            
            if (maxPrice) {
                priceConditions.push(
                    { discountedPrice: { $lte: parseInt(maxPrice) } },
                    { basePrice: { $lte: parseInt(maxPrice) } }
                )
            }
            
            // Nếu đã có $or từ search, dùng $and để combine
            if (query.$or) {
                query.$and = [
                    { $or: query.$or },
                    { $or: priceConditions }
                ]
                delete query.$or
            } else {
                query.$or = priceConditions
            }
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Sort
        const sort = { [sortBy]: parseInt(sortOrder) }

        // Cache tạm thời comment để tránh lỗi
        // const cacheKey = `products:${JSON.stringify({ categoryId, shopId, search, minPrice, maxPrice, isActive, limit, sortBy, sortOrder })}`;
        // if (parseInt(page) === 1) {
        //     const cached = cache.get(cacheKey);
        //     if (cached) {
        //         res.set('Cache-Control', 'public, max-age=300');
        //         return res.status(200).json(cached);
        //     }
        // }

        // Sử dụng .lean() để tăng tốc độ
        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .populate('shopId', 'name logo')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean() // Plain objects, nhanh hơn

        const total = await Product.countDocuments(query)

        const response = {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }

        // Cache tạm thời comment
        // if (parseInt(page) === 1) {
        //     cache.set(cacheKey, response, 300000);
        // }

        res.set('Cache-Control', 'public, max-age=300');
        res.status(200).json(response)
    } catch (error) {
        next(error)
    }
}

// Get product by ID (public)
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const product = await Product.findById(id)
            .populate('categoryId', 'name description')
            .populate('shopId', 'name logo address rating')
            .lean()

        if (!product) {
            throw createHttpError.NotFound("Product not found")
        }

        // Get variants for this product
        const variants = await ProductVariant.find({ 
            productId: id, 
            isActive: true 
        })
        .sort({ 'attributes.size': 1 })
        .lean()

        res.status(200).json({
            product,
            variants
        })
    } catch (error) {
        next(error)
    }
}

// Create new product (Seller/Admin only)
async function create(req, res, next) {
    try {
        const userId = req.userId
        const {
            name,
            description,
            shortDescription,
            categoryId,
            shopId, // Optional - if admin, can specify. If seller, use their shop
            basePrice,
            discountedPrice,
            sku,
            tags,
            ingredients,
            allergens,
            nutritionalInfo,
            weight,
            shelfLife
        } = req.body

        // Validate required fields
        if (!name || !categoryId || !basePrice) {
            throw createHttpError.BadRequest("Name, categoryId, and basePrice are required")
        }

        // Check if user is admin or seller
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')
        const isSeller = req.user.roles.some(role => role.name === 'SELLER')

        let finalShopId = shopId

        // If seller, get their shop
        if (isSeller && !isAdmin) {
            const userShop = await Shop.findOne({ ownerId: userId })
            if (!userShop) {
                throw createHttpError.BadRequest("You need to create a shop first")
            }
            if (!userShop.isActive || userShop.status !== 'ACTIVE') {
                throw createHttpError.Forbidden("Your shop is not active yet")
            }
            finalShopId = userShop._id
        } else if (isAdmin && !shopId) {
            throw createHttpError.BadRequest("Admin must specify shopId")
        }

        // Verify category exists
        const category = await Category.findById(categoryId)
        if (!category) {
            throw createHttpError.BadRequest("Category not found")
        }

        // Verify shop exists
        const shop = await Shop.findById(finalShopId)
        if (!shop) {
            throw createHttpError.BadRequest("Shop not found")
        }

        // If seller, verify they own the shop
        if (isSeller && !isAdmin && shop.ownerId.toString() !== userId) {
            throw createHttpError.Forbidden("You can only add products to your own shop")
        }

        // Process images from Cloudinary
        const images = []
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                images.push({
                    url: file.path,
                    isPrimary: index === 0,
                    alt: `${name} - Image ${index + 1}`
                })
            })
        } else if (req.file) {
            // Single image upload
            images.push({
                url: req.file.path,
                isPrimary: true,
                alt: name
            })
        }

        // Create product
        const newProduct = new Product({
            name,
            description,
            shortDescription,
            shopId: finalShopId,
            categoryId,
            basePrice,
            discountedPrice: discountedPrice || null,
            sku: sku || `PROD-${Date.now()}`,
            tags: tags || [],
            images,
            ingredients: ingredients || [],
            allergens: allergens || [],
            nutritionalInfo: nutritionalInfo || {},
            weight: weight || { value: 0, unit: 'g' },
            shelfLife: shelfLife || { value: 1, unit: 'days' },
            status: 'DRAFT',
            isActive: false // Needs admin approval if required
        })

        await newProduct.save()
        
        // Cache tạm thời comment
        // cache.clearPattern('products:');
        
        res.status(201).json({
            message: "Product created successfully",
            product: newProduct
        })
    } catch (error) {
        next(error)
    }
}

// Update product (Seller can only update their own, Admin can update any)
async function update(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const product = await Product.findById(id)
        if (!product) {
            throw createHttpError.NotFound("Product not found")
        }

        // Check permissions
        if (!isAdmin) {
            const shop = await Shop.findById(product.shopId)
            if (!shop || shop.ownerId.toString() !== userId) {
                throw createHttpError.Forbidden("You can only update products from your own shop")
            }
        }

        // Helper function to parse JSON strings
        const parseField = (value) => {
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(value)
                    return parsed
                } catch (e) {
                    console.warn('Failed to parse JSON string:', value, e.message)
                    return value
                }
            }
            return value
        }

        // Handle shopId update (Admin only)
        if (req.body.shopId && isAdmin) {
            const newShop = await Shop.findById(req.body.shopId)
            if (!newShop) {
                throw createHttpError.BadRequest("Shop not found")
            }
            product.shopId = req.body.shopId
        }

        // Update fields
        const updatableFields = [
            'name', 'description', 'shortDescription', 'categoryId',
            'basePrice', 'discountedPrice', 'sku', 'tags',
            'ingredients', 'allergens', 'nutritionalInfo', 'weight', 'shelfLife',
            'status', 'isActive'
        ]

        for (const field of updatableFields) {
            if (req.body[field] !== undefined) {
                // Parse JSON strings for complex fields
                if (['tags', 'ingredients', 'allergens', 'weight', 'shelfLife', 'nutritionalInfo'].includes(field)) {
                    const parsed = parseField(req.body[field])
                    if (field === 'weight' || field === 'shelfLife' || field === 'nutritionalInfo') {
                        // Objects
                        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                            product[field] = parsed
                        } else {
                            console.warn(`Field ${field} expected object but got:`, typeof parsed)
                            product[field] = parsed
                        }
                    } else {
                        // Arrays - handle comma-separated strings
                        if (typeof parsed === 'string' && !parsed.trim().startsWith('[')) {
                            // Comma-separated string, convert to array
                            product[field] = parsed.split(',').map(item => item.trim()).filter(item => item.length > 0)
                        } else if (Array.isArray(parsed)) {
                            product[field] = parsed
                        } else {
                            // Try to parse as array or default to empty array
                            product[field] = []
                        }
                    }
                } else if (['basePrice', 'discountedPrice'].includes(field)) {
                    // Convert to number
                    const numValue = req.body[field] === '' || req.body[field] === null ? null : parseFloat(req.body[field])
                    if (isNaN(numValue) && numValue !== null) {
                        throw createHttpError.BadRequest(`${field} must be a valid number`)
                    }
                    product[field] = numValue
                } else if (field === 'isActive') {
                    // Convert to boolean
                    product[field] = req.body[field] === 'true' || req.body[field] === true
                } else if (field === 'categoryId') {
                    // Validate category exists
                    const category = await Category.findById(req.body[field])
                    if (!category) {
                        throw createHttpError.BadRequest("Category not found")
                    }
                    product[field] = req.body[field]
                } else {
                    product[field] = req.body[field]
                }
            }
        }

        // Handle image updates
        // If existingImages is provided, replace all images with remaining existing + new ones
        if (req.body.existingImages !== undefined) {
            try {
                // Parse existingImages if it's a JSON string (from FormData)
                let existingImages = req.body.existingImages;
                if (typeof existingImages === 'string') {
                    try {
                        existingImages = JSON.parse(existingImages);
                    } catch (parseErr) {
                        console.warn('Could not parse existingImages as JSON, treating as empty:', parseErr);
                        existingImages = [];
                    }
                }
                
                // Start with remaining existing images
                product.images = Array.isArray(existingImages) ? existingImages : [];
                
                // Add new uploaded images
                if (req.files && req.files.length > 0) {
                    const newImages = req.files.map((file, index) => ({
                        url: file.path,
                        isPrimary: product.images.length === 0 && index === 0,
                        alt: `${product.name} - Image ${product.images.length + index + 1}`
                    }));
                    product.images = [...product.images, ...newImages];
                }
                
                // Ensure at least one image is primary
                if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
                    product.images[0].isPrimary = true;
                }
            } catch (parseErr) {
                console.error('Error parsing existingImages:', parseErr);
                // Fall through to default behavior
            }
        } else {
            // Default behavior: add new images to existing ones
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file, index) => ({
                    url: file.path,
                    isPrimary: product.images.length === 0 && index === 0,
                    alt: `${product.name} - Image ${product.images.length + index + 1}`
                }));
                product.images = [...product.images, ...newImages];
            } else if (req.file) {
                product.images.push({
                    url: req.file.path,
                    isPrimary: product.images.length === 0,
                    alt: product.name
                });
            }
        }

        // Validate before saving
        try {
            await product.validate()
        } catch (validationError) {
            console.error('Product validation error:', {
                errors: validationError.errors,
                message: validationError.message,
                name: validationError.name
            })
            const errorMessages = validationError.errors 
                ? Object.entries(validationError.errors).map(([key, err]) => `${key}: ${err.message}`).join(', ')
                : validationError.message || 'Validation failed'
            throw createHttpError.BadRequest(errorMessages)
        }

        // Try to save with better error handling
        try {
            await product.save()
        } catch (saveError) {
            console.error('Product save error:', {
                message: saveError.message,
                name: saveError.name,
                code: saveError.code,
                errors: saveError.errors
            })
            // Re-throw with better message
            if (saveError.name === 'ValidationError') {
                const errorMessages = saveError.errors 
                    ? Object.entries(saveError.errors).map(([key, err]) => `${key}: ${err.message}`).join(', ')
                    : saveError.message || 'Validation failed'
                throw createHttpError.BadRequest(errorMessages)
            }
            throw saveError
        }

        // Populate before sending response
        const updatedProduct = await Product.findById(product._id)
            .populate('categoryId', 'name')
            .populate('shopId', 'name logo')

        // Cache tạm thời comment
        // cache.clearPattern('products:');
        // cache.delete(`product:${id}`);

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct
        })
    } catch (error) {
        // Get product info if available
        let productInfo = null
        try {
            const productId = req.params.id
            const existingProduct = await Product.findById(productId)
            if (existingProduct) {
                productInfo = {
                    _id: existingProduct._id,
                    name: existingProduct.name,
                    shopId: existingProduct.shopId,
                    categoryId: existingProduct.categoryId
                }
            }
        } catch (e) {
            // Ignore error getting product info
        }

        console.error('Error updating product:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            errors: error.errors,
            body: req.body,
            product: productInfo
        })
        // If it's already an HTTP error, pass it through
        if (error.status) {
            return next(error)
        }
        // Otherwise, create a proper HTTP error
        if (error.name === 'ValidationError') {
            const validationMessage = error.message || 
                (error.errors ? Object.values(error.errors).map(e => e.message).join(', ') : 'Validation failed')
            return next(createHttpError.BadRequest(validationMessage))
        }
        if (error.name === 'CastError') {
            return next(createHttpError.BadRequest('Invalid ID format: ' + (error.message || error.value)))
        }
        // Ensure we always have a message
        const errorMessage = error.message || error.toString() || 'Failed to update product'
        next(createHttpError.InternalServerError(errorMessage))
    }
}

// Delete product (Seller can only delete their own, Admin can delete any)
async function deleteById(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const product = await Product.findById(id)
        if (!product) {
            throw createHttpError.NotFound("Product not found")
        }

        // Check permissions
        if (!isAdmin) {
            const shop = await Shop.findById(product.shopId)
            if (!shop || shop.ownerId.toString() !== userId) {
                throw createHttpError.Forbidden("You can only delete products from your own shop")
            }
        }

        // Delete associated variants
        await ProductVariant.deleteMany({ productId: id })

        // Delete product
        await Product.findByIdAndDelete(id)

        // Cache tạm thời comment
        // cache.clearPattern('products:');
        // cache.delete(`product:${id}`);

        res.status(200).json({
            message: "Product deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}

// Get products by shop
async function getByShop(req, res, next) {
    try {
        const { shopId } = req.params
        const products = await Product.find({ 
            shopId, 
            isActive: true 
        })
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })

        res.status(200).json(products)
    } catch (error) {
        next(error)
    }
}

const productController = {
    getAll,
    getById,
    create,
    update,
    deleteById,
    getByShop
}

module.exports = productController


