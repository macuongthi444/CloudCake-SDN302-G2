# Product API Guide - Cloud-Cake

## Quyền truy cập (Permissions)

### Ai có thể thêm sản phẩm?

1. **SELLER** - Chỉ được thêm sản phẩm cho **shop của chính họ**
   - Phải có shop đã được admin duyệt (status = ACTIVE)
   - Không thể thêm sản phẩm cho shop khác

2. **ADMIN** - Có thể thêm sản phẩm cho **bất kỳ shop nào**
   - Phải chỉ định shopId trong request
   - Full quyền quản lý tất cả sản phẩm

3. **MEMBER** - **KHÔNG** có quyền thêm sản phẩm
   - Chỉ có thể xem và mua sản phẩm

## API Endpoints

### 1. Lấy danh sách sản phẩm (Public)
```
GET /api/product/list
Query params:
- categoryId: Filter by category
- shopId: Filter by shop
- search: Text search
- minPrice, maxPrice: Price range
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- sortBy: Field to sort (default: createdAt)
- sortOrder: 1 (asc) or -1 (desc)

Example:
GET /api/product/list?categoryId=xxx&page=1&limit=20
```

### 2. Lấy chi tiết sản phẩm (Public)
```
GET /api/product/find/:id

Response includes:
- Product details
- All active variants
```

### 3. Tạo sản phẩm mới (Seller/Admin)
```
POST /api/product/create
Headers:
  x-access-token: YOUR_JWT_TOKEN
  Content-Type: multipart/form-data

Body (FormData):
- name*: String (required)
- description: String
- shortDescription: String
- categoryId*: ObjectId (required)
- shopId: ObjectId (optional - required for Admin)
- basePrice*: Number (required)
- discountedPrice: Number
- sku: String
- tags: JSON array
- ingredients: JSON array
- allergens: JSON array
- nutritionalInfo: JSON object
- weight: JSON object {value, unit}
- shelfLife: JSON object {value, unit}
- images: File[] (multiple images, max 10)
  - First image will be marked as primary

Note:
- SELLER: shopId tự động lấy từ shop của họ
- ADMIN: phải cung cấp shopId
```

### 4. Cập nhật sản phẩm (Seller can only update their own)
```
PUT /api/product/edit/:id
Headers:
  x-access-token: YOUR_JWT_TOKEN
  Content-Type: multipart/form-data

Body: Same as create, all fields optional
- New images will be appended to existing images
```

### 5. Xóa sản phẩm (Seller can only delete their own)
```
DELETE /api/product/delete/:id
Headers:
  x-access-token: YOUR_JWT_TOKEN

Note: Also deletes all associated variants
```

### 6. Lấy sản phẩm theo shop (Public)
```
GET /api/product/shop/:shopId
```

## Cloudinary Configuration

Đảm bảo trong `.env` có:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDNARY_API_KEY=your_api_key
CLOUDNARY_API_SECRET=your_api_secret
```

### Image Upload Details
- **Folder**: `cloudcake/products`
- **Max file size**: 5MB
- **Allowed formats**: jpg, jpeg, png, webp, gif
- **Auto optimization**: Images automatically optimized by Cloudinary
- **Max images per product**: 10

## Example Requests

### Create Product (Seller)
```javascript
const formData = new FormData();
formData.append('name', 'Bánh Sinh Nhật Chocolate');
formData.append('description', 'Bánh sinh nhật cao cấp...');
formData.append('categoryId', 'CATEGORY_ID');
formData.append('basePrice', '450000');
formData.append('images', file1);
formData.append('images', file2);

fetch('/api/product/create', {
  method: 'POST',
  headers: {
    'x-access-token': 'YOUR_TOKEN'
  },
  body: formData
});
```

### Create Product (Admin)
```javascript
const formData = new FormData();
formData.append('name', 'Bánh Kem Dâu');
formData.append('shopId', 'SHOP_ID'); // Required for Admin
formData.append('categoryId', 'CATEGORY_ID');
formData.append('basePrice', '280000');
formData.append('images', file);

// ... same as above
```

## Response Format

### Success Response (Create/Update)
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "...",
    "name": "...",
    "images": [
      {
        "url": "https://res.cloudinary.com/...",
        "isPrimary": true,
        "alt": "..."
      }
    ],
    ...
  }
}
```

### Error Response
```json
{
  "error": {
    "status": 403,
    "message": "You can only add products to your own shop"
  }
}
```

## Security Notes

1. **JWT Token Required** for create/update/delete
2. **Role Verification**: 
   - `isSellerOrAdmin` middleware checks user roles
3. **Ownership Check**:
   - Seller chỉ có thể manage products của shop mình
   - Admin có thể manage tất cả
4. **Shop Status Check**:
   - Product chỉ được tạo khi shop có status ACTIVE

## Workflow

### Seller Workflow:
1. Seller đăng ký → Tạo Shop → Admin duyệt Shop
2. Seller tạo Product → Upload images → Product status = DRAFT
3. (Optional) Admin review và activate Product

### Admin Workflow:
1. Admin có thể tạo Product cho bất kỳ Shop nào
2. Admin có thể update/delete bất kỳ Product nào














