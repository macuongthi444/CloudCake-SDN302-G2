const crypto = require("crypto");
const qs = require("qs");
const axios = require("axios");
const Order = require("../models/order.model");

function formatDateYYYYMMDDHHmmss(date = new Date()) {
  return date
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
}

// Convert Vietnamese to no-accent for VNPay OrderInfo
function removeVietnameseAccents(str) {
  if (!str) return "";
  const accents =
    "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
  const noAccents =
    "aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiioooooooooooooooouuuuuuuuuuuyyyyyyd";
  return str
    .split("")
    .map((char) => {
      const index = accents.indexOf(char.toLowerCase());
      return index !== -1 ? noAccents[index] : char;
    })
    .join("")
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim()
    .substring(0, 255); // VNPay max length
}

// Sort object by keys (VNPay requirement)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function buildSignedParams(params, secret) {
  if (!secret || secret.length === 0) {
    throw new Error("VNPay hash secret is required");
  }

  // VNPay signature calculation steps (from official docs):
  // 1. Remove vnp_SecureHash and vnp_SecureHashType from params
  // 2. Sort object by keys
  // 3. Use qs.stringify with encode: false
  // 4. HMAC SHA512 with secret using Buffer

  // Remove signature fields
  const cleanParams = { ...params };
  delete cleanParams["vnp_SecureHash"];
  delete cleanParams["vnp_SecureHashType"];

  // Remove empty/null/undefined values
  Object.keys(cleanParams).forEach((key) => {
    if (
      cleanParams[key] === null ||
      cleanParams[key] === undefined ||
      cleanParams[key] === ""
    ) {
      delete cleanParams[key];
    }
  });

  // Sort object by keys (VNPay requirement)
  const sortedParams = sortObject(cleanParams);

  // Use qs.stringify with encode: false (as per VNPay official docs)
  const signData = qs.stringify(sortedParams, { encode: false });

  console.log("VNPay signature data:", signData);
  console.log(
    "VNPay hash secret (first 10 chars):",
    secret.substring(0, 10) + "..."
  );

  // Create HMAC SHA512 hash using Buffer
  const hmac = crypto.createHmac("sha512", secret);
  const vnp_SecureHash = hmac
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  console.log("VNPay calculated hash:", vnp_SecureHash);

  return { sorted: sortedParams, vnp_SecureHash };
}

