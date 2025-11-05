// src/services/ShopService.js

import ApiService from './ApiService';
import AuthService from './AuthService';

class ShopService {
    // Get all shops (public)
    async getShops(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive);

            const queryString = queryParams.toString();
            const endpoint = `/shop/list${queryString ? `?${queryString}` : ''}`;
            const data = await ApiService.get(endpoint, false);
            return data;
        } catch (error) {
            console.error('Error fetching shops:', error);
            throw error;
        }
    }

    // Get shop by ID (public)
    async getShopById(id) {
        try {
            const data = await ApiService.get(`/shop/find/${id}`, false);
            return data;
        } catch (error) {
            console.error('Error fetching shop:', error);
            throw error;
        }
    }

    // Get my shop (Seller only)
    async getMyShop() {
        try {
            const data = await ApiService.get('/shop/my-shop', true);
            return data;
        } catch (error) {
            console.error('Error fetching my shop:', error);
            throw error;
        }
    }

    // Create shop (Seller only)
    async createShop(shopData) {
        try {
            const data = await ApiService.post('/shop/create', shopData, true);
            return data;
        } catch (error) {
            console.error('Error creating shop:', error);
            throw error;
        }
    }

    // Update shop (Owner or Admin)
    async updateShop(id, shopData) {
        try {
            const data = await ApiService.put(`/shop/edit/${id}`, shopData, true);
            return data;
        } catch (error) {
            console.error('Error updating shop:', error);
            throw error;
        }
    }

    // Update shop status (Admin only)
    async updateShopStatus(id, status) {
        try {
            const data = await ApiService.put(`/shop/status/${id}`, { status }, true);
            return data;
        } catch (error) {
            console.error('Error updating shop status:', error);
            throw error;
        }
    }

    // Kiểm tra trạng thái hoạt động của cửa hàng người bán
    async checkShopStatus() {
        try {
            const currentUser = AuthService.getCurrentUser();
            
            // Nếu không có user hoặc không có user ID, trả về null
            if (!currentUser || !currentUser.id) {
                return null;
            }
            
            // Gọi API để lấy thông tin cửa hàng của người dùng hiện tại
            const shop = await this.getMyShop();
            
            // Kiểm tra nếu cửa hàng tồn tại
            if (shop) {
                return {
                    isActive: shop.isActive === true,
                    status: shop.status, // "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"
                    shopData: shop
                };
            }
            
            return { notFound: true };
        } catch (error) {
            console.error("Không thể kiểm tra trạng thái cửa hàng:", error);
            // Nếu là lỗi 404, có thể người dùng chưa đăng ký cửa hàng
            if (error && (error.includes("404") || error.includes("Not found") || error.includes("No shop found"))) {
                return { notFound: true };
            }
            return null;
        }
    }
    
    // Kiểm tra xem người dùng có thể truy cập vào seller dashboard không
    async canAccessSellerDashboard() {
        try {
            const shopStatus = await this.checkShopStatus();
            
            // Nếu không tìm thấy cửa hàng
            if (!shopStatus || shopStatus.notFound) {
                return { 
                    canAccess: false, 
                    reason: "not_found" 
                };
            }
            
            // Kiểm tra isActive và status
            if (!shopStatus.isActive) {
                return { 
                    canAccess: false, 
                    reason: "inactive" 
                };
            }
            
            if (shopStatus.status !== "ACTIVE") {
                return { 
                    canAccess: false, 
                    reason: shopStatus.status // "PENDING" hoặc "REJECTED"
                };
            }
            
            // Cửa hàng đang hoạt động bình thường
            return { 
                canAccess: true,
                shopData: shopStatus.shopData
            };
        } catch (error) {
            console.error("Lỗi kiểm tra quyền truy cập cửa hàng:", error);
            return { 
                canAccess: false, 
                reason: "error" 
            };
        }
    }
}

export default new ShopService();