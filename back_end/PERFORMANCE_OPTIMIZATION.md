# Tối Ưu Performance Server

## Tổng Quan

Các tối ưu đã được áp dụng để cải thiện tốc độ phản hồi của server Node.js, giảm thời gian response từ 30-104ms xuống thấp hơn đáng kể.

## Các Tối Ưu Đã Áp Dụng

### 1. **Compression Middleware (Gzip)**
- **File**: `back_end/server.js`
- **Lợi ích**: Giảm kích thước response lên đến 70-90%
- **Cài đặt**: `compression` package với level 6
- **Ảnh hưởng**: Response time giảm đáng kể, đặc biệt với dữ liệu lớn

### 2. **In-Memory Caching**
- **File**: `back_end/src/utils/cache.js`
- **Lợi ích**: Giảm số lượng query database
- **Cơ chế**: 
  - Cache dữ liệu thường xuyên truy cập
  - Tự động xóa cache khi dữ liệu thay đổi
  - TTL (Time To Live) linh hoạt

**Cache Duration:**
- User data: 5 phút
- Categories: 10 phút
- Products (page 1): 5 phút
- Cart: 1 phút (vì thay đổi thường xuyên)

### 3. **Mongoose Query Optimization**
- **Sử dụng `.lean()`**: Trả về plain JavaScript objects thay vì Mongoose documents
- **Lợi ích**: Nhanh hơn 20-30% vì không cần hydrate Mongoose objects
- **Áp dụng cho**: Tất cả read operations (GET requests)

### 4. **MongoDB Connection Pooling**
- **File**: `back_end/src/models/index.js`
- **Cài đặt**:
  - `maxPoolSize: 10` - Tối đa 10 connections
  - `minPoolSize: 5` - Tối thiểu 5 connections
  - `serverSelectionTimeoutMS: 5000` - Timeout khi chọn server
  - `socketTimeoutMS: 45000` - Timeout cho socket operations
  - `retryWrites: true` - Tự động retry write operations
  - `retryReads: true` - Tự động retry read operations
  - `readPreference: 'primaryPreferred'` - Ưu tiên primary, fallback secondary

### 5. **HTTP Caching Headers**
- **Cache-Control headers**: Được set cho tất cả responses
- **Public cache**: Categories, Products (10-5 phút)
- **Private cache**: User, Cart (5-1 phút)
- **Lợi ích**: Browser/CDN có thể cache responses

### 6. **Body Parser Optimization**
- **Limit**: 10MB (đủ cho upload images)
- **Extended**: true cho URL encoded data

## Cách Sử Dụng

### Cài Đặt Dependencies
```bash
cd back_end
npm install
```

### Cache Operations

**Sử dụng cache trong controllers:**
```javascript
const cache = require('../utils/cache');

// Get từ cache hoặc database
const cacheKey = `user:${id}`;
const cached = cache.get(cacheKey);
if (cached) {
    return res.status(200).json(cached);
}

// Query database và cache kết quả
const user = await User.findById(id).lean();
cache.set(cacheKey, user, 300000); // 5 phút

// Xóa cache khi update
cache.delete(`user:${id}`);

// Xóa nhiều keys cùng pattern
cache.clearPattern('products:');
```

## Kết Quả Mong Đợi

### Trước Tối Ưu:
- GET /api/user/:id: **30-37ms**
- GET /api/cart/user/:id: **85ms**
- GET /api/product/list: **104ms**
- GET /api/category/list: **36ms**

### Sau Tối Ưu:
- **Lần đầu**: Giống như trước (query DB)
- **Lần sau (cached)**: **< 5ms** (từ cache)
- **Với compression**: Response size giảm 70-90%

## Best Practices

1. **Cache Invalidation**: Luôn xóa cache khi dữ liệu thay đổi
2. **TTL hợp lý**: 
   - Dữ liệu ít thay đổi: 10-30 phút
   - Dữ liệu thay đổi thường xuyên: 1-5 phút
3. **Sử dụng `.lean()`**: Cho tất cả read-only queries
4. **Select fields**: Chỉ select fields cần thiết (ví dụ: `.select('-password')`)

## Monitoring

Để monitor hiệu suất:
- Sử dụng `morgan` middleware để log request times
- Monitor cache hit rates (có thể thêm metrics vào cache utility)
- Monitor MongoDB connection pool usage

## Tối Ưu Thêm (Tùy Chọn)

### Redis Cache (Production)
Để scale tốt hơn trong production, có thể thay thế in-memory cache bằng Redis:
```bash
npm install redis
```

### Database Indexes
Đảm bảo các indexes được tạo:
- User.email (unique)
- Product.shopId, categoryId, isActive
- Cart.userId

### CDN
Sử dụng CDN cho static assets và API responses (với cache headers đã set)

## Notes

- In-memory cache chỉ hoạt động trong single process
- Nếu deploy multiple instances, nên dùng Redis
- Cache sẽ tự động clean expired entries mỗi 5 phút

