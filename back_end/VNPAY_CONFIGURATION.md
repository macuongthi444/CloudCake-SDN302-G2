# ✅ Cấu hình VNPay - Thông tin chính thức

## 📋 Thông tin credentials từ VNPay

### ✅ Đã xác nhận đúng:
- **Terminal ID (vnp_TmnCode)**: `XCAD2ZXD` ✅
- **Secret Key (vnp_HashSecret)**: `94NABVIQUDO0EQZYLSFIJJPPYWU26CSA` ✅
- **URL thanh toán**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` ✅
- **Merchant Admin**: https://sandbox.vnpayment.vn/merchantv2/
- **Tài khoản**: xuankhanh036@gmail.com

## 🔧 Cấu hình trong code

### 1. File `.env` (back_end/.env)
```bash
VNPAY_TMN_CODE=XCAD2ZXD
VNPAY_HASH_SECRET=94NABVIQUDO0EQZYLSFIJJPPYWU26CSA
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback
VNPAY_IPN_URL=https://da5e18280afb.ngrok-free.app/api/payment/vnpay/ipn
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
FRONTEND_URL=http://localhost:3000
```

### 2. URLs quan trọng

#### Return URL (User redirect sau khi thanh toán):
```
https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback
```
- **Route**: `GET /api/order/vnpay-callback`
- **File**: `back_end/src/routers/order.routes.js`
- **Controller**: `vnpayController.returnCallback`
- **Mục đích**: VNPay redirect user về sau khi thanh toán

#### IPN URL (Server-to-server notification):
```
https://da5e18280afb.ngrok-free.app/api/payment/vnpay/ipn
```
- **Route**: `POST /api/payment/vnpay/ipn`
- **File**: `back_end/src/routers/payment.routes.js`
- **Controller**: `vnpayController.ipn`
- **Mục đích**: VNPay gửi notification server-to-server để cập nhật trạng thái thanh toán

## 🔐 Cấu hình trong VNPay Merchant Portal

### Bước 1: Đăng nhập Merchant Admin
1. Truy cập: https://sandbox.vnpayment.vn/merchantv2/
2. Đăng nhập với: `xuankhanh036@gmail.com`
3. Vào phần "Cấu hình" → "Thông tin kết nối"

### Bước 2: Cấu hình Return URL
- **Return URL**: `https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback`
- ⚠️ **Lưu ý**: Nếu ngrok URL thay đổi, cần cập nhật lại trong merchant portal

### Bước 3: Cấu hình IPN URL (QUAN TRỌNG)
- **IPN URL**: `https://da5e18280afb.ngrok-free.app/api/payment/vnpay/ipn`
- **Method**: POST
- **Mục đích**: VNPay sẽ gửi notification server-to-server để cập nhật trạng thái thanh toán
- ⚠️ **Lưu ý**: IPN URL phải accessible từ internet (dùng ngrok)

## 📝 Kiểm tra cấu hình

### 1. Kiểm tra credentials trong code
```bash
# Xem log khi server khởi động:
VNPay Service initialized:
- tmnCode: XCAD2ZXD
- returnUrl: https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback
- hashSecretLength: 32
- hashSecretFirst10: 94NABVIQUDO...
- hashSecretLast10: ...U26CSA
```

### 2. Test Return URL
```bash
# Test trong browser:
https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback

# Nên trả về redirect hoặc error (không phải 404)
```

### 3. Test IPN URL
```bash
# Test với curl:
curl -X POST https://da5e18280afb.ngrok-free.app/api/payment/vnpay/ipn

# Nên trả về JSON response
```

## 🔄 Khi ngrok URL thay đổi

Nếu restart ngrok và URL thay đổi:

1. **Cập nhật `.env`:**
   ```bash
   VNPAY_RETURN_URL=https://NEW_NGROK_URL.ngrok-free.app/api/order/vnpay-callback
   VNPAY_IPN_URL=https://NEW_NGROK_URL.ngrok-free.app/api/payment/vnpay/ipn
   ```

2. **Cập nhật trong VNPay Merchant Portal:**
   - Return URL
   - IPN URL

3. **Restart server:**
   ```bash
   cd back_end
   npm start
   ```

## ✅ Checklist

- [x] TMN Code: `XCAD2ZXD` ✅
- [x] Hash Secret: `94NABVIQUDO0EQZYLSFIJJPPYWU26CSA` ✅
- [x] Pay URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` ✅
- [x] Return URL: `https://da5e18280afb.ngrok-free.app/api/order/vnpay-callback` ✅
- [ ] IPN URL đã cấu hình trong VNPay Merchant Portal
- [ ] Ngrok đang chạy và accessible
- [ ] Server đã restart sau khi cập nhật .env

## 🐛 Debug lỗi Code 70

Nếu vẫn gặp lỗi "Sai chữ ký" (code 70):

1. **Kiểm tra Hash Secret:**
   - So sánh với VNPay merchant portal
   - Đảm bảo không có spaces/quotes

2. **Kiểm tra Return URL:**
   - Khớp với URL trong merchant portal
   - Accessible từ internet

3. **Kiểm tra log:**
   - `VNPay: CREATE PAYMENT URL - SUMMARY`
   - `VNPay: VERIFY RETURN - RESULT`
   - `Hash match: true/false`

## 📚 Tài liệu tham khảo

- **Tài liệu tích hợp**: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- **Code demo**: https://sandbox.vnpayment.vn/apis/vnpay-demo/code-demo-tích-hợp
- **Test case (SIT)**: https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login

