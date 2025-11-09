# VNPay "Sai chữ ký" (Invalid Signature) - Nguyên nhân và Giải pháp

## Tóm tắt
Lỗi "Sai chữ ký" (code 70) từ VNPay xảy ra khi signature được tính không khớp với signature mà VNPay mong đợi.

## Các nguyên nhân phổ biến

### 1. **Hash Secret không đúng** ⚠️ NGUYÊN NHÂN PHỔ BIẾN NHẤT
- **Vấn đề**: `VNPAY_HASH_SECRET` trong `.env` không khớp với Hash Secret trong VNPay merchant portal
- **Giải pháp**:
  1. Đăng nhập VNPay merchant portal (sandbox)
  2. Vào phần "Cấu hình" → "Thông tin kết nối"
  3. Copy Hash Secret chính xác (không có spaces, không có ký tự thừa)
  4. Cập nhật `VNPAY_HASH_SECRET` trong `.env`
  5. Restart server

### 2. **Return URL không khớp hoặc không accessible**
- **Vấn đề**: 
  - Return URL trong code khác với URL đã đăng ký trong VNPay merchant portal
  - Ngrok URL thay đổi nhưng chưa cập nhật
  - Return URL không accessible từ internet
- **Giải pháp**:
  1. Kiểm tra Return URL trong VNPay merchant portal
  2. Đảm bảo `VNPAY_RETURN_URL` trong `.env` khớp chính xác
  3. Nếu dùng ngrok, đảm bảo ngrok đang chạy và URL không thay đổi
  4. Test return URL có accessible từ browser không

### 3. **TMN Code không đúng**
- **Vấn đề**: `VNPAY_TMN_CODE` không khớp với TMN Code trong VNPay merchant portal
- **Giải pháp**:
  1. Kiểm tra TMN Code trong VNPay merchant portal
  2. Cập nhật `VNPAY_TMN_CODE` trong `.env`
  3. Restart server

### 4. **vnp_TxnRef format không đúng**
- **Vấn đề**: 
  - TxnRef chứa ký tự đặc biệt không được phép
  - TxnRef quá dài (> 100 ký tự)
  - TxnRef không unique
- **Giải pháp**:
  - Code hiện tại đã xử lý: loại bỏ ký tự đặc biệt, giới hạn 100 ký tự
  - Đảm bảo dùng `orderNumber` thay vì `order._id` (ngắn hơn, sạch hơn)

### 5. **vnp_ReturnUrl trong signature không khớp**
- **Vấn đề**: Return URL trong signature calculation khác với Return URL thực tế
- **Giải pháp**:
  - Code hiện tại đã đảm bảo: Return URL được dùng chính xác trong signature
  - Kiểm tra log "Signature data" để verify Return URL có đúng không

### 6. **Parameters bị thiếu hoặc thừa**
- **Vấn đề**: 
  - Thiếu parameters bắt buộc (vnp_Amount, vnp_TxnRef, vnp_ReturnUrl, etc.)
  - Thừa parameters không cần thiết
- **Giải pháp**:
  - Code hiện tại đã đảm bảo tất cả parameters bắt buộc được thêm vào
  - Kiểm tra log "Base params" để verify

### 7. **URL encoding không nhất quán**
- **Vấn đề**: Signature dùng encoding khác với URL cuối cùng
- **Giải pháp**:
  - Code hiện tại đã đảm bảo: cả signature và URL đều dùng `encode: false`
  - Theo đúng VNPay official docs

### 8. **Thứ tự parameters không đúng**
- **Vấn đề**: Parameters không được sort đúng trước khi tính signature
- **Giải pháp**:
  - Code hiện tại đã sort parameters theo alphabetical order
  - Kiểm tra log "Sorted params" để verify

## Các bước debug

### Bước 1: Kiểm tra credentials
```bash
# Kiểm tra .env
cat .env | grep VNPAY

# Đảm bảo:
# - VNPAY_TMN_CODE đúng
# - VNPAY_HASH_SECRET đúng (không có spaces, không có ký tự thừa)
# - VNPAY_RETURN_URL đúng và accessible
```

### Bước 2: Kiểm tra log khi tạo Payment URL
Khi tạo payment URL, kiểm tra log:
- `VNPay: CREATE PAYMENT URL - START`
- `Signature data`: Xem signature string có đúng không
- `Hash`: Xem hash được tính có đúng không
- `Return URL`: Xem return URL có đúng không

### Bước 3: Kiểm tra log khi VNPay callback
Khi VNPay redirect về, kiểm tra log:
- `VNPay: VERIFY RETURN - START`
- `Received hash`: Hash nhận được từ VNPay
- `Calculated hash`: Hash tính lại
- `Hash match`: So sánh 2 hash có khớp không
- Nếu không khớp, xem "Hash comparison details" để tìm vị trí khác biệt

### Bước 4: So sánh parameters
So sánh parameters gửi đi với parameters nhận về:
- `vnp_TxnRef`: Có khớp không?
- `vnp_Amount`: Có khớp không?
- `vnp_ReturnUrl`: Có khớp không?
- Các parameters khác: Có thay đổi không?

## Checklist trước khi test

- [ ] Hash Secret đúng với VNPay merchant portal
- [ ] TMN Code đúng với VNPay merchant portal
- [ ] Return URL đúng và accessible từ internet
- [ ] Return URL khớp với URL đã đăng ký trong VNPay merchant portal
- [ ] Ngrok đang chạy (nếu dùng ngrok)
- [ ] Server đã restart sau khi thay đổi .env
- [ ] Log đã được bật để debug

## Lưu ý đặc biệt

1. **Ngrok URL thay đổi**: Mỗi lần restart ngrok, URL sẽ thay đổi. Cần cập nhật `VNPAY_RETURN_URL` và restart server.

2. **Hash Secret có spaces**: Đảm bảo Hash Secret không có spaces ở đầu/cuối. Dùng `.trim()` nếu cần.

3. **Return URL với trailing slash**: Đảm bảo Return URL không có trailing slash nếu không cần thiết.

4. **Sandbox vs Production**: Sandbox và Production có Hash Secret và TMN Code khác nhau. Đảm bảo dùng đúng credentials cho môi trường tương ứng.

## Liên hệ hỗ trợ

Nếu vẫn gặp lỗi sau khi kiểm tra tất cả các điểm trên:
1. Gửi log chi tiết (CREATE PAYMENT URL và VERIFY RETURN)
2. Gửi Hash Secret preview (first 10, last 10 chars - KHÔNG gửi full secret)
3. Gửi Return URL đang dùng
4. Liên hệ VNPay support để verify credentials

