# Cloud-Cake: Kiến trúc và Thiết kế Hệ thống

## 1. Tổng quan Hệ thống

Cloud-Cake là hệ thống bán bánh online với các tính năng:
- Quản lý sản phẩm (bánh) đa dạng
- Hệ thống đơn hàng và thanh toán
- Quản lý cửa hàng (nếu nhiều seller)
- Giỏ hàng và checkout
- Đánh giá và phản hồi

## 2. Mô hình Dữ liệu (Database Models)

### 2.1. Core Models (Đã có)
- ✅ **User** - Người dùng (Customer, Seller, Admin)
- ✅ **Role** - Vai trò (MEMBER, SELLER, ADMIN)
- ✅ **PaymentMethod** - Phương thức thanh toán
- ✅ **Cart** - Giỏ hàng
- ✅ **Address** - Địa chỉ người dùng

### 2.2. Product Models (Cần tạo)
- **Category** - Danh mục bánh (Bánh sinh nhật, Bánh kem, Bánh mì, v.v.)
- **Product** - Sản phẩm bánh
- **ProductVariant** - Biến thể sản phẩm (kích thước, vị)
- **ProductImage** - Hình ảnh sản phẩm
- **Inventory** - Tồn kho

### 2.3. Order Models (Cần tạo)
- **Order** - Đơn hàng
- **OrderItem** - Chi tiết đơn hàng
- **OrderStatus** - Trạng thái đơn hàng

### 2.4. Shop Models (Cần tạo)
- **Shop** - Cửa hàng
- **ShopStatus** - Trạng thái cửa hàng

### 2.5. Additional Models (Cần tạo)
- **Review** - Đánh giá sản phẩm
- **Coupon** - Mã giảm giá
- **ShippingMethod** - Phương thức vận chuyển
- **Notification** - Thông báo

## 3. Mối quan hệ giữa các Models (ERD)

```
User (1) ────< (N) Address
User (1) ────< (N) Cart
User (1) ────< (N) Order
User (N) ────< (N) Role

Shop (1) ────< (N) User (seller)
Shop (1) ────< (N) Product

Category (1) ────< (N) Product
Product (1) ────< (N) ProductVariant
Product (1) ────< (N) ProductImage
ProductVariant (1) ────< (1) Inventory

Order (1) ────< (N) OrderItem
Order (N) ────> (1) User (customer)
Order (N) ────> (1) PaymentMethod
Order (N) ────> (1) ShippingMethod
Order (N) ────> (1) Address
OrderItem (N) ────> (1) ProductVariant

Product (1) ────< (N) Review
Review (N) ────> (1) User

Coupon ────> (N) Order (optional)
```

## 4. Luồng nghiệp vụ chính

### 4.1. Luồng Mua hàng
1. User xem danh sách sản phẩm
2. User chọn sản phẩm → Thêm vào Cart
3. User xem Cart → Chọn phương thức thanh toán/vận chuyển
4. User tạo Order từ Cart
5. Hệ thống tạo Order với status "PENDING"
6. User thanh toán → Update Order status
7. Shop xác nhận → Update Order status
8. Shop giao hàng → Update Order status
9. User nhận hàng → Complete Order

### 4.2. Luồng Quản lý Sản phẩm (Seller)
1. Seller tạo Shop (nếu chưa có)
2. Seller tạo Category (hoặc Admin tạo)
3. Seller tạo Product với thông tin: tên, mô tả, giá
4. Seller tạo ProductVariant (Size: Nhỏ, Vừa, Lớn / Vị: Dâu, Socola, Vanilla)
5. Seller quản lý Inventory cho từng Variant
6. Seller upload ProductImage

## 5. Cấu trúc API Endpoints

### Product APIs
- GET /api/products - Danh sách sản phẩm
- GET /api/products/:id - Chi tiết sản phẩm
- POST /api/products - Tạo sản phẩm (Seller/Admin)
- PUT /api/products/:id - Cập nhật (Seller/Admin)
- DELETE /api/products/:id - Xóa (Admin)

### Category APIs
- GET /api/categories - Danh sách danh mục
- POST /api/categories - Tạo danh mục (Admin)

### Order APIs
- GET /api/orders - Danh sách đơn hàng
- GET /api/orders/:id - Chi tiết đơn hàng
- POST /api/orders - Tạo đơn hàng từ Cart
- PUT /api/orders/:id/status - Cập nhật trạng thái

### Shop APIs
- GET /api/shops - Danh sách cửa hàng
- POST /api/shops - Tạo cửa hàng (Seller)
- PUT /api/shops/:id - Cập nhật cửa hàng

## 6. Security & Authentication

- JWT Authentication cho tất cả protected routes
- Role-based Access Control (RBAC):
  - MEMBER: Xem sản phẩm, mua hàng
  - SELLER: Quản lý shop, sản phẩm của mình
  - ADMIN: Full access

## 7. Frontend Structure

```
/admin
  ├── products/ (Quản lý sản phẩm)
  ├── categories/ (Quản lý danh mục)
  ├── orders/ (Quản lý đơn hàng)
  ├── payments/ (Đã có)
  └── shops/ (Quản lý cửa hàng)

/pages
  ├── Products/ (Danh sách sản phẩm)
  ├── ProductDetail/ (Chi tiết sản phẩm)
  ├── Cart/ (Đã có)
  ├── Checkout/ (Thanh toán)
  └── OrderHistory/ (Lịch sử đơn hàng)
```

## 8. Database Indexing

Các trường cần index để tối ưu performance:
- User.email (unique)
- Product.shopId
- Order.userId
- Order.status
- Product.categoryId
- ProductVariant.productId

## 9. Tính năng nâng cao (Future)

- Real-time notifications (WebSocket)
- Search & Filter nâng cao (Elasticsearch)
- Recommendation engine
- Analytics & Reports
- Payment gateway integration (PayOS, VNPay)
- Email notifications
- SMS notifications





