// ============================================
// ORDER CONTROLLER
// ============================================
// This controller handles both old and new Order models
// Old model: order_status, customer_id, etc.
// New model: status, paymentStatus, userId, etc.

// ============================================
// IMPORTS
// ============================================
const db = require("../models");
const Order = db.order;
const OrderDetail = db.orderDetail;
const Product = db.product;
const Discount = db.discount;
const Coupon = db.coupon;
const createHttpError = require('http-errors');
const Cart = db.cart;
const PaymentMethod = db.paymentMethod;
const User = db.user;
const Address = db.address;

// ============================================
// OLD MODEL FUNCTIONS (order_status, customer_id)
// ============================================

// Lấy tất cả đơn đặt hàng (tương thích cả model cũ và mới)
const getAllOrders = async (req, res) => {
    try {
        // Thử query theo model mới trước
        try {
            const modernOrders = await Order.find({ is_delete: { $ne: true } })
                .populate('userId', 'firstName lastName email phone')
                .populate('shopId', 'name')
                .populate('paymentMethodId', 'name paymentCode')
                .populate('shippingMethodId', 'name')
                .sort({ createdAt: -1 })
                .lean();
            
            if (Array.isArray(modernOrders) && modernOrders.length > 0) {
                return res.status(200).json(modernOrders);
            }
        } catch (e) {
            // Bỏ qua, fallback xuống model cũ
        }

        // Fallback: query theo model cũ, tắt strictPopulate để tránh lỗi path không có trong schema
        const legacyOrders = await Order.find({ is_delete: { $ne: true } })
            .setOptions({ strictPopulate: false })
            .populate({
                path: 'customer_id',
                model: 'users',
                select: 'firstName lastName email phone'
            })
            .populate('shipping_id')
            .populate('payment_id')
            .populate('discount_id')
            .populate('coupon_id')
            .populate('user_address_id')
            .lean();

        return res.status(200).json(legacyOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy đơn đặt hàng theo ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'customer_id',
                model: 'users',
                select: 'firstName lastName email phone'
            })
            .populate('shipping_id')
            .populate('payment_id')
            .populate('discount_id')
            .populate('coupon_id')
            .populate('user_address_id');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderDetails = await OrderDetail.find({ order_id: order._id })
            .populate('product_id')
            .populate('variant_id')
            .populate('discount_id');

        res.status(200).json({ order, orderDetails });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy đơn đặt hàng theo ID người dùng
const getOrdersByUserId = async (req, res) => {
    try {
        const orders = await Order.find({
            customer_id: req.params.userId,
            is_delete: false
        })
            .populate({
                path: 'customer_id',
                model: 'users',
                select: 'firstName lastName email phone'
            })
            .populate('shipping_id')
            .populate('payment_id')
            .populate('discount_id')
            .populate('coupon_id')
            .populate('user_address_id')
            .sort({ created_at: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo đơn đặt hàng mới (old model)
const createOrder = async (req, res) => {
    try {
        const {
            customer_id,
            shipping_id,
            payment_id,
            order_payment_id,
            discount_id,
            coupon_id,
            orderItems,
            user_address_id,
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        let totalPrice = 0;
        let originalPrice = 0;
        let categoryIds = [];
        let productIds = [];

        for (const item of orderItems) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found` });
            }

            productIds.push(product._id.toString());

            let itemPrice = product.price;

            if (item.variant_id) {
                try {
                    const variant = await db.productVariant.findById(item.variant_id);
                    if (variant) {
                        if (variant.stock < item.quantity) {
                            return res.status(400).json({
                                message: `Not enough stock for variant ${variant.name || 'unnamed'} of product ${product.name}. Available: ${variant.stock}`
                            });
                        }
                        if (variant.price) {
                            itemPrice = variant.price;
                        }
                    }
                } catch (err) {
                    console.log(`Could not fetch variant price, using product price: ${itemPrice}`);
                }
            } else {
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Not enough stock for product ${product.name}. Available: ${product.stock}`
                    });
                }
            }

            if (item.price) {
                itemPrice = item.price;
            }

            const itemTotal = itemPrice * item.quantity;
            totalPrice += itemTotal;
            originalPrice += itemTotal;

            if (product.category_id) {
                if (Array.isArray(product.category_id)) {
                    categoryIds = [...categoryIds, ...product.category_id.map(cat => cat.toString())];
                } else {
                    categoryIds.push(product.category_id.toString());
                }
            }
        }

        categoryIds = [...new Set(categoryIds)];
        productIds = [...new Set(productIds)];

        let discountAmount = 0;
        let couponAmount = 0;
        let finalTotalPrice = totalPrice;

        if (discount_id) {
            const discount = await Discount.findById(discount_id);
            if (discount) {
                const now = new Date();
                if (discount.is_active &&
                    !discount.is_delete &&
                    new Date(discount.start_date) <= now &&
                    new Date(discount.end_date) >= now &&
                    totalPrice >= discount.min_order_value) {

                    if (discount.type_price === 'fixed') {
                        discountAmount = discount.value;
                    } else {
                        discountAmount = (totalPrice * discount.value) / 100;
                    }

                    if (discount.max_uses > 0) {
                        const usageHistory = discount.history || {};
                        const totalUsed = Object.values(usageHistory).reduce((sum, current) => sum + current, 0);
                        if (totalUsed >= discount.max_uses) {
                            return res.status(400).json({ message: "Discount code has reached maximum uses" });
                        }
                    }

                    if (discount.max_uses_per_user > 0) {
                        const usageHistory = discount.history || {};
                        const userUsage = usageHistory[customer_id] || 0;
                        if (userUsage >= discount.max_uses_per_user) {
                            return res.status(400).json({
                                message: "You have reached maximum uses for this discount code"
                            });
                        }
                    }

                    const usageHistory = discount.history || {};
                    usageHistory[customer_id] = (usageHistory[customer_id] || 0) + 1;
                    discount.history = usageHistory;
                    await discount.save();
                }
            }
        }

        if (coupon_id) {
            const coupon = await Coupon.findById(coupon_id);
            if (coupon) {
                const now = new Date();
                if (coupon.is_active &&
                    !coupon.is_delete &&
                    new Date(coupon.start_date) <= now &&
                    new Date(coupon.end_date) >= now &&
                    totalPrice >= coupon.min_order_value) {

                    let isEligible = true;
                    let eligibleAmount = totalPrice;

                    if (coupon.product_id) {
                        const eligibleItems = orderItems.filter(item =>
                            item.product_id.toString() === coupon.product_id.toString()
                        );
                        if (eligibleItems.length === 0) {
                            isEligible = false;
                        } else {
                            eligibleAmount = 0;
                            for (const item of eligibleItems) {
                                const product = await Product.findById(item.product_id);
                                let itemPrice = product.price;
                                if (item.variant_id) {
                                    const variant = await db.productVariant.findById(item.variant_id);
                                    if (variant && variant.price) {
                                        itemPrice = variant.price;
                                    }
                                }
                                if (item.price) {
                                    itemPrice = item.price;
                                }
                                eligibleAmount += itemPrice * item.quantity;
                            }
                        }
                    }

                    if (isEligible && coupon.category_id) {
                        const categoryMatch = categoryIds.includes(coupon.category_id.toString());
                        if (!categoryMatch) {
                            isEligible = false;
                        }
                    }

                    if (isEligible) {
                        if (coupon.type === 'fixed') {
                            couponAmount = coupon.value;
                        } else {
                            couponAmount = (eligibleAmount * coupon.value) / 100;
                            if (coupon.max_discount_value && couponAmount > coupon.max_discount_value) {
                                couponAmount = coupon.max_discount_value;
                            }
                        }

                        if (coupon.max_uses > 0) {
                            const totalUsed = Array.from(coupon.history.values()).reduce((sum, count) => sum + count, 0);
                            if (totalUsed >= coupon.max_uses) {
                                return res.status(400).json({
                                    message: "This coupon has reached its maximum usage limit"
                                });
                            }
                        }

                        if (coupon.max_uses_per_user > 0) {
                            let userUsage = 0;
                            if (coupon.history instanceof Map) {
                                userUsage = coupon.history.get(customer_id.toString()) || 0;
                            } else if (coupon.history && typeof coupon.history === 'object') {
                                if (coupon.history[customer_id.toString()] !== undefined) {
                                    userUsage = coupon.history[customer_id.toString()];
                                } else if (coupon.history[customer_id] !== undefined) {
                                    userUsage = coupon.history[customer_id];
                                } else {
                                    const keys = Object.keys(coupon.history);
                                    const matchKey = keys.find(k =>
                                        k === customer_id.toString() || k === String(customer_id)
                                    );
                                    if (matchKey) {
                                        userUsage = coupon.history[matchKey];
                                    }
                                }
                            }

                            if (userUsage >= coupon.max_uses_per_user) {
                                return res.status(400).json({
                                    message: "You have reached the maximum usage limit for this coupon"
                                });
                            }
                        }

                        let usageHistory = new Map();
                        if (coupon.history) {
                            if (coupon.history instanceof Map) {
                                usageHistory = coupon.history;
                            } else if (typeof coupon.history === 'object') {
                                usageHistory = new Map();
                                Object.keys(coupon.history).forEach(key => {
                                    usageHistory.set(key, coupon.history[key]);
                                });
                            }
                        }

                        const currentUsage = usageHistory.get(customer_id.toString()) || 0;
                        usageHistory.set(customer_id.toString(), currentUsage + 1);
                        coupon.history = usageHistory;
                        await coupon.save();
                    } else {
                        return res.status(400).json({
                            message: "This coupon only applies to specific products or categories that are not in your cart"
                        });
                    }
                }
            }
        }

        finalTotalPrice = totalPrice - discountAmount - couponAmount;

        let shippingCost = 0;
        if (shipping_id) {
            try {
                const shippingMethod = await db.shipping.findById(shipping_id);
                if (shippingMethod && shippingMethod.price) {
                    shippingCost = shippingMethod.price;
                    finalTotalPrice += shippingCost;
                }
            } catch (error) {
                console.error(`Error fetching shipping cost: ${error.message}`);
            }
        }

        const newOrder = new Order({
            customer_id,
            shipping_id,
            payment_id,
            order_payment_id,
            total_price: finalTotalPrice,
            discount_id,
            coupon_id,
            coupon_amount: couponAmount,
            discount_amount: discountAmount,
            shipping_cost: shippingCost,
            user_address_id,
            original_price: originalPrice,
            payment_status: 'pending'
        });

        if (finalTotalPrice < 0) finalTotalPrice = 0;

        const savedOrder = await newOrder.save();

        const orderDetailItems = [];
        for (const item of orderItems) {
            const product = await Product.findById(item.product_id);
            let itemPrice = product.price;

            if (item.variant_id) {
                try {
                    const variant = await db.productVariant.findById(item.variant_id);
                    if (variant) {
                        if (variant.price) {
                            itemPrice = variant.price;
                        }
                        variant.stock -= item.quantity;
                        await variant.save();
                    }
                } catch (err) {
                    product.stock -= item.quantity;
                    await product.save();
                }
            } else {
                product.stock -= item.quantity;
                await product.save();
            }

            if (item.price) {
                itemPrice = item.price;
            }

            const orderDetail = new OrderDetail({
                id: `OD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                order_id: savedOrder._id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                discount_id: item.discount_id,
                cart_id: item.cart_id,
                price: itemPrice
            });

            const savedOrderDetail = await orderDetail.save();
            orderDetailItems.push(savedOrderDetail);
        }

        res.status(201).json({
            message: "Order created successfully",
            order: savedOrder,
            orderDetails: orderDetailItems
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng (hỗ trợ cả old và new model)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, status } = req.body;

        // Support both ObjectId and orderNumber
        const mongoose = require('mongoose');
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        let order;
        
        if (isValidObjectId) {
            order = await Order.findById(id);
        } else {
            order = await Order.findOne({ orderNumber: id });
        }

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Detect model type
        const isNewModel = order.status !== undefined;
        const isOldModel = order.order_status !== undefined;

        // Get status value from request (prioritize status over order_status)
        let newStatus = status || order_status;
        if (!newStatus) {
            return res.status(400).json({ message: "Status is required" });
        }

        // Normalize status to handle both lowercase and uppercase
        const normalizedStatus = newStatus.toLowerCase();

        // Map frontend status values to backend format
        const statusMap = {
            'pending': isNewModel ? 'PENDING' : 'pending',
            'processing': isNewModel ? 'CONFIRMED' : 'processing',
            'shipped': isNewModel ? 'SHIPPING' : 'shipped',
            'delivered': isNewModel ? 'DELIVERED' : 'delivered',
            'cancelled': isNewModel ? 'CANCELLED' : 'cancelled'
        };

        const mappedStatus = statusMap[normalizedStatus] || newStatus;

        // Update status based on model type
        if (isNewModel) {
            // Validate new model status values
            const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
            if (!validStatuses.includes(mappedStatus)) {
                return res.status(400).json({ 
                    message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` 
                });
            }
            order.status = mappedStatus;
            
            // Set deliveredAt for new model
            if (mappedStatus === 'DELIVERED') {
                order.deliveredAt = new Date();
            }
        } else if (isOldModel) {
            order.order_status = mappedStatus;
            
            // Set order_delivered_at for old model
            if (mappedStatus === 'delivered') {
                order.order_delivered_at = new Date();
            }
        } else {
            return res.status(400).json({ message: "Cannot determine order model type" });
        }

        order.updated_at = new Date();
        await order.save();

        // Create revenue record when delivered
        const isDelivered = (isNewModel && mappedStatus === 'DELIVERED') || (isOldModel && mappedStatus === 'delivered');
        if (isDelivered) {
            try {
                const axios = require('axios');
                const BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999';
                const jwt = require('jsonwebtoken');
                const config = require("../config/auth.config");

                const adminToken = jwt.sign({ id: req.userId, isAdmin: true }, config.secret, {
                    algorithm: "HS256",
                    expiresIn: 60
                });

                await axios.post(
                    `${BASE_URL}/api/revenue/create`,
                    { order_id: id },
                    {
                        headers: {
                            'x-access-token': adminToken
                        }
                    }
                );

                console.log(`Revenue record created for order ${id}`);
            } catch (revenueError) {
                console.error('Error creating revenue record:', revenueError.response?.data || revenueError.message);
            }
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Hủy đơn hàng (hỗ trợ cả old và new model)
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        const { reason } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        const mongoose = require('mongoose');
        const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
        let order;
        
        if (isValidObjectId) {
            order = await Order.findById(orderId);
        } else {
            if (!orderId.includes('-') && orderId.startsWith('ORD') && orderId.length >= 11) {
                const match = orderId.match(/^ORD(\d{8})(\d+)$/);
                if (match) {
                    const [, datePart, seqPart] = match;
                    const formattedOrderNumber = `ORD-${datePart}-${seqPart.padStart(4, '0')}`;
                    order = await Order.findOne({
                        $or: [
                            { orderNumber: orderId },
                            { orderNumber: formattedOrderNumber }
                        ]
                    });
                } else {
                    order = await Order.findOne({ orderNumber: orderId });
                }
            } else {
                order = await Order.findOne({ orderNumber: orderId });
            }
        }
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const isNewModel = order.status !== undefined;
        const isOldModel = order.order_status !== undefined;
        
        let canCancel = false;
        if (isNewModel) {
            const cancellableStatuses = ['PENDING', 'CONFIRMED'];
            canCancel = cancellableStatuses.includes(order.status) && order.status !== 'CANCELLED';
        } else if (isOldModel) {
            canCancel = (order.order_status === 'pending' || order.order_status === 'processing') && order.order_status !== 'cancelled';
        }
        
        if (!canCancel) {
            const currentStatus = isNewModel ? order.status : order.order_status;
            return res.status(400).json({
                message: `Không thể hủy đơn hàng ở trạng thái "${currentStatus}". Chỉ có thể hủy đơn hàng ở trạng thái: ${isNewModel ? 'PENDING, CONFIRMED' : 'pending, processing'}`
            });
        }

        if ((isNewModel && order.status === 'CANCELLED') || (isOldModel && order.order_status === 'cancelled')) {
            return res.status(400).json({ message: "Đơn hàng đã được hủy trước đó" });
        }

        const userId = req.userId || req.user?.id || req.user?._id;
        if (userId) {
            const orderUserId = isNewModel ? order.userId?.toString() : order.customer_id?.toString();
            if (orderUserId && orderUserId !== userId.toString()) {
                const User = db.user;
                const user = await User.findById(userId).lean();
                const isAdmin = user?.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN');
                const orderShopId = isNewModel ? order.shopId?.toString() : order.shop_id?.toString();
                const isShopOwner = orderShopId && user?.shopId?.toString() === orderShopId;
                
                if (!isAdmin && !isShopOwner) {
                    return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này" });
                }
            }
        }

        if (isNewModel && order.status === 'CONFIRMED' && order.items && order.items.length > 0) {
            try {
                const ProductVariant = db.productVariant;
                for (const item of order.items) {
                    if (item.variantId) {
                        const variant = await ProductVariant.findById(item.variantId);
                        if (variant && variant.inventory) {
                            variant.inventory.quantity = (variant.inventory.quantity || 0) + (item.quantity || 0);
                            await variant.save();
                        }
                    }
                }
            } catch (inventoryError) {
                console.error('Error restoring inventory:', inventoryError);
            }
        } else if (isOldModel && order.order_status === 'processing') {
            try {
                const orderDetails = await OrderDetail.find({ order_id: order._id });
                for (const detail of orderDetails) {
                    const product = await Product.findById(detail.product_id);
                    if (product && product.stock !== undefined) {
                        product.stock += detail.quantity;
                        await product.save();
                    }
                }
            } catch (inventoryError) {
                console.error('Error restoring inventory:', inventoryError);
            }
        }

        if (isNewModel) {
            order.status = 'CANCELLED';
            order.cancelledAt = new Date();
            if (reason) {
                order.cancellationReason = reason;
            }
            if (order.paymentStatus === 'PAID' && order.paymentCode === 'VNPAY') {
                console.log('Order was paid via VNPay, refund should be processed separately');
            }
        } else {
            order.order_status = 'cancelled';
            if (order.status_id === 'paid') {
                order.need_pay_back = true;
            }
            
            if (order.discount_id) {
                const discount = await Discount.findById(order.discount_id);
                if (discount) {
                    const usageHistory = discount.history || {};
                    if (usageHistory[order.customer_id]) {
                        usageHistory[order.customer_id] -= 1;
                        if (usageHistory[order.customer_id] <= 0) {
                            delete usageHistory[order.customer_id];
                        }
                        discount.history = usageHistory;
                        await discount.save();
                    }
                }
            }
            
            if (order.coupon_id) {
                const coupon = await Coupon.findById(order.coupon_id);
                if (coupon) {
                    const usageHistory = coupon.history || new Map();
                    if (usageHistory.has(order.customer_id.toString())) {
                        const currentCount = usageHistory.get(order.customer_id.toString());
                        if (currentCount <= 1) {
                            usageHistory.delete(order.customer_id.toString());
                        } else {
                            usageHistory.set(order.customer_id.toString(), currentCount - 1);
                        }
                        coupon.history = usageHistory;
                        await coupon.save();
                    }
                }
            }
        }

        await order.save();
        
        res.status(200).json({
            success: true,
            message: "Đơn hàng đã được hủy thành công",
            order: {
                _id: order._id,
                orderNumber: order.orderNumber || order.order_number,
                status: isNewModel ? order.status : order.order_status,
                cancelledAt: order.cancelledAt,
                cancellationReason: order.cancellationReason
            }
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

// Xóa đơn hàng (xóa mềm)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.is_delete = true;
        await order.save();
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy thống kê đơn hàng
const getOrderStatistics = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({ is_delete: { $ne: true } });
        const pendingOrders = await Order.countDocuments({
            is_delete: { $ne: true },
            $or: [{ order_status: 'pending' }, { status: 'PENDING' }]
        });
        const processingOrders = await Order.countDocuments({
            is_delete: { $ne: true },
            $or: [{ order_status: 'processing' }, { status: 'PROCESSING' }]
        });
        const shippedOrders = await Order.countDocuments({
            is_delete: { $ne: true },
            $or: [{ order_status: 'shipped' }, { status: 'SHIPPED' }]
        });
        const deliveredOrders = await Order.countDocuments({
            is_delete: { $ne: true },
            $or: [{ order_status: 'delivered' }, { status: 'DELIVERED' }]
        });
        const cancelledOrders = await Order.countDocuments({
            is_delete: { $ne: true },
            $or: [{ order_status: 'cancelled' }, { status: 'CANCELLED' }]
        });

        const revenueOld = await Order.aggregate([
            { $match: { order_status: 'delivered', is_delete: { $ne: true } } },
            { $group: { _id: null, total: { $sum: "$total_price" } } }
        ]);

        const revenueNew = await Order.aggregate([
            { $match: { status: 'DELIVERED', is_delete: { $ne: true } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const discountTotal = await Order.aggregate([
            { $match: { order_status: 'delivered', is_delete: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    discountAmount: { $sum: "$discount_amount" },
                    couponAmount: { $sum: "$coupon_amount" }
                }
            }
        ]);

        const ordersWithDiscount = await Order.countDocuments({
            discount_id: { $exists: true, $ne: null },
            is_delete: { $ne: true }
        });

        const ordersWithCoupon = await Order.countDocuments({
            coupon_id: { $exists: true, $ne: null },
            is_delete: { $ne: true }
        });

        const totalRevenue =
            (revenueOld.length > 0 ? revenueOld[0].total : 0) +
            (revenueNew.length > 0 ? revenueNew[0].total : 0);
        const totalDiscountAmount = discountTotal.length > 0 ? discountTotal[0].discountAmount || 0 : 0;
        const totalCouponAmount = discountTotal.length > 0 ? discountTotal[0].couponAmount || 0 : 0;

        res.status(200).json({
            totalOrders,
            ordersByStatus: {
                pending: pendingOrders,
                processing: processingOrders,
                shipped: shippedOrders,
                delivered: deliveredOrders,
                cancelled: cancelledOrders
            },
            totalRevenue,
            totalDiscountAmount,
            totalCouponAmount,
            ordersWithDiscount,
            ordersWithCoupon
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy đơn đặt hàng theo ID shop
const getOrdersByShopId = async (req, res) => {
    try {
        const { shopId } = req.params;
        if (!shopId) {
            return res.status(400).json({ message: 'Shop ID is required' });
        }

        // Try new model first (Order with shopId field)
        const newModelOrders = await Order.find({ shopId })
            .populate('userId', 'firstName lastName email phone')
            .populate('shopId', 'name')
            .populate('paymentMethodId', 'name paymentCode')
            .populate('shippingMethodId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        if (newModelOrders && newModelOrders.length > 0) {
            // Format for frontend compatibility
            const result = newModelOrders.map(order => ({
                order: {
                    _id: order._id,
                    id: order._id,
                    order_status: order.status?.toLowerCase() || 'pending',
                    status: order.status,
                    total_price: order.totalAmount,
                    totalAmount: order.totalAmount,
                    customer_id: order.userId,
                    customerId: order.userId,
                    created_at: order.createdAt,
                    createdAt: order.createdAt,
                    paymentStatus: order.paymentStatus,
                    ...order
                },
                orderDetails: order.items || []
            }));
            return res.status(200).json(result);
        }

        // Fallback to old model (if exists)
        try {
            const orderDetails = await OrderDetail.find()
                .populate({
                    path: 'product_id',
                    match: { $or: [{ shopId: shopId }, { shop_id: shopId }] },
                    select: 'name price shopId shop_id'
                });

            const validOrderDetails = orderDetails.filter(detail => detail.product_id !== null);
            const orderIds = [...new Set(validOrderDetails.map(detail => detail.order_id))];

            if (orderIds.length === 0) {
                return res.status(200).json([]);
            }

            const orders = await Order.find({
                _id: { $in: orderIds },
                is_delete: false
            })
                .populate({
                    path: 'customer_id',
                    model: 'users',
                    select: 'firstName lastName email phone'
                })
                .populate('shipping_id')
                .populate('payment_id')
                .populate('discount_id')
                .populate('coupon_id')
                .populate('user_address_id')
                .sort({ created_at: -1 });

            const orderDetailsMap = {};
            validOrderDetails.forEach(detail => {
                if (!orderDetailsMap[detail.order_id]) {
                    orderDetailsMap[detail.order_id] = [];
                }
                orderDetailsMap[detail.order_id].push(detail);
            });

            const result = orders.map(order => ({
                order,
                orderDetails: orderDetailsMap[order._id] || []
            }));

            return res.status(200).json(result);
        } catch (oldModelError) {
            // If old model also fails, return empty array
            console.error('Error with old model:', oldModelError);
            return res.status(200).json([]);
        }
    } catch (error) {
        console.error('Error in getOrdersByShopId:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Từ chối đơn hàng bởi người bán (seller)
const rejectOrderBySeller = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.shop_id) {
            return res.status(403).json({
                message: "Không thể xác định shop của bạn. Vui lòng thử lại."
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        if (order.status_id !== 'pending' && order.order_status !== 'pending') {
            return res.status(400).json({
                message: "Chỉ có thể từ chối đơn hàng ở trạng thái chờ xác nhận"
            });
        }

        const orderDetails = await OrderDetail.find({ order_id: order._id })
            .populate({
                path: 'product_id',
                select: 'shop_id name'
            });

        const shopProducts = orderDetails.filter(detail =>
            detail.product_id &&
            detail.product_id.shop_id &&
            detail.product_id.shop_id.toString() === req.shop_id
        );

        if (shopProducts.length === 0) {
            return res.status(403).json({
                message: "Bạn không có quyền từ chối đơn hàng này"
            });
        }

        order.order_status = 'cancelled';
        if (order.status_id === 'paid') {
            order.need_pay_back = true;
        }
        order.updated_at = new Date();
        await order.save();

        for (const detail of shopProducts) {
            const product = await Product.findById(detail.product_id._id);
            if (product) {
                product.stock += detail.quantity;
                await product.save();
            }

            if (detail.variant_id) {
                try {
                    const variant = await db.productVariant.findById(detail.variant_id);
                    if (variant) {
                        variant.stock += detail.quantity;
                        await variant.save();
                    }
                } catch (err) {
                    console.log(`Không thể cập nhật tồn kho biến thể: ${err.message}`);
                }
            }
        }

        if (shopProducts.length === orderDetails.length) {
            if (order.discount_id) {
                const discount = await Discount.findById(order.discount_id);
                if (discount && discount.history && discount.history[order.customer_id]) {
                    discount.history[order.customer_id] -= 1;
                    if (discount.history[order.customer_id] <= 0) {
                        delete discount.history[order.customer_id];
                    }
                    await discount.save();
                }
            }

            if (order.coupon_id) {
                const coupon = await Coupon.findById(order.coupon_id);
                if (coupon && coupon.history && coupon.history.has(order.customer_id.toString())) {
                    const currentCount = coupon.history.get(order.customer_id.toString());
                    if (currentCount <= 1) {
                        coupon.history.delete(order.customer_id.toString());
                    } else {
                        coupon.history.set(order.customer_id.toString(), currentCount - 1);
                    }
                    await coupon.save();
                }
            }
        }

        res.status(200).json({
            message: "Đã từ chối đơn hàng thành công",
            order: {
                id: order.id,
                _id: order._id,
                status_id: order.status_id,
                order_status: order.order_status,
                need_pay_back: order.need_pay_back
            }
        });
    } catch (error) {
        console.error("Lỗi khi từ chối đơn hàng:", error);
        res.status(500).json({ message: error.message || "Đã xảy ra lỗi khi từ chối đơn hàng" });
    }
};

const getOrdersNeedingRefund = async (req, res) => {
    try {
        const orders = await Order.find({
            need_pay_back: true,
            order_status: 'cancelled'
        })
            .populate({
                path: 'customer_id',
                model: 'users',
                select: 'firstName lastName email phone'
            })
            .populate('payment_id')
            .populate('user_address_id')
            .sort({ updated_at: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đánh dấu đã hoàn tiền cho đơn hàng
const markAsRefunded = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (!order.need_pay_back) {
            return res.status(400).json({ message: "This order does not need refund" });
        }
        order.need_pay_back = false;
        order.updated_at = new Date();
        await order.save();
        res.status(200).json({
            message: "Order marked as refunded successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// NEW MODEL FUNCTIONS (status, paymentStatus, userId)
// ============================================

// Tạo đơn hàng từ giỏ hàng (new model)
async function createFromCart(req, res, next) {
  try {
    const { userId, paymentCode = 'COD', shippingAddress = {}, notes } = req.body
    if (!userId) throw createHttpError.BadRequest('userId is required')

    const cart = await Cart.findOne({ userId }).populate('items.productId', 'shopId')
    if (!cart || !cart.items || cart.items.length === 0) {
      throw createHttpError.BadRequest('Cart is empty')
    }

    const firstProduct = cart.items[0]?.productId
    const shopId = firstProduct?.shopId || cart.items[0]?.productId?.shopId
    if (!shopId) {
      throw createHttpError.BadRequest('Cannot determine shop from cart items')
    }

    let finalShippingAddress = shippingAddress
    if (!shippingAddress.recipientName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.address_line1) {
      const user = await User.findById(userId).lean()
      const defaultAddr = await Address.findOne({ user_id: userId, status: true }).sort({ createdAt: -1 }).lean()
      if (defaultAddr) {
        finalShippingAddress = {
          recipientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Customer',
          phone: defaultAddr.phone || user?.phone || '',
          city: defaultAddr.city || 'Ho Chi Minh',
          address_line1: defaultAddr.address_line1 || 'Address not provided',
          address_line2: defaultAddr.address_line2,
          district: defaultAddr.district,
          ward: defaultAddr.ward,
          postalCode: defaultAddr.postalCode
        }
      } else if (user) {
        finalShippingAddress = {
          recipientName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Customer',
          phone: user.phone || '',
          city: 'Ho Chi Minh',
          address_line1: 'Address not provided'
        }
      } else {
        finalShippingAddress = {
          recipientName: 'Customer',
          phone: '',
          city: 'Ho Chi Minh',
          address_line1: 'Address not provided'
        }
      }
    }

    let pm = await PaymentMethod.findOne({ paymentCode })
    if (!pm) {
      pm = new PaymentMethod({
        name: paymentCode,
        paymentCode,
        isActive: true,
        isOnline: paymentCode !== 'COD',
        supportsRefund: paymentCode !== 'COD'
      })
      await pm.save()
    }

    const subtotal = cart.items.reduce((sum, it) => {
      const price = Number(it.price || 0)
      const quantity = Number(it.quantity || 0)
      return sum + (price * quantity)
    }, 0)
    const shippingFee = 0
    const discount = 0
    const totalAmount = subtotal + shippingFee - discount

    if (totalAmount <= 0) {
      throw createHttpError.BadRequest(`Invalid cart total: ${totalAmount}. Cart must have items with valid prices.`)
    }

    const items = cart.items.map(it => ({
      productId: it.productId?._id || it.productId,
      variantId: it.variantId,
      productName: it.productName,
      variantName: it.variantName,
      quantity: Number(it.quantity || 0),
      unitPrice: Number(it.price || 0),
      totalPrice: Number(it.quantity || 0) * Number(it.price || 0),
      image: it.image
    }))

    const ShippingMethod = db.shippingMethod
    let shipping = await ShippingMethod.findOne({ isDefault: true, isActive: true })
    if (!shipping) shipping = await ShippingMethod.findOne({ isActive: true })
    if (!shipping) {
      shipping = new ShippingMethod({ name: 'Miễn phí', code: 'FREE', feeType: 'FREE', isActive: true, isDefault: true })
      await shipping.save()
    }

    const order = new Order({
      userId,
      shopId,
      items,
      subtotal,
      shippingFee,
      discount,
      totalAmount,
      paymentMethodId: pm._id,
      paymentCode: paymentCode,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      shippingMethodId: shipping._id,
      shippingAddress: finalShippingAddress,
      notes
    })

    await order.save()
    
    if (paymentCode === 'COD') {
      try {
        cart.items = []
        cart.totalPrice = 0
        await cart.save()
        const cache = require('../utils/cache')
        cache.delete(`cart:${userId}`)
      } catch (clearError) {
        console.error('Error clearing cart after COD order:', clearError)
      }
    }

    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
}

// Lấy đơn hàng theo ID (new model - hỗ trợ cả ObjectId và orderNumber)
async function getById(req, res, next) {
  try {
    const { id } = req.params
    if (!id) throw createHttpError.BadRequest('Order ID is required')
    
    const mongoose = require('mongoose')
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
    
    let order
    if (isValidObjectId) {
      order = await Order.findById(id)
        .populate('userId', 'firstName lastName email phone')
        .populate('shopId', 'name')
        .populate('paymentMethodId', 'name paymentCode')
        .populate('shippingMethodId', 'name')
    } else {
      if (!id.includes('-') && id.startsWith('ORD') && id.length >= 11) {
        const match = id.match(/^ORD(\d{8})(\d+)$/)
        if (match) {
          const [, datePart, seqPart] = match
          const formattedOrderNumber = `ORD-${datePart}-${seqPart.padStart(4, '0')}`
          order = await Order.findOne({
            $or: [
              { orderNumber: id },
              { orderNumber: formattedOrderNumber }
            ]
          })
            .populate('userId', 'firstName lastName email phone')
            .populate('shopId', 'name')
            .populate('paymentMethodId', 'name paymentCode')
            .populate('shippingMethodId', 'name')
        } else {
          order = await Order.findOne({ orderNumber: id })
            .populate('userId', 'firstName lastName email phone')
            .populate('shopId', 'name')
            .populate('paymentMethodId', 'name paymentCode')
            .populate('shippingMethodId', 'name')
        }
      } else {
        order = await Order.findOne({ orderNumber: id })
          .populate('userId', 'firstName lastName email phone')
          .populate('shopId', 'name')
          .populate('paymentMethodId', 'name paymentCode')
          .populate('shippingMethodId', 'name')
      }
    }
    
    if (!order) throw createHttpError.NotFound('Order not found')
    res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

// Lấy đơn hàng theo userId (new model)
async function getByUserId(req, res, next) {
  try {
    const { userId } = req.params
    if (!userId) throw createHttpError.BadRequest('userId is required')
    
    const orders = await Order.find({ userId })
      .populate('shopId', 'name')
      .populate('paymentMethodId', 'name paymentCode')
      .populate('shippingMethodId', 'name')
      .sort({ createdAt: -1 })
      .lean()
    
    res.status(200).json(orders)
  } catch (error) {
    next(error)
  }
}

// ============================================
// EXPORT
// ============================================
// Verify all functions are defined before creating object
if (typeof getAllOrders === 'undefined') console.error('ERROR: getAllOrders is undefined!');
if (typeof getOrderById === 'undefined') console.error('ERROR: getOrderById is undefined!');
if (typeof getOrdersByUserId === 'undefined') console.error('ERROR: getOrdersByUserId is undefined!');
if (typeof createOrder === 'undefined') console.error('ERROR: createOrder is undefined!');
if (typeof updateOrderStatus === 'undefined') console.error('ERROR: updateOrderStatus is undefined!');
if (typeof cancelOrder === 'undefined') console.error('ERROR: cancelOrder is undefined!');
if (typeof deleteOrder === 'undefined') console.error('ERROR: deleteOrder is undefined!');
if (typeof getOrderStatistics === 'undefined') console.error('ERROR: getOrderStatistics is undefined!');
if (typeof getOrdersByShopId === 'undefined') console.error('ERROR: getOrdersByShopId is undefined!');
if (typeof rejectOrderBySeller === 'undefined') console.error('ERROR: rejectOrderBySeller is undefined!');
if (typeof getOrdersNeedingRefund === 'undefined') console.error('ERROR: getOrdersNeedingRefund is undefined!');
if (typeof markAsRefunded === 'undefined') console.error('ERROR: markAsRefunded is undefined!');
if (typeof createFromCart === 'undefined') console.error('ERROR: createFromCart is undefined!');
if (typeof getById === 'undefined') console.error('ERROR: getById is undefined!');
if (typeof getByUserId === 'undefined') console.error('ERROR: getByUserId is undefined!');

const orderController = {
    // Old model functions
    getAllOrders: getAllOrders,
    getOrderById: getOrderById,
    getOrdersByUserId: getOrdersByUserId,
    createOrder: createOrder,
    updateOrderStatus: updateOrderStatus,
    cancelOrder: cancelOrder,
    deleteOrder: deleteOrder,
    getOrderStatistics: getOrderStatistics,
    getOrdersByShopId: getOrdersByShopId,
    rejectOrderBySeller: rejectOrderBySeller,
    getOrdersNeedingRefund: getOrdersNeedingRefund,
    markAsRefunded: markAsRefunded,
    // New model functions
    createFromCart: createFromCart,
    getById: getById,
    getByUserId: getByUserId
};

module.exports = orderController;
