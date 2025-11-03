import ApiService from './ApiService';

class ProductVariantService {
  // Get variants by product ID (public)
  async getVariantsByProductId(productId, isActive = true) {
    try {
      const endpoint = `/product-variant/product/${productId}${isActive ? '?isActive=true' : ''}`;
      const data = await ApiService.get(endpoint, false);
      return data;
    } catch (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }
  }

  // Get variant by ID (public)
  async getVariantById(id) {
    try {
      const data = await ApiService.get(`/product-variant/find/${id}`, false);
      return data;
    } catch (error) {
      console.error('Error fetching variant:', error);
      throw error;
    }
  }

  // Create variant (Seller/Admin only)
  async createVariant(variantData) {
    try {
      const data = await ApiService.post('/product-variant/create', variantData, true);
      return data;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  }

  // Update variant (Seller/Admin only)
  async updateVariant(id, variantData) {
    try {
      const data = await ApiService.put(`/product-variant/edit/${id}`, variantData, true);
      return data;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  }

  // Delete variant (Seller/Admin only)
  async deleteVariant(id) {
    try {
      const data = await ApiService.delete(`/product-variant/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  }
}

export default new ProductVariantService();




