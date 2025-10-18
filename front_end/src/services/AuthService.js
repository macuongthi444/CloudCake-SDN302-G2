// src/services/AuthService.js
import { BE_API_URL } from '../config/config';

const API_URL = `${BE_API_URL}/api`;

class AuthService {
    // Đăng nhập
    login(email, password) {
        return fetch(`${API_URL}/auth/signin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })
            .then(this.handleResponse)
            .then((data) => {
                console.log("Raw login response data:", data); // Debug log
                
                if (data.accessToken) {
                    // If roles is missing or empty, set a default MEMBER role
                    if (!data.roles || data.roles.length === 0) {
                        data.roles = ["ROLE_MEMBER"];
                    }

                    // Ensure each role is properly formatted with ROLE_ prefix for consistency
                    const formattedRoles = data.roles.map(role => {
                        // If the role is an object with a name property
                        if (typeof role === 'object' && role.name) {
                            return `ROLE_${role.name}`;
                        }
                        // If the role is already a string that starts with ROLE_
                        else if (typeof role === 'string' && role.startsWith('ROLE_')) {
                            return role;
                        }
                        // If the role is just a string (like "MEMBER")
                        else if (typeof role === 'string') {
                            return `ROLE_${role}`; // Make sure to add ROLE_ prefix
                        }
                        // Default
                        return "ROLE_MEMBER";
                    });

                    console.log("Formatted roles:", formattedRoles); // Debug log

                    // Store with timestamp and formatted roles
                    const userData = {
                        ...data,
                        roles: formattedRoles,
                        loginTime: new Date().getTime()
                    };

                    localStorage.setItem("user", JSON.stringify(userData));

                    // Dispatch a storage event to notify other components
                    window.dispatchEvent(new Event('storage'));
                    
                    // Return data with formatted roles
                    return {...data, roles: formattedRoles};
                }
                return data;
            });
    }

    // Đăng xuất
    logout() {
        const user = this.getCurrentUser();
        const userId = user ? (user.id || 'guest') : 'guest';
        
        localStorage.removeItem("user");
        
        // Xóa tin nhắn của người dùng hiện tại
        localStorage.removeItem(`chatMessages_${userId}`);
        localStorage.removeItem("lastChatOpenTime");
        
        // Xóa cả tin nhắn mặc định nếu có
        localStorage.removeItem("chatMessages");
        
        window.dispatchEvent(new Event('storage'));
    }

    // Đăng ký
    register(firstName, lastName, phone, email, password) {
        return fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstName,
                lastName,
                phone,
                email,
                password,
            }),
        }).then(this.handleResponse);
    }

    // Quên mật khẩu - gửi OTP
    forgotPassword(email) {
        return fetch(`${API_URL}/user/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        }).then(this.handleResponse);
    }

    // Đặt lại mật khẩu với OTP
    resetPassword(email, otp, newPassword) {
        return fetch(`${API_URL}/user/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp, newPassword }),
        }).then(this.handleResponse);
    }

    // Lấy thông tin user hiện tại
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                return null;
            }

            const user = JSON.parse(userStr);
            return user;
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            // If there's an error parsing, clear the corrupt data
            localStorage.removeItem("user");
            return null;
        }
    }

    // Kiểm tra người dùng đã đăng nhập chưa và token còn hạn sử dụng
    isLoggedIn() {
        const user = this.getCurrentUser();

        if (!user) {
            return false;
        }

        // Check if token exists - handle both accessToken and token fields
        const token = user.accessToken || user.token;
        if (!token) {
            return false;
        }

        // Schedule a background validation of the account status
        // This doesn't block the initial isLoggedIn check
        this.validateUserStatus(user);

        // Optional: Check for token expiration based on login time
        // Assuming a token lasts for 24 hours (86400000 milliseconds)
        const TOKEN_EXPIRY = 86400000; // 24 hours
        const now = new Date().getTime();
        const loginTime = user.loginTime || 0;

        if (now - loginTime > TOKEN_EXPIRY) {
            this.logout();
            return false;
        }

        return true;
    }
    
    // Helper method to validate user status by making an API call
    async validateUserStatus(user) {
        if (!user || !user.id || !user.accessToken) return;
        
        try {
            const response = await fetch(`${API_URL}/user/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': user.accessToken
                }
            });
            
            if (!response.ok) {
                // Token might be invalid - force logout
                this.logout();
                return;
            }
            
            const userData = await response.json();
            
            // Check if account is deactivated
            if (userData.status === false) {
                console.log("Account has been deactivated, forcing logout");
                this.logout();
                // We don't throw here since this is a background check
            }
        } catch (error) {
            console.error("Error validating user status:", error);
            // Don't logout on network errors to prevent poor user experience
        }
    }

    // Lấy token
    getToken() {
        try {
            const user = this.getCurrentUser();
            if (!user) return null;

            // Ensure token is a string and not undefined/null
            const token = user.accessToken || user.token;
            if (!token) {
                console.error("Token not found in user object:", user);
                return null;
            }

            return token;
        } catch (error) {
            console.error("Error getting token:", error);
            return null;
        }
    }

    // Kiểm tra user có role cụ thể không
    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    }

    // Xử lý response với thông báo lỗi trực tiếp từ API
    handleResponse(response) {
        return response.text().then((text) => {
            let data;
            try {
                data = text && JSON.parse(text);
            } catch (e) {
                console.error("Error parsing response:", e);
                return Promise.reject("Phản hồi từ máy chủ không hợp lệ");
            }

            if (!response.ok) {
                // Extract error message from the API response based on actual structure
                let errorMessage;
                
                // Format in screenshot shows: error.message
                if (data && data.error && data.error.message) {
                    errorMessage = data.error.message;
                } 
                // Some APIs might use this format
                else if (data && data.message) {
                    errorMessage = data.message;
                }
                // Fallback to status text if no message is found
                else {
                    errorMessage = response.statusText || "Có lỗi xảy ra, vui lòng thử lại";
                }
                
                console.log("API error response:", data);
                return Promise.reject(errorMessage);
            }
            return data;
        });
    }

    // Lưu thông tin người dùng vào localStorage
    setUser(user) {
        if (!user) {
            console.error("Attempted to set null/undefined user");
            return;
        }

        // We need to explicitly fetch the full user profile to check status for Google login
        const fetchAndCheckUserStatus = async () => {
            try {
                if (user.id && user.accessToken) {
                    const response = await fetch(`${API_URL}/user/${user.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-access-token': user.accessToken
                        }
                    });
                    
                    const userData = await this.handleResponse(response);
                    console.log("User status check:", userData);
                    
                    if (userData.status === false) {
                        console.warn("User account is deactivated (status=false)");
                        this.logout(); // Clear any existing login
                        throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
                    }
                    
                    // Merge the profile data with the user data
                    user = { ...user, ...userData };
                }
            } catch (error) {
                console.error("Error checking user status:", error);
                // Continue, but log the issue
            }
        };

        // Call the function to check status (don't await - we'll save what we have)
        fetchAndCheckUserStatus();
        
        // Process roles
        let roles = [];
        if (user.roles && Array.isArray(user.roles)) {
            roles = user.roles.map(role => {
                // If role is already a string that starts with ROLE_
                if (typeof role === 'string' && role.startsWith('ROLE_')) {
                    // Check for undefined
                    if (role === 'ROLE_undefined') {
                        return 'ROLE_MEMBER';
                    }
                    return role;
                }
                // If role is an object with a name property
                else if (typeof role === 'object' && role.name) {
                    return `ROLE_${role.name}`;
                }
                // If role is just a string
                else if (typeof role === 'string') {
                    return `ROLE_${role}`;  // Always add the ROLE_ prefix
                }
                // Default
                return "ROLE_MEMBER";
            });
        } else {
            // Default role if none provided
            roles = ["ROLE_MEMBER"];
        }

        console.log("Formatted roles:", roles); // Debug log

        // Ensure all critical fields exist
        const userData = {
            ...user,
            // Ensure consistent field naming
            id: user.id || (user._id ? user._id.toString() : null),
            email: user.email,
            accessToken: user.accessToken || user.token,
            roles: roles,
            loginTime: new Date().getTime()
        };

        localStorage.setItem("user", JSON.stringify(userData));

        // Dispatch a storage event to notify other components
        window.dispatchEvent(new Event('storage'));
    }

    async refreshUserInfo() {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return null;
            
            const token = this.getToken();
            if (!token) return null;
    
            // Lấy thông tin user từ API
            const response = await fetch(`${API_URL}/user/${currentUser.id || currentUser._id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch updated user data');
            }
    
            const userData = await response.json();
            
            // Check if account is deactivated
            if (userData.status === false) {
                console.warn("User account is deactivated");
                // We still update the user data to reflect the current status
            }
            
            // Cập nhật thông tin user trong localStorage, giữ lại token
            const updatedUser = {
                ...currentUser,
                ...userData,
                roles: userData.roles || currentUser.roles, // Đảm bảo roles được cập nhật
                status: userData.status !== undefined ? userData.status : currentUser.status, // Update status
                loginTime: currentUser.loginTime // Giữ nguyên loginTime
            };
            
            // Lưu vào localStorage và kích hoạt sự kiện storage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage'));
            
            return updatedUser;
        } catch (error) {
            console.error('Error refreshing user info:', error);
            return this.getCurrentUser(); // Trả về thông tin hiện tại nếu có lỗi
        }
    }
}

export default new AuthService();