# Cloud-Cake: Hướng dẫn Thiết kế và Phát triển

## 📋 Tổng quan Hệ thống

Cloud-Cake là một hệ thống **E-commerce chuyên bán bánh online** với các tính năng:
- Bán hàng đa kênh (Multi-channel)
- Quản lý cửa hàng cho Seller
- Quản lý sản phẩm với variants (kích thước, vị)
- Hệ thống đơn hàng và thanh toán
- Đánh giá và phản hồi khách hàng

## 🗄️ Database Models - Hoàn thiện

### ✅ Models đã tạo:

1. **Category** - Danh mục bánh
   - Hỗ trợ category cha-con (nested categories)
   - Sort order, active status

2. **Shop** - Cửa hàng
   - Mỗi Seller có một Shop
   - Status: PENDING, ACTIVE, SUSPENDED
   - Rating và thông tin liên hệ

3. **Product** - Sản phẩm bánh
   - Thuộc về một Shop và Category
   - Hỗ trợ giá gốc và giá giảm
   - Images, ingredients, allergens
   - Rating và view count

4. **ProductVariant** - Biến thể sản phẩm
   - Size (Nhỏ, Vừa, Lớn)
   - Flavor (Vị)
   - Shape (Hình dạng)
   - Inventory tracking

5. **Order** - Đơn hàng
   - Nested OrderItem schema
   - Status workflow: PENDING → CONFIRMED → PREPARING → DELIVERED
   - Payment status tracking
   - Auto-generated order number

6. **Review** - Đánh giá sản phẩm
   - Rating 1-5 sao
   - Verified purchase
   - Shop response

7. **Coupon** - Mã giảm giá
   - Percentage, Fixed amount, Free shipping
   - Usage limits
   - Valid date range

8. **ShippingMethod** - Phương thức vận chuyển
   - Fixed fee, Weight-based, Distance-based
   - Free shipping threshold

## 🔄 Luồng Nghiệp vụ

### 1. Quy trình Mua hàng (Customer Journey)

```
Bước 1: Khách hàng xem danh sách sản phẩm
  ↓
Bước 2: Chọn sản phẩm → Xem chi tiết (Product + Variants)
  ↓
Bước 3: Chọn Variant (Size, Flavor) → Thêm vào Cart
  ↓
Bước 4: Xem Cart → Cập nhật số lượng nếu cần
  ↓
Bước 5: Checkout → Chọn:
  - Địa chỉ giao hàng
  - Phương thức thanh toán
  - Phương thức vận chuyển
  - Áp dụng Coupon (nếu có)
  ↓
Bước 6: Tạo Order → Status = PENDING
  ↓
Bước 7: Thanh toán → Payment Status = PAID
  ↓
Bước 8: Shop xác nhận → Status = CONFIRMED
  ↓
Bước 9: Shop chuẩn bị → Status = PREPARING
  ↓
Bước 10: Giao hàng → Status = SHIPPING → DELIVERED
  ↓
Bước 11: Khách hàng đánh giá sản phẩm
```

### 2. Quy trình Quản lý Shop (Seller)

```
1. Seller đăng ký tài khoản → Role = SELLER
2. Seller tạo Shop → Status = PENDING
3. Admin duyệt Shop → Status = ACTIVE
4. Seller tạo Product với:
   - Chọn Category
   - Thêm thông tin sản phẩm
   - Tạo ProductVariants (Size, Flavor)
   - Set inventory cho mỗi variant
   - Upload images
5. Seller quản lý Orders từ Shop của mình
6. Seller cập nhật Order status
7. Seller phản hồi Reviews
```

## 🏗️ Kiến trúc API Endpoints

### Product APIs
```
GET    /api/products              - Danh sách sản phẩm (public)
GET    /api/products/:id           - Chi tiết sản phẩm (public)
POST   /api/products                - Tạo sản phẩm (Seller/Admin)
PUT    /api/products/:id           - Cập nhật (Seller/Admin)
DELETE /api/products/:id           - Xóa (Admin)
GET    /api/products/shop/:shopId  - Sản phẩm của shop
```

### Category APIs
```
GET    /api/categories             - Danh sách danh mục
POST   /api/categories             - Tạo danh mục (Admin)
PUT    /api/categories/:id         - Cập nhật (Admin)
DELETE /api/categories/:id         - Xóa (Admin)
```

### Shop APIs
```
GET    /api/shops                  - Danh sách cửa hàng
GET    /api/shops/:id              - Chi tiết cửa hàng
POST   /api/shops                  - Tạo cửa hàng (Seller)
PUT    /api/shops/:id              - Cập nhật (Owner/Admin)
PUT    /api/shops/:id/status       - Duyệt cửa hàng (Admin)
```

### Order APIs
```
GET    /api/orders                 - Danh sách đơn hàng
GET    /api/orders/:id             - Chi tiết đơn hàng
POST   /api/orders                 - Tạo đơn hàng từ Cart
PUT    /api/orders/:id/status      - Cập nhật trạng thái
PUT    /api/orders/:id/payment     - Cập nhật payment status
GET    /api/orders/user/:userId    - Đơn hàng của user
GET    /api/orders/shop/:shopId    - Đơn hàng của shop
```

