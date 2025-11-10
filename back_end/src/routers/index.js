const AuthRouter = require('./auth.routes')
const UserRouter = require('./user.routes')
const RoleRouter = require('./role.routes')
const PaymentRouter = require('./payment.routes')
const CartRouter = require('./cart.routes')
const ProductRouter = require('./product.routes')
const ProductVariantRouter = require('./product-variant.routes')
const CategoryRouter = require('./category.routes')
const ShopRouter = require('./shop.routes')
const OrderRouter = require('./order.routes')
const AddressRouter = require('./address.routes')
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

AuthRouter.use(limiter);
UserRouter.use(limiter);
RoleRouter.use(limiter);
PaymentRouter.use(limiter);
CartRouter.use(limiter);
ProductRouter.use(limiter);
ProductVariantRouter.use(limiter);
CategoryRouter.use(limiter);
ShopRouter.use(limiter);
OrderRouter.use(limiter);
AddressRouter.use(limiter);
module.exports = {
    AuthRouter,
    UserRouter,
    RoleRouter,
    PaymentRouter,
    CartRouter,
    ProductRouter,
    ProductVariantRouter,
    CategoryRouter,
    ShopRouter,
    OrderRouter,
    AddressRouter
}