class VNPayService {
  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE || "XCAD2ZXD";
    this.hashSecret =
      process.env.VNPAY_HASH_SECRET || "94NABVIQUDO0EQZYLSFIJJPPYWU26CSA";
    this.payUrl =
      process.env.VNPAY_PAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    // VNPay return URL requirements:
    // - Sandbox: HTTP for localhost is OK (http://localhost:9999)
    // - Production: MUST be HTTPS and accessible from internet
    // For localhost development, HTTP is sufficient
    this.returnUrl =
      process.env.VNPAY_RETURN_URL ||
      "http://localhost:9999/api/order/vnpay-callback";
    this.apiUrl =
      process.env.VNPAY_API_URL ||
      "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    console.log("VNPay Service initialized:", {
      tmnCode: this.tmnCode,
      returnUrl: this.returnUrl,
      hashSecretLength: this.hashSecret.length,
      hashSecretFirst10: this.hashSecret.substring(0, 10),
      hashSecretLast10: this.hashSecret.substring(this.hashSecret.length - 10),
      protocol: this.returnUrl.startsWith("https") ? "HTTPS" : "HTTP",
      isLocalhost:
        this.returnUrl.includes("localhost") ||
        this.returnUrl.includes("127.0.0.1"),
      warning: this.returnUrl.includes("localhost")
        ? "⚠️ WARNING: localhost may not work with VNPay sandbox. Consider using ngrok or 127.0.0.1"
        : "OK",
    });
  }

  async createPaymentUrl(order, clientIp = "127.0.0.1") {
    console.log("\n========== VNPay: CREATE PAYMENT URL - START ==========");
    console.log("Step 1: Input validation");
    console.log("- Order ID:", order?._id);
    console.log("- Order object keys:", Object.keys(order || {}));

    if (!order || !order._id) throw new Error("Invalid order");

    // Ensure order is a plain object with totalAmount
    const orderTotal = order.totalAmount || order.subtotal || 0;
    const amount = Math.round(Number(orderTotal));

    console.log("Step 2: Amount calculation");
    console.log("- Order totalAmount:", order.totalAmount);
    console.log("- Order subtotal:", order.subtotal);
    console.log("- Calculated amount:", amount);
    console.log("- Amount in VND (x100):", amount * 100);

    if (amount <= 0) {
      console.error("VNPay Error: Invalid order amount", {
        orderId: order._id,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        calculatedAmount: amount,
      });
      throw new Error(
        `Invalid order amount: ${amount}. Order totalAmount must be greater than 0.`
      );
    }

    // Format IP address (remove IPv6 prefix if present)
    console.log("Step 3: IP address formatting");
    console.log("- Original IP:", clientIp);
    let formattedIp = clientIp || "127.0.0.1";
    if (formattedIp.startsWith("::ffff:")) {
      formattedIp = formattedIp.replace("::ffff:", "");
      console.log("- After removing ::ffff: prefix:", formattedIp);
    }
    if (formattedIp === "::1") {
      formattedIp = "127.0.0.1";
      console.log("- Converted ::1 to:", formattedIp);
    }
    console.log("- Final IP:", formattedIp);

    // Format TxnRef: Use order number if available (shorter, cleaner), otherwise use order ID
    // VNPay max 100 chars, but shorter is better (recommended: order number or timestamp-based)
    // IMPORTANT: TxnRef must be unique and should not contain special characters (including dashes)
    let txnRef = String(order.orderNumber || order._id).trim();
    // Remove any special characters that might cause issues (including dashes and underscores)
    // VNPay may not accept dashes in TxnRef, so remove them
    txnRef = txnRef.replace(/[^a-zA-Z0-9]/g, "");
    // Ensure max length
    txnRef = txnRef.substring(0, 100);
    console.log("Step 4: Transaction reference");
    console.log("- Order ID:", order._id);
    console.log("- Order number:", order.orderNumber);
    console.log("- TxnRef (final):", txnRef);

    // Format OrderInfo: Vietnamese no-accent, no special chars, max 255 chars
    // Use cleaned txnRef (without dashes) for consistency
    // VNPay recommends: no spaces, use underscores or remove spaces
    const orderInfoRaw = `Thanh toan don hang ${txnRef}`;
    const orderInfoNoAccent = removeVietnameseAccents(orderInfoRaw);
    const orderInfo = orderInfoNoAccent.replace(/\s+/g, ""); // Remove all spaces for VNPay compatibility

    console.log("Step 5: Order info formatting");
    console.log("- Raw order info:", orderInfoRaw);
    console.log("- After remove accents:", orderInfoNoAccent);
    console.log("- Final order info (no spaces):", orderInfo);

    // Base params for signature calculation
    // VNPay requires: all params must be strings, no encoding in signature
    const vnpAmount = Math.floor(amount * 100); // Ensure integer, multiplied by 100

    console.log("Step 6: Building base params");
    console.log("- vnp_Amount (number):", vnpAmount);
    console.log("- vnp_Amount (string):", String(vnpAmount));

    // Build params exactly as VNPay expects (all strings, trimmed)
    const baseParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: String(this.tmnCode).trim(),
      vnp_Amount: String(vnpAmount), // Must be string for signature
      vnp_CurrCode: "VND",
      vnp_TxnRef: String(txnRef).trim(),
      vnp_OrderInfo: String(orderInfo).trim(),
      vnp_OrderType: "billpayment",
      vnp_Locale: "vn",
      vnp_IpAddr: String(formattedIp).trim(),
      vnp_ReturnUrl: encodeURIComponent(String(this.returnUrl).trim()), // ← FIX DUY NHẤT
      vnp_CreateDate: formatDateYYYYMMDDHHmmss(),
    };

    console.log("Step 7: Base params (before sorting)");
    console.log(JSON.stringify(baseParams, null, 2));

    // Calculate signature WITHOUT vnp_SecureHashType
    // Sort params first (as per VNPay official code)
    console.log("Step 8: Sorting params");
    const sortedParams = sortObject(baseParams);
    console.log("Sorted params keys:", Object.keys(sortedParams));
    console.log("Sorted params:", JSON.stringify(sortedParams, null, 2));

    console.log("Step 9: Creating signature string");
    const signData = qs.stringify(sortedParams, { encode: false });
    console.log("- Signature data length:", signData.length);
    console.log("- Signature data:", signData);
    console.log("- Hash secret length:", this.hashSecret.length);
    console.log(
      "- Hash secret (first 10 chars):",
      this.hashSecret.substring(0, 10) + "..."
    );
    console.log(
      "- Hash secret (last 10 chars):",
      "..." + this.hashSecret.substring(this.hashSecret.length - 10)
    );

    // Create HMAC SHA512 hash using Buffer
    console.log("Step 10: Calculating HMAC SHA512 hash");
    const hmac = crypto.createHmac("sha512", this.hashSecret);
    const signDataBuffer = Buffer.from(signData, "utf-8");
    console.log("- Sign data buffer length:", signDataBuffer.length);
    console.log(
      "- Sign data buffer (first 50 bytes):",
      signDataBuffer.toString("utf-8").substring(0, 50)
    );
    const vnp_SecureHash = hmac.update(signDataBuffer).digest("hex");

    console.log("Step 11: Hash result");
    console.log("- Calculated hash length:", vnp_SecureHash.length);
    console.log(
      "- Calculated hash (first 40 chars):",
      vnp_SecureHash.substring(0, 40) + "..."
    );
    console.log(
      "- Calculated hash (last 40 chars):",
      "..." + vnp_SecureHash.substring(vnp_SecureHash.length - 40)
    );
    console.log("- Full hash:", vnp_SecureHash);

    // Add vnp_SecureHash to params (as per VNPay official code)
    console.log("Step 12: Adding hash to params");
    sortedParams["vnp_SecureHash"] = vnp_SecureHash;
    console.log("- Params with hash keys:", Object.keys(sortedParams));

    // Build URL using qs.stringify with encode: false (as per VNPay official code)
    // CRITICAL: Both signature and URL must use the SAME encoding (encode: false)
    // VNPay official code: vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    console.log("Step 13: Building final URL");
    const queryString = qs.stringify(sortedParams, { encode: false });
    console.log("- Query string length:", queryString.length);
    console.log(
      "- Query string (first 200 chars):",
      queryString.substring(0, 200)
    );
    console.log(
      "- Query string contains return URL:",
      queryString.includes("vnp_ReturnUrl")
    );
    const url = `${this.payUrl}?${queryString}`;

    console.log("Step 14: Final URL");
    console.log("- Base URL:", this.payUrl);
    console.log("- Full URL length:", url.length);
    console.log("- Full URL (first 400 chars):", url.substring(0, 400));
    console.log(
      "- Full URL (last 200 chars):",
      "..." + url.substring(url.length - 200)
    );

    console.log("\n========== VNPay: CREATE PAYMENT URL - SUMMARY ==========");
    console.log("TMN Code:", this.tmnCode);
    console.log("Return URL:", this.returnUrl);
    console.log("Amount:", amount, "VND");
    console.log("Amount (x100):", vnpAmount);
    console.log("TxnRef:", txnRef);
    console.log("OrderInfo:", orderInfo);
    console.log("Hash:", vnp_SecureHash);
    console.log("URL created successfully!");
    console.log("========================================================\n");

    return { paymentUrl: url, params: sortedParams };
  }

  verifyReturn(query) {
    console.log("\n========== VNPay: VERIFY RETURN - START ==========");
    console.log("Step 1: Received query from VNPay");
    console.log("- Raw query keys:", Object.keys(query));
    console.log("- Raw query:", JSON.stringify(query, null, 2));

    // VNPay official verification method (from docs)
    const vnp_Params = { ...query };
    const secureHash = vnp_Params["vnp_SecureHash"];

    console.log("Step 2: Extract hash");
    console.log("- Received hash:", secureHash);
    console.log("- Received hash length:", secureHash?.length);
    if (secureHash) {
      console.log(
        "- Received hash (first 40 chars):",
        secureHash.substring(0, 40) + "..."
      );
      console.log(
        "- Received hash (last 40 chars):",
        "..." + secureHash.substring(secureHash.length - 40)
      );
    }

    // Remove signature fields
    console.log("Step 3: Remove signature fields");
    console.log("- Before delete - keys:", Object.keys(vnp_Params));
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];
    console.log("- After delete - keys:", Object.keys(vnp_Params));

    // Remove empty/null/undefined values (same as buildSignedParams)
    // IMPORTANT: VNPay may send additional params in callback (vnp_ResponseCode, vnp_TransactionNo, etc.)
    // These MUST be included in signature verification
    console.log("Step 4: Remove empty values");
    const beforeClean = Object.keys(vnp_Params).length;
    Object.keys(vnp_Params).forEach((key) => {
      // Only remove if value is null, undefined, or empty string
      // Do NOT remove params with value '0' or other falsy but valid values
      if (
        vnp_Params[key] === null ||
        vnp_Params[key] === undefined ||
        vnp_Params[key] === ""
      ) {
        delete vnp_Params[key];
      }
      // Ensure all values are strings (VNPay requirement)
      if (vnp_Params[key] !== null && vnp_Params[key] !== undefined) {
        vnp_Params[key] = String(vnp_Params[key]).trim();
      }
    });
    const afterClean = Object.keys(vnp_Params).length;
    console.log("- Before clean:", beforeClean, "params");
    console.log("- After clean:", afterClean, "params");
    console.log("- Cleaned params keys:", Object.keys(vnp_Params));
    console.log("- Cleaned params:", JSON.stringify(vnp_Params, null, 2));

    // Log all VNPay callback-specific params
    const callbackParams = [
      "vnp_ResponseCode",
      "vnp_TransactionNo",
      "vnp_BankTranNo",
      "vnp_PayDate",
      "vnp_TransactionStatus",
    ];
    const foundCallbackParams = callbackParams.filter((key) =>
      vnp_Params.hasOwnProperty(key)
    );
    if (foundCallbackParams.length > 0) {
      console.log(
        "- VNPay callback-specific params found:",
        foundCallbackParams
      );
      foundCallbackParams.forEach((key) => {
        console.log(`  - ${key}:`, vnp_Params[key]);
      });
    }

    // Sort and stringify (same as buildSignedParams)
    console.log("Step 5: Sort params");
    const sortedParams = sortObject(vnp_Params);
    console.log("- Sorted keys:", Object.keys(sortedParams));
    console.log("- Sorted params:", JSON.stringify(sortedParams, null, 2));

    console.log("Step 6: Create signature string");
    const signData = qs.stringify(sortedParams, { encode: false });
    console.log("- Signature data length:", signData.length);
    console.log("- Signature data:", signData);
    console.log("- Hash secret length:", this.hashSecret.length);
    console.log(
      "- Hash secret (first 10 chars):",
      this.hashSecret.substring(0, 10) + "..."
    );
    // Trong verifyReturn(), sau khi clean params:
    if (vnp_Params.vnp_ReturnUrl) {
      vnp_Params.vnp_ReturnUrl = decodeURIComponent(vnp_Params.vnp_ReturnUrl);
    }
    // Create HMAC SHA512 hash using Buffer
    console.log("Step 7: Calculate hash");
    const hmac = crypto.createHmac("sha512", this.hashSecret);
    const signDataBuffer = Buffer.from(signData, "utf-8");
    console.log("- Sign data buffer length:", signDataBuffer.length);
    const signed = hmac.update(signDataBuffer).digest("hex");

    console.log("Step 8: Compare hashes");
    console.log("- Calculated hash length:", signed.length);
    console.log(
      "- Calculated hash (first 40 chars):",
      signed.substring(0, 40) + "..."
    );
    console.log(
      "- Calculated hash (last 40 chars):",
      "..." + signed.substring(signed.length - 40)
    );
    console.log("- Full calculated hash:", signed);
    console.log("- Received hash:", secureHash);
    console.log("- Hash match:", secureHash === signed);
    console.log("- Hash comparison (case sensitive):", secureHash === signed);
    console.log(
      "- Hash comparison (case insensitive):",
      secureHash?.toLowerCase() === signed?.toLowerCase()
    );

    const ok = secureHash === signed;

    if (!ok) {
      console.error("\n❌ VNPay signature verification FAILED!");
      console.error("Received hash:", secureHash);
      console.error("Calculated hash:", signed);
      console.error("Signature data:", signData);
      console.error("Hash secret length:", this.hashSecret.length);
      console.error(
        "Hash secret preview:",
        this.hashSecret.substring(0, 8) +
          "..." +
          this.hashSecret.substring(this.hashSecret.length - 4)
      );

      // Compare character by character
      if (secureHash && signed) {
        console.error("\nHash comparison details:");
        for (let i = 0; i < Math.min(secureHash.length, signed.length); i++) {
          if (secureHash[i] !== signed[i]) {
            console.error(
              `- First difference at position ${i}: received="${secureHash[i]}", calculated="${signed[i]}"`
            );
            console.error(
              `- Context: ...${secureHash.substring(
                Math.max(0, i - 10),
                i + 10
              )}...`
            );
            console.error(
              `- Context: ...${signed.substring(
                Math.max(0, i - 10),
                i + 10
              )}...`
            );
            break;
          }
        }
      }
    } else {
      console.log("\n✅ VNPay signature verification SUCCESS!");
    }

    console.log("\n========== VNPay: VERIFY RETURN - RESULT ==========");
    console.log("Is valid:", ok);
    console.log("Response code:", vnp_Params.vnp_ResponseCode);
    console.log("Is success:", ok && vnp_Params.vnp_ResponseCode === "00");
    console.log("Order ID:", vnp_Params.vnp_TxnRef);
    console.log(
      "Amount:",
      vnp_Params.vnp_Amount ? Number(vnp_Params.vnp_Amount) / 100 : undefined
    );
    console.log("==================================================\n");

    return {
      isValid: ok,
      isSuccess: ok && vnp_Params.vnp_ResponseCode === "00",
      orderId: vnp_Params.vnp_TxnRef,
      amount: vnp_Params.vnp_Amount
        ? Number(vnp_Params.vnp_Amount) / 100
        : undefined,
      bankTranNo: vnp_Params.vnp_BankTranNo,
      responseCode: vnp_Params.vnp_ResponseCode,
      raw: sortedParams,
    };
  }

  async handleIpn(query) {
    const result = this.verifyReturn(query);
    const orderId = result.orderId;
    if (!orderId) return { updated: false, reason: "missing orderId" };

    const order = await Order.findById(orderId);
    if (!order) return { updated: false, reason: "order not found" };

    const amountOk =
      Math.round(order.totalAmount) === Math.round(result.amount || 0);
    if (!amountOk) return { updated: false, reason: "amount mismatch" };

    order.paymentMeta = { ...(order.paymentMeta || {}), vnpay: query };

    if (result.isValid && result.isSuccess) {
      order.paymentStatus = "PAID";
      order.transactionId = query.vnp_TransactionNo || query.vnp_TransactionNo;
      await order.save();
      return { updated: true, status: "PAID" };
    }
    order.paymentStatus = "FAILED";
    await order.save();
    return { updated: true, status: "FAILED" };
  }

  async refund({ vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_OrderInfo }) {
    const payload = {
      vnp_Version: "2.1.0",
      vnp_Command: "refund",
      vnp_TmnCode: this.tmnCode,
      vnp_TransactionType: "02",
      vnp_TxnRef,
      vnp_Amount: Math.round(vnp_Amount) * 100,
      vnp_OrderInfo,
      vnp_TransactionNo,
      vnp_CreateBy: "admin",
      vnp_CreateDate: formatDateYYYYMMDDHHmmss(),
    };
    const { sorted, vnp_SecureHash } = buildSignedParams(
      payload,
      this.hashSecret
    );
    const url = `${this.apiUrl}?${qs.stringify(
      { ...sorted, vnp_SecureHash },
      { encode: false }
    )}`;
    const response = await axios.get(url);
    return response.data;
  }
}

module.exports = new VNPayService();
