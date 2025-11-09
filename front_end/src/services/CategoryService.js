import ApiService from './ApiService';

class CategoryService {
  // Get all categories (public)
  async getCategories(isActive = true) {
    try {
      const endpoint = `/category/list${isActive ? '?isActive=true' : ''}`;
      const data = await ApiService.get(endpoint, false);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID (public)
  async getCategoryById(id) {
    try {
      const data = await ApiService.get(`/category/find/${id}`, false);
      return data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Create category (Admin only)
  async createCategory(categoryData) {
    try {
      const data = await ApiService.post('/category/create', categoryData, true);
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category (Admin only)
  async updateCategory(id, categoryData) {
    try {
      const data = await ApiService.put(`/category/edit/${id}`, categoryData, true);
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category (Admin only)
  async deleteCategory(id) {
    try {
      const data = await ApiService.delete(`/category/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

export default new CategoryService();







