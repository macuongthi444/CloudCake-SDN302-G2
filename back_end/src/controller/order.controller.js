const db = require("../models");
const Order = db.order;
const OrderDetail = db.orderDetail;
const Product = db.product;
const Discount = db.discount;
const Coupon = db.coupon; 
 // Add Coupon model

// Lấy tất cả đơn đặt hàng
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ is_delete: false })
            .populate({
                path: 'customer_id',
                model: 'users', // Đảm bảo tên model đúng
                select: 'firstName lastName email phone' // Chọn các trường cần lấy
            })
            .populate('shipping_id')
            .populate('payment_id')
            .populate('discount_id')
            .populate('coupon_id')
            .populate('user_address_id');
        res.status(200).json(orders);
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

        // Lấy chi tiết đơn hàng và populate cả variant_id
        const orderDetails = await OrderDetail.find({ order_id: order._id })
            .populate('product_id')
            .populate('variant_id') // Thêm populate variant_id
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

// Tạo đơn đặt hàng mới
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

        // Kiểm tra xem có sản phẩm không
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        // Tính toán tổng giá trị đơn hàng
        let totalPrice = 0;
        let originalPrice = 0;
        let categoryIds = [];
        let productIds = [];

        // Kiểm tra tồn kho và tính tổng giá trị
        for (const item of orderItems) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found` });
            }

            productIds.push(product._id.toString());

            // Đặt giá mặc định ban đầu là giá của sản phẩm
            let itemPrice = product.price;

            // Kiểm tra nếu có variant_id, ưu tiên sử dụng giá của biến thể
            if (item.variant_id) {
                try {
                    const variant = await db.productVariant.findById(item.variant_id);
                    if (variant) {
                        // Kiểm tra tồn kho của biến thể thay vì sản phẩm
                        if (variant.stock < item.quantity) {
                            return res.status(400).json({
                                message: `Not enough stock for variant ${variant.name || 'unnamed'} of product ${product.name}. Available: ${variant.stock}`
                            });
                        }

                        // Sử dụng giá của biến thể
                        if (variant.price) {
                            itemPrice = variant.price;
                            console.log(`Using variant price for product ${product.name}: ${itemPrice}`);
                        }
                    }
                } catch (err) {
                    console.log(`Could not fetch variant price, using product price: ${itemPrice}`);
                }
            } else {
                // Kiểm tra tồn kho sản phẩm chỉ khi không có biến thể
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Not enough stock for product ${product.name}. Available: ${product.stock}`
                    });
                }
            }

            // Nếu có giá được chỉ định trong đơn hàng (override), sử dụng giá đó
            if (item.price) {
                itemPrice = item.price;
                console.log(`Using specified item price: ${itemPrice}`);
            }

            // Tính toán giá của mục
            const itemTotal = itemPrice * item.quantity;

            // Chỉ cộng giá một lần vào tổng
            totalPrice += itemTotal;
            originalPrice += itemTotal; // Lưu giá gốc

            // Collect category IDs for coupon validation
            if (product.category_id) {
                if (Array.isArray(product.category_id)) {
                    categoryIds = [...categoryIds, ...product.category_id.map(cat => cat.toString())];
                } else {
                    categoryIds.push(product.category_id.toString());
                }
            }
        }

        // Remove duplicates from arrays
        categoryIds = [...new Set(categoryIds)];
        productIds = [...new Set(productIds)];

        // Variables for discount calculation
        let discountAmount = 0;
        let couponAmount = 0;
        let finalTotalPrice = totalPrice;

        // Áp dụng mã giảm giá nếu có
        if (discount_id) {
            const discount = await Discount.findById(discount_id);
            if (discount) {
                // Kiểm tra điều kiện áp dụng mã giảm giá
                const now = new Date();
                if (discount.is_active &&
                    !discount.is_delete &&
                    new Date(discount.start_date) <= now &&
                    new Date(discount.end_date) >= now &&
                    totalPrice >= discount.min_order_value) {

                    // Tính số tiền giảm giá
                    if (discount.type_price === 'fixed') {
                        discountAmount = discount.value;
                    } else {
                        discountAmount = (totalPrice * discount.value) / 100;
                    }

                    // Giới hạn số lần sử dụng
                    if (discount.max_uses > 0) {
                        const usageHistory = discount.history || {};
                        const totalUsed = Object.values(usageHistory).reduce((sum, current) => sum + current, 0);

                        if (totalUsed >= discount.max_uses) {
                            return res.status(400).json({ message: "Discount code has reached maximum uses" });
                        }
                    }

                    // Kiểm tra số lần sử dụng của người dùng
                    if (discount.max_uses_per_user > 0) {
                        const usageHistory = discount.history || {};
                        const userUsage = usageHistory[customer_id] || 0;

                        if (userUsage >= discount.max_uses_per_user) {
                            return res.status(400).json({
                                message: "You have reached maximum uses for this discount code"
                            });
                        }
                    }

                    // Cập nhật lịch sử sử dụng
                    const usageHistory = discount.history || {};
                    usageHistory[customer_id] = (usageHistory[customer_id] || 0) + 1;
                    discount.history = usageHistory;
                    await discount.save();
                }
            }
        }

        // Áp dụng mã coupon nếu có
        if (coupon_id) {
            const coupon = await Coupon.findById(coupon_id);
            if (coupon) {
                // Kiểm tra điều kiện áp dụng coupon
                const now = new Date();
                if (coupon.is_active &&
                    !coupon.is_delete &&
                    new Date(coupon.start_date) <= now &&
                    new Date(coupon.end_date) >= now &&
                    totalPrice >= coupon.min_order_value) {

                    // Check if coupon is restricted to specific products/categories
                    let isEligible = true;
                    let eligibleAmount = totalPrice; // Default to full order amount

                    // If coupon is restricted to specific product
                    if (coupon.product_id) {
                        // Get all items with the specific product
                        const eligibleItems = orderItems.filter(item =>
                            item.product_id.toString() === coupon.product_id.toString()
                        );

                        if (eligibleItems.length === 0) {
                            // No eligible products for this coupon
                            isEligible = false;
                        } else {
                            // Calculate sum of only eligible products
                            eligibleAmount = 0;
                            for (const item of eligibleItems) {
                                // Recalculate with the same logic as above to ensure consistent pricing
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

                    // If coupon is restricted to specific category
                    if (isEligible && coupon.category_id) {
                        // Check if any product belongs to this category
                        const categoryMatch = categoryIds.includes(coupon.category_id.toString());
                        if (!categoryMatch) {
                            isEligible = false;
                        }
                        // Note: For a more precise implementation, you would calculate
                        // the sum of only products in that category
                    }

                    if (isEligible) {
                        // Tính số tiền giảm giá từ coupon
                        if (coupon.type === 'fixed') {
                            couponAmount = coupon.value;
                        } else {
                            // Percentage discount
                            couponAmount = (eligibleAmount * coupon.value) / 100;
                            // Apply max discount if specified
                            if (coupon.max_discount_value && couponAmount > coupon.max_discount_value) {
                                couponAmount = coupon.max_discount_value;
                            }
                        }

                        // Kiểm tra giới hạn số lần sử dụng
                        if (coupon.max_uses > 0) {
                            const totalUsed = Array.from(coupon.history.values()).reduce((sum, count) => sum + count, 0);
                            if (totalUsed >= coupon.max_uses) {
                                return res.status(400).json({
                                    message: "This coupon has reached its maximum usage limit"
                                });
                            }
                        }

                        // Kiểm tra giới hạn sử dụng của người dùng
                        if (coupon.max_uses_per_user > 0) {
                            let userUsage = 0;

                            // Kiểm tra cấu trúc history và lấy đúng số lần sử dụng
                            if (coupon.history instanceof Map) {
                                // Nếu history là Map (được định nghĩa trong model)
                                userUsage = coupon.history.get(customer_id.toString()) || 0;
                            } else if (coupon.history && typeof coupon.history === 'object') {
                                // Kiểm tra nếu history được lưu dưới dạng object
                                if (coupon.history[customer_id.toString()] !== undefined) {
                                    userUsage = coupon.history[customer_id.toString()];
                                } else if (coupon.history[customer_id] !== undefined) {
                                    userUsage = coupon.history[customer_id];
                                } else {
                                    // Kiểm tra các trường hợp khác có thể xảy ra
                                    const keys = Object.keys(coupon.history);
                                    const matchKey = keys.find(k =>
                                        k === customer_id.toString() ||
                                        k === String(customer_id)
                                    );

                                    if (matchKey) {
                                        userUsage = coupon.history[matchKey];
                                    }
                                }
                            }

                            // Ghi log để debug
                            console.log(`[ORDER] User ${customer_id} has used coupon ${coupon.code} ${userUsage}/${coupon.max_uses_per_user} times`);

                            if (userUsage >= coupon.max_uses_per_user) {
                                return res.status(400).json({
                                    message: "You have reached the maximum usage limit for this coupon"
                                });
                            }
                        }

                        // Cập nhật lịch sử sử dụng coupon - chỉnh sửa đoạn này trong createOrder
                        let usageHistory = new Map();

                        // Chuyển đổi từ object sang Map nếu cần
                        if (coupon.history) {
                            if (coupon.history instanceof Map) {
                                usageHistory = coupon.history;
                            } else if (typeof coupon.history === 'object') {
                                // Khởi tạo Map từ Object
                                usageHistory = new Map();
                                Object.keys(coupon.history).forEach(key => {
                                    usageHistory.set(key, coupon.history[key]);
                                });
                            }
                        }

                        // Cập nhật số lần sử dụng
                        const currentUsage = usageHistory.get(customer_id.toString()) || 0;
                        usageHistory.set(customer_id.toString(), currentUsage + 1);

                        // Ghi log cho debug
                        console.log(`[ORDER] Updated coupon usage for user ${customer_id}: ${currentUsage} -> ${currentUsage + 1}`);

                        // Lưu trở lại vào coupon
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

        // Tính tổng giá cuối cùng sau khi áp dụng cả discount và coupon
        finalTotalPrice = totalPrice - discountAmount - couponAmount;

        let shippingCost = 0;
        if (shipping_id) {
            try {
                const shippingMethod = await db.shipping.findById(shipping_id);
                console.log(`Shipping method found: ${shippingMethod}`);              
                if (shippingMethod && shippingMethod.price) {
                    shippingCost = shippingMethod.price;
                    console.log(`Adding shipping cost: ${shippingCost} to order total`);

                    // Add shipping cost to the final total
                    finalTotalPrice += shippingCost;
                } else {
                    console.log(`Shipping method not found or has no price: ${shipping_id}`);
                }
            } catch (error) {
                console.error(`Error fetching shipping cost: ${error.message}`);
            }
        }

        // Update the Order creation with the shipping_cost field
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
            shipping_cost: shippingCost, // Add this field to store shipping cost
            user_address_id,
            original_price: originalPrice,
            payment_status: 'pending'
        });

        // Đảm bảo giá không âm
        if (finalTotalPrice < 0) finalTotalPrice = 0;


        const savedOrder = await newOrder.save();

        // Tạo chi tiết đơn hàng và cập nhật tồn kho
        const orderDetailItems = [];
        for (const item of orderItems) {
            const product = await Product.findById(item.product_id);

            // Xác định giá chính xác
            let itemPrice = product.price;

            // Nếu có variant_id, thử tìm biến thể để lấy giá chính xác
            if (item.variant_id) {
                try {
                    const variant = await db.productVariant.findById(item.variant_id);
                    if (variant) {
                        if (variant.price) {
                            itemPrice = variant.price; // Sử dụng giá của biến thể
                        }

                        // Cập nhật tồn kho của biến thể
                        variant.stock -= item.quantity;
                        await variant.save();
                    }
                } catch (err) {
                    console.log(`Could not fetch variant for stock update, only updating product stock`);
                    // Cập nhật tồn kho sản phẩm nếu không thể cập nhật tồn kho biến thể
                    product.stock -= item.quantity;
                    await product.save();
                }
            } else {
                // Cập nhật tồn kho sản phẩm nếu không có biến thể
                product.stock -= item.quantity;
                await product.save();
            }

            // Nếu có giá được chỉ định trong đơn hàng (override), sử dụng giá đó
            if (item.price) {
                itemPrice = item.price;
            }

            // Tạo chi tiết đơn hàng với price và variant_id
            const orderDetail = new OrderDetail({
                id: `OD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                order_id: savedOrder._id,
                product_id: item.product_id,
                variant_id: item.variant_id, // Lưu variant_id
                quantity: item.quantity,
                discount_id: item.discount_id,
                cart_id: item.cart_id,
                price: itemPrice // Lưu giá chính xác
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
        // res.status(400).json("Mặt hàng này đã hết");
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.order_status = order_status;

        // If order is delivered, update the delivery timestamp
        if (order_status === 'delivered') {
            order.order_delivered_at = new Date();
        }

        await order.save();

        // If order has been delivered, create a revenue record
        if (order_status === 'delivered') {
            try {
                // Create revenue record internally
                const axios = require('axios');
                const BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999';

                // Get admin token for internal API call
                const jwt = require('jsonwebtoken');
                const config = require("../config/auth.config");

                // Create an admin token for internal use
                const adminToken = jwt.sign({ id: req.userId, isAdmin: true }, config.secret, {
                    algorithm: "HS256",
                    expiresIn: 60 // Short-lived token for this operation
                });

                // Make internal API call to create revenue record
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
                // We don't want to fail the order status update if revenue creation fails
                // Just log the error and continue
            }
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Hủy đơn hàng
// Hủy đơn hàng
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Chỉ hủy đơn hàng khi đang ở trạng thái chờ xử lý hoặc đang xử lý
        if (order.order_status !== 'pending' && order.order_status !== 'processing') {
            return res.status(400).json({
                message: "Cannot cancel order that has been shipped or delivered"
            });
        }

        // Cập nhật trạng thái đơn hàng
        order.order_status = 'cancelled';

        // Nếu đơn hàng đã được thanh toán (status_id là 'paid'), đánh dấu cần hoàn tiền
        if (order.status_id === 'paid') {
            order.need_pay_back = true;
            console.log(`Đơn hàng ${order.id} đã được đánh dấu cần hoàn tiền`);
        }

        await order.save();

        // Hoàn trả tồn kho
        const orderDetails = await OrderDetail.find({ order_id: order._id });
        for (const detail of orderDetails) {
            const product = await Product.findById(detail.product_id);
            if (product) {
                product.stock += detail.quantity;
                await product.save();
            }
        }

        // Nếu có sử dụng mã giảm giá, hoàn trả lượt sử dụng
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

        // Nếu có sử dụng coupon, hoàn trả lượt sử dụng
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

        res.status(200).json({
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        // Xóa mềm
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
        // Tổng số đơn hàng
        const totalOrders = await Order.countDocuments({ is_delete: false });

        // Số đơn hàng theo trạng thái
        const pendingOrders = await Order.countDocuments({ order_status: 'pending', is_delete: false });
        const processingOrders = await Order.countDocuments({ order_status: 'processing', is_delete: false });
        const shippedOrders = await Order.countDocuments({ order_status: 'shipped', is_delete: false });
        const deliveredOrders = await Order.countDocuments({ order_status: 'delivered', is_delete: false });
        const cancelledOrders = await Order.countDocuments({ order_status: 'cancelled', is_delete: false });

        // Tổng doanh thu
        const revenue = await Order.aggregate([
            { $match: { order_status: 'delivered', is_delete: false } },
            { $group: { _id: null, total: { $sum: "$total_price" } } }
        ]);

        // Tổng tiền giảm giá
        const discountTotal = await Order.aggregate([
            { $match: { order_status: 'delivered', is_delete: false } },
            {
                $group: {
                    _id: null,
                    discountAmount: { $sum: "$discount_amount" },
                    couponAmount: { $sum: "$coupon_amount" }
                }
            }
        ]);

        // Tổng số đơn hàng sử dụng mã giảm giá
        const ordersWithDiscount = await Order.countDocuments({
            discount_id: { $exists: true, $ne: null },
            is_delete: false
        });

        // Tổng số đơn hàng sử dụng coupon
        const ordersWithCoupon = await Order.countDocuments({
            coupon_id: { $exists: true, $ne: null },
            is_delete: false
        });

        const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
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

        // Tìm tất cả các đơn hàng có chứa sản phẩm thuộc shop này
        const orderDetails = await OrderDetail.find()
            .populate({
                path: 'product_id',
                match: { shop_id: shopId },
                select: 'name price shop_id'
            });

        // Lọc ra các orderDetail có product_id không null (tức là thuộc shop)
        const validOrderDetails = orderDetails.filter(detail => detail.product_id !== null);

        // Lấy ra các order_id duy nhất
        const orderIds = [...new Set(validOrderDetails.map(detail => detail.order_id))];

        // Lấy thông tin đầy đủ của các đơn hàng
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

        // Nhóm các orderDetail theo order_id để gửi kèm chi tiết
        const orderDetailsMap = {};
        validOrderDetails.forEach(detail => {
            if (!orderDetailsMap[detail.order_id]) {
                orderDetailsMap[detail.order_id] = [];
            }
            orderDetailsMap[detail.order_id].push(detail);
        });

        // Kết hợp order và orderDetail
        const result = orders.map(order => {
            return {
                order,
                orderDetails: orderDetailsMap[order._id] || []
            };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Từ chối đơn hàng bởi người bán (seller)
// Từ chối đơn hàng bởi người bán (seller)
const rejectOrderBySeller = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if shop_id exists in request
        if (!req.shop_id) {
            console.error("Shop ID not found in request");
            return res.status(403).json({
                message: "Không thể xác định shop của bạn. Vui lòng thử lại."
            });
        }

        console.log(`Processing rejection for order ${id} by shop ${req.shop_id}`);

        // Kiểm tra đơn hàng có tồn tại không
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Kiểm tra trạng thái đơn hàng
        if (order.status_id !== 'pending' && order.order_status !== 'pending') {
            return res.status(400).json({
                message: "Chỉ có thể từ chối đơn hàng ở trạng thái chờ xác nhận"
            });
        }

        // Kiểm tra xem seller có quyền từ chối đơn hàng này không
        const orderDetails = await OrderDetail.find({ order_id: order._id })
            .populate({
                path: 'product_id',
                select: 'shop_id name'
            });

        console.log(`Found ${orderDetails.length} order details`);

        // Log each product to debug
        orderDetails.forEach((detail, index) => {
            console.log(`Product ${index + 1}:`,
                detail.product_id ?
                    `ID: ${detail.product_id._id}, Name: ${detail.product_id.name}, Shop: ${detail.product_id.shop_id}` :
                    'No product_id');
        });

        // Lọc ra các sản phẩm thuộc về shop của seller
        const shopProducts = orderDetails.filter(detail =>
            detail.product_id &&
            detail.product_id.shop_id &&
            detail.product_id.shop_id.toString() === req.shop_id
        );

        console.log(`Found ${shopProducts.length} products belonging to shop ${req.shop_id}`);

        if (shopProducts.length === 0) {
            return res.status(403).json({
                message: "Bạn không có quyền từ chối đơn hàng này"
            });
        }

        // Cập nhật trạng thái đơn hàng
        order.order_status = 'cancelled';

        // Nếu đơn hàng đã được thanh toán (status_id là 'paid'), đánh dấu cần hoàn tiền
        if (order.status_id === 'paid') {
            order.need_pay_back = true;
            console.log(`Đơn hàng ${order.id} đã được đánh dấu cần hoàn tiền`);
        }

        order.updated_at = new Date();

        await order.save();
        console.log(`Order ${id} status updated to cancelled`);

        // Hoàn trả tồn kho cho các sản phẩm của seller
        for (const detail of shopProducts) {
            const product = await Product.findById(detail.product_id._id);
            if (product) {
                product.stock += detail.quantity;
                await product.save();
                console.log(`Restored ${detail.quantity} units to product ${product._id}`);
            }

            // Cập nhật tồn kho biến thể nếu có
            if (detail.variant_id) {
                try {
                    const variant = await db.productVariant.findById(detail.variant_id);
                    if (variant) {
                        variant.stock += detail.quantity;
                        await variant.save();
                        console.log(`Restored ${detail.quantity} units to variant ${variant._id}`);
                    }
                } catch (err) {
                    console.log(`Không thể cập nhật tồn kho biến thể: ${err.message}`);
                }
            }
        }

        // Hoàn trả lượt sử dụng mã giảm giá/coupon
        if (shopProducts.length === orderDetails.length) {
            if (order.discount_id) {
                const discount = await Discount.findById(order.discount_id);
                if (discount && discount.history && discount.history[order.customer_id]) {
                    discount.history[order.customer_id] -= 1;
                    if (discount.history[order.customer_id] <= 0) {
                        delete discount.history[order.customer_id];
                    }
                    await discount.save();
                    console.log(`Restored discount usage for customer ${order.customer_id}`);
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
                    console.log(`Restored coupon usage for customer ${order.customer_id}`);
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

const orderController = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    getOrderStatistics,
    getOrdersByShopId,
    rejectOrderBySeller,
    getOrdersNeedingRefund,
    markAsRefunded
};

module.exports = orderController;