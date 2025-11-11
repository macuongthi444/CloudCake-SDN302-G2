import ApiService from './ApiService';

class ProductService {
  // Get all products (public)
  async getProducts(params = {}) {
  try {
    
    const currentPath = window.location.pathname;
    const isSellerPage = currentPath.includes('/seller');

    if (isSellerPage) {
      return await this.getMyProducts(params);
    }

    // CÒN LẠI: DÙNG API CÔNG KHAI (cho khách, admin)
    const queryParams = new URLSearchParams();
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.shopId) queryParams.append('shopId', params.shopId);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

    const queryString = queryParams.toString();
    const endpoint = `/product/list${queryString ? `?${queryString}` : ''}`;
    
    const data = await ApiService.get(endpoint, false);
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

  // Get product by ID (public)
  async getProductById(id) {
    try {
      const data = await ApiService.get(`/product/find/${id}`, false);
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Get products by shop (public)
  async getProductsByShop(shopId) {
    try {
      const data = await ApiService.get(`/product/shop/${shopId}`, false);
      return data;
    } catch (error) {
      console.error('Error fetching shop products:', error);
      throw error;
    }
  }

  // Create product (Seller/Admin only)
  async createProduct(productData, images = []) {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== undefined && productData[key] !== null) {
          if (typeof productData[key] === 'object') {
            formData.append(key, JSON.stringify(productData[key]));
          } else {
            formData.append(key, productData[key]);
          }
        }
      });

      // Add images
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      const data = await ApiService.uploadFile('/product/create', formData, true);
      return data?.product || data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update product (Seller/Admin only)
  async updateProduct(id, productData, newImages = []) {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== undefined && productData[key] !== null) {
          if (typeof productData[key] === 'object' && key !== 'existingImages') {
            formData.append(key, JSON.stringify(productData[key]));
          } else if (key !== 'existingImages') {
            formData.append(key, productData[key]);
          }
        }
      });

      // Add existing images (remaining ones after user deletions)
      if (productData.existingImages) {
        formData.append('existingImages', JSON.stringify(productData.existingImages));
      }

      // Add new images (files to upload)
      if (newImages && newImages.length > 0) {
        newImages.forEach((image) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      const data = await ApiService.putFormData(`/product/edit/${id}`, formData, true);
      return data?.product || data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product (Seller/Admin only)
  async deleteProduct(id) {
    try {
      const data = await ApiService.delete(`/product/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Search products (public)
  async searchProducts(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      return await this.getProducts(params);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  async getMyProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      queryParams.append('_t', Date.now());
      const queryString = queryParams.toString();
      const endpoint = `/shop/my-products${queryString ? `?${queryString}` : ''}`;

      const data = await ApiService.get(endpoint, true); // true = cần token
      return data;
    } catch (error) {
      console.error('Error fetching my products:', error);
      throw error;
    }
  }
}

export default new ProductService();