### Review APIs
```
GET    /api/reviews/product/:productId - Reviews của sản phẩm
POST   /api/reviews                 - Tạo review (User)
PUT    /api/reviews/:id              - Cập nhật review
DELETE /api/reviews/:id              - Xóa review
POST   /api/reviews/:id/response     - Shop phản hồi (Seller)
```

### Coupon APIs
```
GET    /api/coupons                 - Danh sách coupons
POST   /api/coupons                 - Tạo coupon (Admin)
PUT    /api/coupons/:id             - Cập nhật (Admin)
DELETE /api/coupons/:id             - Xóa (Admin)
POST   /api/coupons/validate        - Validate coupon code
```

## 🔐 Security & Permissions

### Role-based Access Control

**MEMBER (Customer)**
- Xem sản phẩm, danh mục
- Thêm vào giỏ hàng
- Tạo đơn hàng
- Xem đơn hàng của mình
- Đánh giá sản phẩm

**SELLER**
- Tất cả quyền của MEMBER
- Tạo và quản lý Shop
- Tạo và quản lý Product của Shop mình
- Xem và cập nhật Order của Shop mình
- Phản hồi Reviews

**ADMIN**
- Full access
- Quản lý Categories
- Duyệt Shop
- Quản lý Coupons
- Quản lý Payment/Shipping methods

## 📱 Frontend Structure

```
/src
├── pages/
│   ├── Products/
│   │   ├── ProductList.js
│   │   └── ProductDetail.js
│   ├── Cart/ (✅ Done)
│   ├── Checkout/
│   │   ├── CheckoutPage.js
│   │   └── PaymentForm.js
│   ├── Orders/
│   │   ├── OrderHistory.js
│   │   └── OrderDetail.js
│   └── Shop/
│       └── ShopDetail.js
├── admin/
│   ├── products/ (Quản lý sản phẩm)
│   ├── categories/ (Quản lý danh mục)
│   ├── orders/ (Quản lý đơn hàng)
│   ├── payments/ (✅ Done)
│   ├── shops/ (Duyệt cửa hàng)
│   └── coupons/ (Quản lý mã giảm giá)
└── seller/
    ├── dashboard/
    ├── products/ (Quản lý sản phẩm của shop)
    ├── orders/ (Đơn hàng của shop)
    └── analytics/
```

## 🚀 Next Steps - Implementation Priority

### Phase 1: Core Features (Bắt buộc)
1. ✅ Payment Methods (Done)
2. ✅ Cart (Done)
3. ⏳ Product Management (Models ready)
4. ⏳ Order Management
5. ⏳ Category Management

### Phase 2: Seller Features
1. ⏳ Shop Management
2. ⏳ Product Variants Management
3. ⏳ Order Processing
4. ⏳ Review Management

### Phase 3: Customer Features
1. ⏳ Product Browsing & Search
2. ⏳ Checkout Process
3. ⏳ Order Tracking
4. ⏳ Review & Rating

### Phase 4: Advanced Features
1. ⏳ Coupon System
2. ⏳ Shipping Calculation
3. ⏳ Analytics & Reports
4. ⏳ Notifications

## 📊 Database Relationships Summary

```
User (1) ────< (N) Shop (1 owner)
Shop (1) ────< (N) Product
Category (1) ────< (N) Product
Product (1) ────< (N) ProductVariant
ProductVariant ──── Inventory (embedded)

User (1) ────< (N) Order
Shop (1) ────< (N) Order
Order (1) ────< (N) OrderItem
OrderItem ────> ProductVariant

Product (1) ────< (N) Review
User (1) ────< (N) Review

Coupon ────> Order (optional)
```

## 🎯 Best Practices

1. **Inventory Management**: Luôn kiểm tra inventory trước khi cho phép thêm vào cart
2. **Order Status**: Sử dụng state machine rõ ràng, không bỏ qua bước
3. **Image Upload**: Sử dụng Cloudinary hoặc S3 để lưu images
4. **Search**: Implement full-text search với MongoDB indexes
5. **Caching**: Cache danh sách sản phẩm, categories cho performance
6. **Validation**: Validate tất cả inputs, đặc biệt là price và quantity
7. **Error Handling**: Xử lý lỗi đầy đủ với try-catch và error messages rõ ràng

## 🔧 Tools & Libraries Recommended

- **Image Upload**: Cloudinary, Multer
- **Payment Gateway**: PayOS, VNPay
- **Email**: Nodemailer (đã có)
- **Notifications**: Socket.io (đã có)
- **Search**: MongoDB text search hoặc Elasticsearch
- **File Storage**: Cloudinary hoặc AWS S3

---

**Status**: ✅ Models hoàn thiện, sẵn sàng implement Controllers và Routes






