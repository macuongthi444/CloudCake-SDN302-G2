# Hướng dẫn sửa lỗi VNPay Code 70 (Invalid Signature)

## ⚠️ Lỗi hiện tại
VNPay trả về lỗi code 70: "Sai chữ ký" (Invalid signature)

## 🔍 Nguyên nhân phổ biến nhất

### 1. **Hash Secret không đúng** (90% trường hợp)
- Hash Secret trong `.env` không khớp với VNPay merchant portal
- Hash Secret có spaces hoặc ký tự thừa

**Cách kiểm tra:**
1. Đăng nhập VNPay sandbox: https://sandbox.vnpayment.vn/
2. Vào "Cấu hình" → "Thông tin kết nối"
3. Copy Hash Secret chính xác (32 ký tự, không có spaces)
4. So sánh với `VNPAY_HASH_SECRET` trong `.env`

**Cách sửa:**
```bash
# Mở file .env trong back_end/
VNPAY_HASH_SECRET=94NABVIQUDO0EQZYLSFIJJPPYWU26CSA
# Đảm bảo không có spaces, không có quotes
```

### 2. **Return URL không accessible hoặc không đúng**
- Ngrok URL đã hết hạn
- Return URL không được đăng ký trong VNPay merchant portal
- Return URL không accessible từ internet

**Cách kiểm tra:**
1. Kiểm tra ngrok có đang chạy không:
   ```bash
   # Terminal 1: Chạy ngrok
   ngrok http 9999
   ```
2. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
3. Cập nhật `.env`:
   ```bash
   VNPAY_RETURN_URL=https://abc123.ngrok.io/api/order/vnpay-callback
   ```
4. Restart server backend

**Nếu không có ngrok:**
- Dùng localhost: `http://localhost:9999/api/order/vnpay-callback`
- ⚠️ Lưu ý: VNPay sandbox có thể không chấp nhận localhost
- Nên dùng ngrok hoặc public URL

### 3. **TMN Code không đúng**
- TMN Code trong `.env` không khớp với VNPay merchant portal

**Cách kiểm tra:**
1. Vào VNPay merchant portal
2. Copy TMN Code chính xác
3. So sánh với `VNPAY_TMN_CODE` trong `.env`

## 📋 Checklist sửa lỗi

### Bước 1: Kiểm tra credentials trong VNPay merchant portal
- [ ] Đăng nhập: https://sandbox.vnpayment.vn/
- [ ] Vào "Cấu hình" → "Thông tin kết nối"
- [ ] Copy **TMN Code**: `XCAD2ZXD` (hoặc code của bạn)
- [ ] Copy **Hash Secret**: `94NABVIQUDO0EQZYLSFIJJPPYWU26CSA` (hoặc secret của bạn)
- [ ] Kiểm tra **Return URL** đã đăng ký (nếu có)

### Bước 2: Cập nhật file .env
```bash
# back_end/.env
VNPAY_TMN_CODE=XCAD2ZXD
VNPAY_HASH_SECRET=94NABVIQUDO0EQZYLSFIJJPPYWU26CSA
VNPAY_RETURN_URL=http://localhost:9999/api/order/vnpay-callback
# Hoặc nếu dùng ngrok:
# VNPAY_RETURN_URL=https://abc123.ngrok.io/api/order/vnpay-callback
```

### Bước 3: Setup ngrok (khuyến nghị)
```bash
# Cài đặt ngrok (nếu chưa có)
# Windows: Download từ https://ngrok.com/download

# Chạy ngrok
ngrok http 9999

# Copy URL (ví dụ: https://abc123.ngrok.io)
# Cập nhật .env:
VNPAY_RETURN_URL=https://abc123.ngrok.io/api/order/vnpay-callback
```

### Bước 4: Restart server
```bash
# Dừng server (Ctrl+C)
# Chạy lại:
cd back_end
npm start
```

### Bước 5: Kiểm tra log
Khi tạo payment URL, kiểm tra log:
```
VNPay Service initialized:
- tmnCode: XCAD2ZXD
- returnUrl: http://localhost:9999/api/order/vnpay-callback
- hashSecretLength: 32
- hashSecretFirst10: 94NABVIQUDO...
- hashSecretLast10: ...U26CSA
```

### Bước 6: Test lại
1. Tạo đơn hàng mới
2. Chọn thanh toán VNPay
3. Kiểm tra log backend:
   - `VNPay: CREATE PAYMENT URL - START`
   - `Signature data`: Xem có đúng không
   - `Hash`: Xem hash được tính
4. Nếu vẫn lỗi code 70, kiểm tra:
   - Hash Secret có đúng không?
   - Return URL có accessible không?
   - TMN Code có đúng không?

## 🐛 Debug nâng cao

### Xem log chi tiết khi tạo payment URL:
```
========== VNPay: CREATE PAYMENT URL - START ==========
Step 9: Creating signature string
- Signature data: vnp_Amount=...&vnp_Command=pay&...
- Hash secret (first 10 chars): 94NABVIQUDO...
Step 10: Calculating HMAC SHA512 hash
- Calculated hash: eea7bdeb6c57931c0e08a36de209f991f3744fcd...
```

### Xem log khi VNPay callback:
```
========== VNPay: VERIFY RETURN - START ==========
Step 2: Extract hash
- Received hash: eea7bdeb6c57931c0e08a36de209f991f3744fcd...
Step 7: Calculate hash
- Calculated hash: eea7bdeb6c57931c0e08a36de209f991f3744fcd...
Step 8: Compare hashes
- Hash match: true/false
```

## ⚡ Giải pháp nhanh

1. **Kiểm tra Hash Secret:**
   - Đảm bảo Hash Secret trong `.env` đúng với VNPay merchant portal
   - Không có spaces, không có quotes

2. **Dùng ngrok:**
   ```bash
   ngrok http 9999
   # Copy URL và cập nhật VNPAY_RETURN_URL
   ```

3. **Restart server sau khi thay đổi .env**

4. **Kiểm tra log để xem signature data và hash**

## 📞 Nếu vẫn lỗi

1. Gửi log chi tiết (CREATE PAYMENT URL và VERIFY RETURN)
2. Gửi Hash Secret preview (first 10, last 10 chars - KHÔNG gửi full)
3. Gửi Return URL đang dùng
4. Liên hệ VNPay support để verify credentials

## 🔗 Tài liệu tham khảo

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- Ngrok: https://ngrok.com/

