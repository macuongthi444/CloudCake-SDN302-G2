import ApiService from './ApiService';

class CartService {
  // Create a new cart
  async createCart(userId) {
    try {
      const data = await ApiService.post('/cart/create', { userId }, false);
      return data;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  // Get cart by user ID
  async getCartByUserId(userId) {
    try {
      const data = await ApiService.get(`/cart/user/${userId}`, false);
      return data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  // Add item to cart
  async addItemToCart(cartData) {
    try {
      const data = await ApiService.post('/cart/add-item', cartData, false);
      return data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Update item quantity in cart
  async updateItemQuantity(cartData) {
    try {
      const data = await ApiService.put('/cart/update-item', cartData, false);
      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeItemFromCart(productId, userId) {
    try {
      const data = await ApiService.delete(`/cart/remove-items/${productId}`, false);
      return data;
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  }

  // Clear all items from cart
  async clearCart(userId) {
    try {
      const data = await ApiService.delete(`/cart/clear/${userId}`, false);
      return data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}

export default new CartService();


