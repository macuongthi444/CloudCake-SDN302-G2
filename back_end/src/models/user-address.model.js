// user-address.model.js - Updated model registration
const mongoose = require('mongoose')
const { Schema } = mongoose

const addressSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User ID is required"]
    },
    address_line1: {
        type: String,
        required: [true, "Address line 1 is required"]
    },
    address_line2: {
        type: String
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    },
    phone: {
        type: String,
        validate: {
            validator: function (v) {
                // Updated regex for international phone numbers
                // Allows formats: 
                // - Country codes without + (e.g., 84xxxxxxxxx, 1xxxxxxxxxx)
                // - International numbers with various lengths (7-15 digits after country code)
                return /^[1-9][0-9]{0,3}[0-9]{7,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number`
        },
        required: [true, "Phone number is required"]
    }
}, {
    timestamps: true
})

// Change model registration to match the ref in order.model.js
const Address = mongoose.model("Address", addressSchema)
module.exports = Address