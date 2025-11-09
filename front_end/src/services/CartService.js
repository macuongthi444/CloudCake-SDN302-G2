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
  // Add timestamp query param to bypass browser cache if needed
  async getCartByUserId(userId, bypassCache = false) {
    try {
      const url = bypassCache 
        ? `/cart/user/${userId}?_t=${Date.now()}`
        : `/cart/user/${userId}`;
      const data = await ApiService.get(url, false);
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
  async removeItemFromCart(variantId, userId) {
    try {
      // DELETE with query params for userId
      const data = await ApiService.delete(`/cart/remove-items/${variantId}?userId=${userId}`, false);
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

const cartService = new CartService();
export default cartService;
