// src/services/ShopService.js
import ApiService from '../../../services/ApiService';

class ShopService {
  // Get all shops (admin only)
  getAllShops() {
    return ApiService.get('/shop/list');
  }

  // Get shop by ID (admin only)
  getShopById(id) {
    return ApiService.get(`/shop/find/${id}`);
  }

  // Update shop status (approve shop)
  updateShopStatus(id, status) {
    return ApiService.put(`/shop/edit/${id}`, { status });
  }

  // Toggle shop account active status (lock/unlock)
  toggleShopActiveStatus(id, isActive) {
    // If we're unlocking a shop (changing is_active from 0 to 1)
    // Use the special unlock endpoint instead of the standard edit
    if (isActive === 1) {
      return ApiService.put(`/shop/unlock/${id}`, { is_active: isActive });
    } else {
      // For locking a shop, use the regular edit endpoint
      return ApiService.put(`/shop/edit/${id}`, { is_active: isActive });
    }
  }

  // Delete shop (admin only)
  deleteShop(id) {
    return ApiService.delete(`/shop/delete/${id}`);
  }

  // Get shop statistics (admin or seller)

  // Get province information
  

  // Get user information
  getUserById(userId) {
    return ApiService.get(`/user/${userId}`);
  }
}

export default new ShopService();