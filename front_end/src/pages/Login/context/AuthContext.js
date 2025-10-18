// src/pages/Login/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../../../services/AuthService';
import ShopService from '../../../services/ShopService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shopStatus, setShopStatus] = useState(null);

    // Helper to check if user has a specific role (handles both formats)
    const hasRoleHelper = (roles = [], roleName) => {
        if (!Array.isArray(roles)) return false;
        
        const normalizedRoleName = roleName.toUpperCase();
        const prefixedRoleName = normalizedRoleName.startsWith('ROLE_') 
            ? normalizedRoleName 
            : `ROLE_${normalizedRoleName}`;
        
        return roles.some(role => {
            if (typeof role !== 'string') return false;
            const upperRole = role.toUpperCase();
            return upperRole === prefixedRoleName || upperRole === normalizedRoleName;
        });
    };
    
    // Khởi tạo thông tin người dùng từ localStorage
    useEffect(() => {
        const initializeUser = async () => {
            try {
                setLoading(true);
                
                // Kiểm tra xem người dùng đã đăng nhập chưa
                const isAuthenticated = AuthService.isLoggedIn();
                setIsLoggedIn(isAuthenticated);
                
                if (isAuthenticated) {
                    const user = AuthService.getCurrentUser();
                    console.log("Current user from localStorage:", user); // Debug log
                    
                    if (user) {
                        setCurrentUser(user);
                        
                        // Log roles for debugging
                        console.log("User roles from localStorage:", user.roles);
                        setUserRoles(user.roles || []);
                        
                        // Kiểm tra trạng thái cửa hàng nếu là người bán - sử dụng hàm trợ giúp
                        if (hasRoleHelper(user.roles, 'SELLER')) {
                            console.log("User has SELLER role, checking shop status");
                            const shopStatusData = await ShopService.canAccessSellerDashboard();
                            setShopStatus(shopStatusData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error initializing auth context:", error);
            } finally {
                setLoading(false);
            }
        };
        
        initializeUser();
        
        // Lắng nghe sự kiện storage để cập nhật khi có thay đổi đăng nhập
        const handleStorageChange = () => {
            initializeUser();
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    // Đăng nhập - enhanced with better logging and role handling
    const login = async (email, password) => {
        try {
            const data = await AuthService.login(email, password);
            console.log("Login data received in context:", data); // Debug log
            
            if (data.accessToken) {
                // Enhanced logging of roles
                console.log("Roles from login:", data.roles);
                
                setIsLoggedIn(true);
                setCurrentUser(data);
                setUserRoles(data.roles || []);
                
                // Nếu là người bán, kiểm tra trạng thái cửa hàng - sử dụng hàm trợ giúp mới
                if (hasRoleHelper(data.roles, 'SELLER')) {
                    console.log("User has SELLER role, checking shop status");
                    const shopStatusData = await ShopService.canAccessSellerDashboard();
                    setShopStatus(shopStatusData);
                }
            }
            
            return data;
        } catch (error) {
            console.error("Login error in context:", error);
            throw error;
        }
    };
    
    // Đăng nhập với Google - enhanced with better logging and role handling
    const handleGoogleAuthLogin = (userData) => {
        try {
            console.log("Google auth login data:", userData); // Debug log
            
            if (userData && userData.accessToken) {
                // Set user through AuthService to ensure consistent role formatting
                AuthService.setUser(userData);
                
                setIsLoggedIn(true);
                setCurrentUser(userData);
                
                console.log("Setting user roles from Google auth:", userData.roles);
                setUserRoles(userData.roles || []);
                
                // Kiểm tra trạng thái cửa hàng nếu là người bán - sử dụng hàm trợ giúp
                if (hasRoleHelper(userData.roles, 'SELLER')) {
                    console.log("Google user has SELLER role, checking shop status");
                    ShopService.canAccessSellerDashboard()
                        .then(shopStatusData => setShopStatus(shopStatusData));
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("Google auth login error:", error);
            return false;
        }
    };
    
    // Đăng xuất
    const logout = () => {
        AuthService.logout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserRoles([]);
        setShopStatus(null);
    };
    
    // Làm mới thông tin người dùng từ API
    const refreshUserData = async () => {
        try {
            const updatedUser = await AuthService.refreshUserInfo();
            
            if (updatedUser) {
                setCurrentUser(updatedUser);
                setUserRoles(updatedUser.roles || []);
                
                // Kiểm tra lại trạng thái cửa hàng nếu là người bán - sử dụng hàm trợ giúp
                if (hasRoleHelper(updatedUser.roles, 'SELLER')) {
                    const shopStatusData = await ShopService.canAccessSellerDashboard();
                    setShopStatus(shopStatusData);
                }
            }
            
            return updatedUser;
        } catch (error) {
            console.error("Error refreshing user data:", error);
            return null;
        }
    };
    
    // Kiểm tra xem người dùng có quyền seller và cửa hàng có hoạt động không - sử dụng hàm trợ giúp
    const canAccessSellerDashboard = () => {
        if (!isLoggedIn || !shopStatus) return false;
        
        const isSeller = hasRoleHelper(userRoles, 'SELLER');
        return isSeller && shopStatus.canAccess === true;
    };
    
    // Lấy lý do không thể truy cập seller dashboard
    const getSellerDashboardAccessReason = () => {
        if (!shopStatus) return "unknown";
        return shopStatus.reason || "unknown";
    };
    
    // Giá trị context
    const value = {
        currentUser,
        userRoles,
        isLoggedIn,
        loading,
        login,
        logout,
        handleGoogleAuthLogin,
        refreshUserData,
        canAccessSellerDashboard,
        getSellerDashboardAccessReason,
        shopStatus,
        hasRole: hasRoleHelper // Export the helper function for components to use
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthContext;