# ✅ Checklist sửa lỗi VNPay Code 70

## 🔍 Kiểm tra ngay

### 1. ✅ Ngrok đang chạy
- [x] Ngrok URL: `https://374ce93856c2.ngrok-free.app`
- [x] Forwarding đến: `http://localhost:9999`
- [x] Status: online

### 2. ⚠️ Return URL đã được cập nhật
- [x] Code đã dùng: `https://374ce93856c2.ngrok-free.app/api/order/vnpay-callback`
- [ ] **QUAN TRỌNG**: Cập nhật trong `.env` để đảm bảo nhất quán:
  ```bash
  VNPAY_RETURN_URL=https://374ce93856c2.ngrok-free.app/api/order/vnpay-callback
  ```

### 3. 🔑 Kiểm tra Hash Secret (QUAN TRỌNG NHẤT)
- [ ] Đăng nhập VNPay sandbox: https://sandbox.vnpayment.vn/
- [ ] Vào "Cấu hình" → "Thông tin kết nối"
- [ ] Copy Hash Secret chính xác (32 ký tự)
- [ ] So sánh với `VNPAY_HASH_SECRET` trong `.env`
- [ ] Đảm bảo không có spaces, không có quotes

**Hash Secret hiện tại trong code:**
```
94NABVIQUDO0EQZYLSFIJJPPYWU26CSA
```

### 4. 🔢 Kiểm tra TMN Code
- [ ] TMN Code trong VNPay portal: `XCAD2ZXD`
- [ ] TMN Code trong `.env`: `XCAD2ZXD`
- [ ] Khớp nhau: [ ]

### 5. 🔄 Restart server
- [ ] Sau khi cập nhật `.env`, restart server:
  ```bash
  cd back_end
  npm start
  ```

### 6. 📋 Kiểm tra log khi tạo payment URL
Khi tạo payment URL, kiểm tra log:
```
VNPay Service initialized:
- returnUrl: https://374ce93856c2.ngrok-free.app/api/order/vnpay-callback
- hashSecretLength: 32
- hashSecretFirst10: 94NABVIQUDO...
- hashSecretLast10: ...U26CSA
```

### 7. 📋 Kiểm tra log khi VNPay callback
Khi VNPay redirect về, kiểm tra log:
```
========== VNPay: VERIFY RETURN - START ==========
Step 8: Compare hashes
- Hash match: true/false
```

**Nếu `Hash match: false`:**
- Xem "Hash comparison details" để tìm vị trí khác biệt
- Kiểm tra Hash Secret có đúng không
- Kiểm tra Return URL có khớp không

## 🎯 Các bước tiếp theo

1. **Cập nhật `.env`:**
   ```bash
   VNPAY_TMN_CODE=XCAD2ZXD
   VNPAY_HASH_SECRET=94NABVIQUDO0EQZYLSFIJJPPYWU26CSA
   VNPAY_RETURN_URL=https://374ce93856c2.ngrok-free.app/api/order/vnpay-callback
   ```

2. **Restart server**

3. **Test lại thanh toán VNPay**

4. **Xem log backend:**
   - Khi tạo payment URL: Xem signature data và hash
   - Khi VNPay callback: Xem hash match

## ⚠️ Lưu ý

- **Ngrok URL thay đổi**: Mỗi lần restart ngrok, URL sẽ thay đổi. Cần cập nhật `VNPAY_RETURN_URL` và restart server.
- **Hash Secret**: Phải chính xác 100%, không có spaces, không có quotes.
- **Return URL**: Phải khớp chính xác trong signature calculation và URL thực tế.

## 🐛 Nếu vẫn lỗi code 70

1. Gửi log chi tiết:
   - `VNPay: CREATE PAYMENT URL - SUMMARY`
   - `VNPay: VERIFY RETURN - RESULT`
   - `Hash comparison details` (nếu hash không khớp)

2. Kiểm tra Hash Secret:
   - So sánh với VNPay merchant portal
   - Đảm bảo không có spaces/quotes

3. Kiểm tra Return URL:
   - Đảm bảo khớp với ngrok URL
   - Đảm bảo accessible từ internet

