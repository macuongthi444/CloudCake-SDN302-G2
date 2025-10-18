// src/services/ShopService.js

import ApiService from './ApiService';
import AuthService from './AuthService';

class ShopService {
    // Kiểm tra trạng thái hoạt động của cửa hàng người bán
    async checkShopStatus() {
        try {
            const currentUser = AuthService.getCurrentUser();
            
            // Nếu không có user hoặc không có user ID, trả về null
            if (!currentUser || !currentUser.id) {
                return null;
            }
            
            // Gọi API để lấy thông tin cửa hàng của người dùng hiện tại
            const shop = await ApiService.get(`/shops/my-shop`);
            
            // Kiểm tra nếu cửa hàng tồn tại
            if (shop) {
                return {
                    isActive: shop.is_active === 1,
                    status: shop.status, // "active", "pending", "rejected"
                    shopData: shop
                };
            }
            
            return null;
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
            
            // Kiểm tra is_active và status
            if (!shopStatus.isActive) {
                return { 
                    canAccess: false, 
                    reason: "inactive" 
                };
            }
            
            if (shopStatus.status !== "active") {
                return { 
                    canAccess: false, 
                    reason: shopStatus.status // "pending" hoặc "rejected"
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