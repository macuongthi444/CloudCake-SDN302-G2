import ApiService from './ApiService';

class PaymentService {
  // Get all payment methods (requires auth)
  async getPaymentMethods() {
    try {
      const data = await ApiService.get('/payment/list', true);
      return data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Get payment method by ID (requires auth)
  async getPaymentMethodById(id) {
    try {
      const data = await ApiService.get(`/payment/find/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error fetching payment method:', error);
      throw error;
    }
  }

  // Create payment method (requires admin)
  async createPaymentMethod(paymentData) {
    try {
      const data = await ApiService.post('/payment/create', paymentData, true);
      return data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  // Update payment method (requires admin)
  async updatePaymentMethod(id, paymentData) {
    try {
      const data = await ApiService.put(`/payment/edit/${id}`, paymentData, true);
      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Delete payment method (requires admin)
  async deletePaymentMethod(id) {
    try {
      const data = await ApiService.delete(`/payment/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Toggle payment method status (requires admin)
  async togglePaymentMethodStatus(id) {
    try {
      const data = await ApiService.put(`/payment/toggle-status/${id}`, {}, true);
      return data;
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      throw error;
    }
  }
}

export default new PaymentService();












