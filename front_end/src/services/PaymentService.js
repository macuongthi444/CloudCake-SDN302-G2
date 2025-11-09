import ApiService from "./ApiService";

class PaymentService {
  // Get all payment methods (requires auth)
  async getPaymentMethods() {
    try {
      const data = await ApiService.get("/payment/list", true);
      return data;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  }

  // Get payment method by ID (requires auth)
  async getPaymentMethodById(id) {
    try {
      const data = await ApiService.get(`/payment/find/${id}`, true);
      return data;
    } catch (error) {
      console.error("Error fetching payment method:", error);
      throw error;
    }
  }

  // Create payment method (requires admin)
  async createPaymentMethod(paymentData) {
    try {
      const data = await ApiService.post("/payment/create", paymentData, true);
      return data;
    } catch (error) {
      console.error("Error creating payment method:", error);
      throw error;
    }
  }

  // Update payment method (requires admin)
  async updatePaymentMethod(id, paymentData) {
    try {
      const data = await ApiService.put(
        `/payment/edit/${id}`,
        paymentData,
        true
      );
      return data;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  }

  // Delete payment method (requires admin)
  async deletePaymentMethod(id) {
    try {
      const data = await ApiService.delete(`/payment/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }

  // Toggle payment method status (requires admin)
  async togglePaymentMethodStatus(id) {
    try {
      const data = await ApiService.put(
        `/payment/toggle-status/${id}`,
        {},
        true
      );
      return data;
    } catch (error) {
      console.error("Error toggling payment method status:", error);
      throw error;
    }
  }

  // VNPay: create payment URL
  async createVNPayPayment(orderId) {
    try {
      console.log(
        "📞 PaymentService: Creating VNPay payment for order:",
        orderId
      );
      const data = await ApiService.post(
        "/payment/vnpay/create",
        { orderId },
        true
      );
      console.log("✅ PaymentService: VNPay payment URL created:", data);
      return data;
    } catch (error) {
      console.error("❌ PaymentService: Error creating VNPay payment:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  // COD: confirm (no redirect)
  async confirmCOD(orderId) {
    try {
      // reuse order endpoint or a dedicated one later; for now no-op
      console.log("📞 PaymentService: Confirming COD for order:", orderId);
      return { ok: true };
    } catch (error) {
      console.error("❌ PaymentService: Error confirming COD:", error);
      throw error;
    }
  }
}


const paymentService = new PaymentService();
export default paymentService;
