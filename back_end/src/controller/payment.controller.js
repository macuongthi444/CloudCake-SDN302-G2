const db = require("../models")
const PaymentMethod = db.paymentMethod
const createHttpError = require('http-errors')

// Get all payment methods
async function getList(req, res, next) {
    try {
        const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 })
        res.status(200).json(paymentMethods)
    } catch (error) {
        next(error)
    }
}

// Get payment method by ID
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const paymentMethod = await PaymentMethod.findById(id)

        if (!paymentMethod) {
            throw createHttpError.NotFound("Payment method not found")
        }

        res.status(200).json(paymentMethod)
    } catch (error) {
        next(error)
    }
}

// Create new payment method
async function create(req, res, next) {
    try {
        const { name, description, icon, paymentCode } = req.body

        // Validate required fields
        if (!name || !paymentCode) {
            throw createHttpError.BadRequest("Name and paymentCode are required")
        }

        // Check if paymentCode already exists
        const existingCode = await PaymentMethod.findOne({ paymentCode })
        if (existingCode) {
            throw createHttpError.BadRequest("Payment code already exists")
        }

        const newPaymentMethod = new PaymentMethod({
            name,
            description,
            icon,
            paymentCode,
            isActive: true
        })

        await newPaymentMethod.save()
        res.status(201).json(newPaymentMethod)
    } catch (error) {
        next(error)
    }
}

// Update payment method
async function update(req, res, next) {
    try {
        const { id } = req.params
        const { name, description, icon, paymentCode, isActive } = req.body

        const paymentMethod = await PaymentMethod.findById(id)
        if (!paymentMethod) {
            throw createHttpError.NotFound("Payment method not found")
        }

        // If paymentCode is being changed, check if new code already exists
        if (paymentCode && paymentCode !== paymentMethod.paymentCode) {
            const existingCode = await PaymentMethod.findOne({ paymentCode })
            if (existingCode) {
                throw createHttpError.BadRequest("Payment code already exists")
            }
        }

        // Update fields
        if (name !== undefined) paymentMethod.name = name
        if (description !== undefined) paymentMethod.description = description
        if (icon !== undefined) paymentMethod.icon = icon
        if (paymentCode !== undefined) paymentMethod.paymentCode = paymentCode
        if (isActive !== undefined) paymentMethod.isActive = isActive

        await paymentMethod.save()
        res.status(200).json(paymentMethod)
    } catch (error) {
        next(error)
    }
}

// Delete payment method
async function deleteById(req, res, next) {
    try {
        const { id } = req.params
        const paymentMethod = await PaymentMethod.findByIdAndDelete(id)

        if (!paymentMethod) {
            throw createHttpError.NotFound("Payment method not found")
        }

        res.status(200).json({
            message: "Payment method deleted successfully",
            paymentMethod
        })
    } catch (error) {
        next(error)
    }
}

// Toggle payment method status
async function toggleStatus(req, res, next) {
    try {
        const { id } = req.params
        const paymentMethod = await PaymentMethod.findById(id)

        if (!paymentMethod) {
            throw createHttpError.NotFound("Payment method not found")
        }

        // Toggle status
        paymentMethod.isActive = !paymentMethod.isActive
        await paymentMethod.save()

        res.status(200).json({
            message: "Payment method status updated successfully",
            paymentMethod
        })
    } catch (error) {
        next(error)
    }
}

const paymentController = {
    getList,
    getById,
    create,
    update,
    deleteById,
    toggleStatus
}

module.exports = paymentController


