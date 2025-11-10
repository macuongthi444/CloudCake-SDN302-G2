import ApiService from "./ApiService";

class OrderService {
  async createFromCart(payload) {
    return await ApiService.post("/order/create-from-cart", payload, true);
  }

  async getById(id) {
    return await ApiService.get(`/order/find/${id}`, true);
  }

  async getByUserId(userId) {
    return await ApiService.get(`/order/user/${userId}`, true);
  }

  async cancelOrder(orderId, reason) {
    return await ApiService.post(`/order/${orderId}/cancel`, { reason, cancelledBy: 'USER' }, true);
  }
}
const OrderServices = new OrderService();

export default OrderServices;
