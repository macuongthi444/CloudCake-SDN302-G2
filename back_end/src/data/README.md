# Sample Data for Testing Cart Functionality

## Files

- `sample-data.json` - JSON data for Categories, Shops, Products, and ProductVariants
- `seed-products.js` - Script to seed data into MongoDB

## How to Use

### Option 1: Use the Seed Script

```bash
cd back_end
node src/data/seed-products.js
```

This script will:
- Connect to your MongoDB database
- Create/Update Categories, Shops, Products, and ProductVariants
- Print sample data format for testing Cart API

### Option 2: Manual Import via API

You can use the sample JSON data to create products via your API endpoints.

### Option 3: Manual MongoDB Import

Use MongoDB Compass or mongoimport to import the JSON data directly.

## Sample Cart API Test Data

After seeding, you can test Cart API with this format:

```json
{
  "userId": "YOUR_USER_ID",
  "productId": "PRODUCT_ID",
  "variantId": "VARIANT_ID",
  "productName": "Bánh Sinh Nhật Chocolate Premium",
  "variantName": "Nhỏ - Hình Tròn",
  "quantity": 1,
  "price": 320000,
  "image": "https://example.com/images/variants/..."
}
```

## Products Included

1. **Bánh Sinh Nhật Chocolate Premium** - 4 variants (Nhỏ/Vừa/Lớn + Hình tròn/Trái tim)
2. **Bánh Kem Dâu Tây Tươi** - 2 variants (Vừa/Lớn)
3. **Bánh Tiramisu Ý** - 1 variant
4. **Bánh Cupcake Vanilla** - 1 variant (Set 6)
5. **Bánh Tart Dâu Tây** - 1 variant

## Notes

- All prices are in VND (Vietnamese Dong)
- Images URLs are placeholders - replace with actual image URLs
- Shop ownerId will be auto-assigned to first SELLER user found
- Categories and Shops are assigned to products automatically






