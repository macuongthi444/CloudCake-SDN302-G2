# Phân tích log VNPay - Code 70

## 📊 Từ log hiện tại:

### ✅ Payment URL được tạo thành công:
- **Hash algorithm**: SHA256 ✅
- **Hash length**: 64 ký tự (đúng cho SHA256) ✅
- **Hash**: `9446975da818818efab5fcbc7a33c7ed02bc4662ec26badb693f4d960e803ea4`
- **Signature data**: Đúng format ✅
- **Return URL**: `https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback` ✅

### ⚠️ Vấn đề phát hiện:

#### 1. **vnp_TxnRef có dấu gạch ngang**
- **Hiện tại**: `ORD-20251109-0001`
- **Vấn đề**: VNPay có thể không chấp nhận dấu gạch ngang trong TxnRef
- **Đã sửa**: Loại bỏ tất cả ký tự đặc biệt (bao gồm dấu gạch ngang)
- **Sau khi sửa**: `ORD202511090001`

#### 2. **Callback không nhận được query params**
- **Log**: `Request query: {}` - Query params rỗng
- **Nguyên nhân**: Có thể là request test từ browser, không phải từ VNPay
- **Giải pháp**: Đợi VNPay redirect về thật sự

## 🔍 Các nguyên nhân có thể gây lỗi Code 70:

### 1. **Hash Secret không đúng** (Nguyên nhân phổ biến nhất)
- **Kiểm tra**: So sánh Hash Secret trong `.env` với VNPay merchant portal
- **Hash Secret từ VNPay**: `94NABVIQUDO0EQZYLSFIJJPPYWU26CSA`
- **Hash Secret trong code**: `94NABVIQUDO0EQZYLSFIJJPPYWU26CSA` ✅

### 2. **Return URL không khớp**
- **Return URL trong code**: `https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback`
- **Kiểm tra**: Đảm bảo URL này được đăng ký trong VNPay merchant portal
- **Kiểm tra**: Ngrok đang chạy và URL accessible

### 3. **vnp_TxnRef format** (Đã sửa)
- **Trước**: `ORD-20251109-0001` (có dấu gạch ngang)
- **Sau**: `ORD202511090001` (không có dấu gạch ngang)
- **Lý do**: VNPay có thể không chấp nhận dấu gạch ngang

### 4. **Hash algorithm**
- **Hiện tại**: SHA256 (64 ký tự)
- **Lưu ý**: Một số VNPay sandbox có thể yêu cầu SHA512 (128 ký tự)
- **Kiểm tra**: Nếu vẫn lỗi, thử đổi lại SHA512

## 📋 Checklist kiểm tra:

- [x] Hash algorithm: SHA256 ✅
- [x] Hash length: 64 ký tự ✅
- [x] Signature data: Đúng format ✅
- [x] Return URL: Đúng format ✅
- [ ] **Hash Secret**: Cần verify với VNPay merchant portal
- [ ] **Return URL**: Cần đăng ký trong VNPay merchant portal
- [x] **vnp_TxnRef**: Đã sửa để loại bỏ dấu gạch ngang ✅

## 🔄 Các bước tiếp theo:

1. **Restart server** để áp dụng thay đổi (loại bỏ dấu gạch ngang trong TxnRef)

2. **Kiểm tra Hash Secret**:
   - Đăng nhập VNPay merchant portal
   - Vào "Cấu hình" → "Thông tin kết nối"
   - Copy Hash Secret chính xác
   - So sánh với `.env`

3. **Kiểm tra Return URL**:
   - Đảm bảo Return URL được đăng ký trong VNPay merchant portal
   - Test URL có accessible không: `https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback`

4. **Test lại**:
   - Tạo đơn hàng mới
   - Chọn thanh toán VNPay
   - Kiểm tra log để xem TxnRef mới (không có dấu gạch ngang)

5. **Nếu vẫn lỗi Code 70**:
   - Thử đổi lại SHA512 (nếu VNPay sandbox yêu cầu)
   - Kiểm tra Hash Secret có đúng không
   - Liên hệ VNPay support để verify credentials

## 🐛 Debug nâng cao:

### So sánh signature data:
```
Signature data: vnp_Amount=48000000&vnp_Command=pay&vnp_CreateDate=20251109041825&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=ThanhtoandonhangORD202511090001&vnp_OrderType=billpayment&vnp_ReturnUrl=https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback&vnp_TmnCode=XCAD2ZXD&vnp_TxnRef=ORD-20251109-0001&vnp_Version=2.1.0
```

**Lưu ý**: Sau khi sửa, TxnRef sẽ là `ORD202511090001` (không có dấu gạch ngang), signature data sẽ thay đổi.

### Hash được tính:
```
Hash: 9446975da818818efab5fcbc7a33c7ed02bc4662ec26badb693f4d960e803ea4
Length: 64 (đúng cho SHA256)
```

## ⚠️ Lưu ý quan trọng:

1. **Sau khi sửa TxnRef**, signature sẽ thay đổi vì TxnRef là một phần của signature data
2. **Restart server** để áp dụng thay đổi
3. **Test lại** với đơn hàng mới để xem TxnRef mới (không có dấu gạch ngang)
4. **Nếu vẫn lỗi**, có thể cần đổi lại SHA512 hoặc kiểm tra Hash Secret

