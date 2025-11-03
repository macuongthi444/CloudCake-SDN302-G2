// src/models/index.js
const mongoose = require('mongoose');
const User = require('./user.model');
const Role = require('./role.model');
const PaymentMethod = require('./payment-method.model');
const Cart = require('./cart.model');
const Category = require('./category.model');
const Shop = require('./shop.model');
const Product = require('./product.model');
const ProductVariant = require('./product-variant.model');
const Order = require('./order.model');
const Review = require('./review.model');
const Coupon = require('./coupon.model');
const ShippingMethod = require('./shipping-method.model');
const Address = require('./user-address.model');

// Cau hinh mongoose dang global
mongoose.Promise = global.Promise
// Dinh nghia doi tuong DB

const db = {}
db.mongoose = mongoose

// Bo sung cac thuoc tinh cho DB
db.user = User
db.role = Role
db.paymentMethod = PaymentMethod
db.cart = Cart
db.category = Category
db.shop = Shop
db.product = Product
db.productVariant = ProductVariant
db.order = Order
db.review = Review
db.coupon = Coupon
db.shippingMethod = ShippingMethod
db.address = Address
db.ROLES = ["MEMBER", "SELLER", "ADMIN"]

// Thuoc tinh tham chieu toi action ket noi CSDL
db.connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.DB_NAME,
    })
        .then(() => console.log("Connect to MongoDB success"))
        .catch(error => {
            console.error(error.message);
            process.exit()
        })
}

module.exports = db