const db = require("../models")
const Category = db.category
const createHttpError = require('http-errors')

// Get all categories (public)
async function getAll(req, res, next) {
    try {
        const { isActive } = req.query
        const query = {}
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true'
        }

        const categories = await Category.find(query)
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean()
        
        res.status(200).json(categories)
    } catch (error) {
        next(error)
    }
}

// Get category by ID (public)
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const category = await Category.findById(id).lean()

        if (!category) {
            throw createHttpError.NotFound("Category not found")
        }

        res.status(200).json(category)
    } catch (error) {
        next(error)
    }
}

// Create category (Admin only)
async function create(req, res, next) {
    try {
        const { name, description, image, icon, parentId, sortOrder } = req.body

        if (!name) {
            throw createHttpError.BadRequest("Category name is required")
        }

        // Check if category name already exists
        const existing = await Category.findOne({ name })
        if (existing) {
            throw createHttpError.BadRequest("Category name already exists")
        }

        // If parentId provided, verify it exists
        if (parentId) {
            const parent = await Category.findById(parentId)
            if (!parent) {
                throw createHttpError.BadRequest("Parent category not found")
            }
        }

        const newCategory = new Category({
            name,
            description,
            image,
            icon,
            parentId: parentId || null,
            sortOrder: sortOrder || 0,
            isActive: true
        })

        await newCategory.save()
        res.status(201).json(newCategory)
    } catch (error) {
        next(error)
    }
}

// Update category (Admin only)
async function update(req, res, next) {
    try {
        const { id } = req.params
        const { name, description, image, icon, parentId, sortOrder, isActive } = req.body

        const category = await Category.findById(id)
        if (!category) {
            throw createHttpError.NotFound("Category not found")
        }

        // If name is being changed, check if new name already exists
        if (name && name !== category.name) {
            const existing = await Category.findOne({ name })
            if (existing) {
                throw createHttpError.BadRequest("Category name already exists")
            }
        }

        // If parentId is being changed, verify it exists and not creating circular reference
        if (parentId && parentId !== category.parentId?.toString()) {
            if (parentId === id) {
                throw createHttpError.BadRequest("Category cannot be its own parent")
            }
            const parent = await Category.findById(parentId)
            if (!parent) {
                throw createHttpError.BadRequest("Parent category not found")
            }
        }

        // Update fields
        if (name !== undefined) category.name = name
        if (description !== undefined) category.description = description
        if (image !== undefined) category.image = image
        if (icon !== undefined) category.icon = icon
        if (parentId !== undefined) category.parentId = parentId || null
        if (sortOrder !== undefined) category.sortOrder = sortOrder
        if (isActive !== undefined) category.isActive = isActive

        await category.save()
        res.status(200).json(category)
    } catch (error) {
        next(error)
    }
}

// Delete category (Admin only)
async function deleteById(req, res, next) {
    try {
        const { id } = req.params
        
        // Check if category has products
        const Product = db.product
        const productCount = await Product.countDocuments({ categoryId: id })
        
        if (productCount > 0) {
            throw createHttpError.BadRequest(`Cannot delete category. There are ${productCount} products using this category`)
        }

        // Check if has sub-categories
        const subCategoryCount = await Category.countDocuments({ parentId: id })
        if (subCategoryCount > 0) {
            throw createHttpError.BadRequest(`Cannot delete category. There are ${subCategoryCount} sub-categories`)
        }

        const category = await Category.findByIdAndDelete(id)
        if (!category) {
            throw createHttpError.NotFound("Category not found")
        }

        res.status(200).json({
            message: "Category deleted successfully",
            category
        })
    } catch (error) {
        next(error)
    }
}

const categoryController = {
    getAll,
    getById,
    create,
    update,
    deleteById
}

module.exports = categoryController
