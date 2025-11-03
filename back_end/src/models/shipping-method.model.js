const mongoose = require('mongoose')
const { Schema } = mongoose

const shippingMethodSchema = new Schema({
    name: {
        type: String,
        required: [true, "Shipping method name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        uppercase: true
        // VD: "STANDARD", "EXPRESS", "SAME_DAY"
    },
    feeType: {
        type: String,
        enum: ['FIXED', 'WEIGHT_BASED', 'DISTANCE_BASED', 'FREE'],
        default: 'FIXED'
    },
    baseFee: {
        type: Number,
        default: 0,
        min: 0
    },
    perKgFee: {
        type: Number,
        default: 0,
        min: 0 // For weight-based
    },
    perKmFee: {
        type: Number,
        default: 0,
        min: 0 // For distance-based
    },
    estimatedDays: {
        min: {
            type: Number,
            default: 1,
            min: 1
        },
        max: {
            type: Number,
            default: 3,
            min: 1
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    applicableAreas: [{
        city: String,
        district: String,
        fee: Number // Override fee for specific area
    }],
    freeShippingThreshold: {
        type: Number,
        default: null, // Miễn phí ship nếu đơn >= số tiền này
        min: 0
    },
    icon: {
        type: String, // URL to icon
        trim: true
    }
}, {
    timestamps: true
})

// Indexes
shippingMethodSchema.index({ isActive: 1 })
shippingMethodSchema.index({ code: 1 })

// Method to calculate shipping fee
shippingMethodSchema.methods.calculateFee = function(options = {}) {
    const { weight = 0, distance = 0, orderAmount = 0 } = options

    // Check free shipping threshold
    if (this.freeShippingThreshold && orderAmount >= this.freeShippingThreshold) {
        return 0
    }

    let fee = this.baseFee

    if (this.feeType === 'WEIGHT_BASED' && weight > 0) {
        fee += weight * this.perKgFee
    } else if (this.feeType === 'DISTANCE_BASED' && distance > 0) {
        fee += distance * this.perKmFee
    } else if (this.feeType === 'FREE') {
        return 0
    }

    // Check area-specific fee
    if (options.city && this.applicableAreas && this.applicableAreas.length > 0) {
        const areaFee = this.applicableAreas.find(
            area => area.city === options.city && 
                   (!options.district || area.district === options.district)
        )
        if (areaFee && areaFee.fee !== undefined) {
            return areaFee.fee
        }
    }

    return Math.round(fee)
}

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema)
module.exports = ShippingMethod





