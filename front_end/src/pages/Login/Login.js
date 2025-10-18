import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BE_API_URL } from "../../config/config";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Use auth context
    const { isLoggedIn, login, handleGoogleAuthLogin, userRoles } = useAuth();

    // Function to redirect based on user role - IMPROVED VERSION
    const redirectBasedOnRole = (roles = []) => {
        console.log("Redirecting based on roles:", roles); // Debug log
        
        // Default to home page
        let redirectPath = '/';
        
        // Ensure roles is an array
        if (!Array.isArray(roles)) {
            console.error("Roles is not an array:", roles);
            roles = [];
        }
        
        // Check for both formats: "ROLE_ADMIN", "ADMIN", etc.
        const hasAdminRole = roles.some(role => {
            if (typeof role !== 'string') return false;
            return role.toUpperCase() === 'ROLE_ADMIN' || role.toUpperCase() === 'ADMIN';
        });
        
        const hasSellerRole = roles.some(role => {
            if (typeof role !== 'string') return false;
            return role.toUpperCase() === 'ROLE_SELLER' || role.toUpperCase() === 'SELLER';
        });
        
        // Set redirect path based on role
        if (hasAdminRole) {
            redirectPath = '/admin';
            console.log("Redirecting to admin dashboard");
        } else if (hasSellerRole) {
            redirectPath = '/seller-dashboard';
            console.log("Redirecting to seller dashboard");
        } else {
            console.log("Redirecting to home (member role)");
        }
        
        navigate(redirectPath);
    };

    // Check if user is already logged in and redirect accordingly
    useEffect(() => {
        if (isLoggedIn && userRoles) {
            console.log("User is already logged in with roles:", userRoles);
            redirectBasedOnRole(userRoles);
        }
    }, [isLoggedIn, userRoles, navigate]);

    // Handle Google auth redirect
    useEffect(() => {
        const googleAuthData = searchParams.get('googleAuth');
        if (googleAuthData) {
            processGoogleAuthData(googleAuthData);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Use context's login function
            const result = await login(formData.email, formData.password);
            console.log("Login successful, result:", result);
            
            // Get roles from the result or from context
            const roles = result?.roles || userRoles || [];
            console.log("Roles for redirection:", roles);
            
            // Redirect based on user role
            redirectBasedOnRole(roles);
        } catch (error) {
            console.error("Login error:", error);
            setError(error || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    // Function to handle Google authentication redirect
    const handleGoogleRedirect = () => {
        window.location.href = `${BE_API_URL}/api/auth/google`;
    };

    const processGoogleAuthData = (userDataEncoded) => {
        try {
            // Decode the user data
            const userData = JSON.parse(decodeURIComponent(userDataEncoded));
            console.log("Google auth data:", userData);
            
            // Use the context's function to handle Google auth login
            const success = handleGoogleAuthLogin(userData);
            
            if (success) {
                console.log("Google login successful, roles:", userData.roles);
                
                // Add a delay before redirect to ensure storage is complete
                setTimeout(() => {
                    // Redirect based on user roles from the userData
                    redirectBasedOnRole(userData.roles || []);
                }, 500);
            } else {
                setError("Lỗi xử lý dữ liệu đăng nhập Google");
            }
        } catch (error) {
            console.error("Error processing Google auth data:", error);
            setError("Lỗi xử lý đăng nhập Google: " + error.message);
        }
    };

    // The rest of your component remains the same
    return (
        <div className="flex h-screen w-full">
            {/* Left side with title and plant image */}
            <div className="w-5/12 bg-green-600 flex items-center p-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-white text-6xl font-bold leading-tight">
                        The Real<br />
                        Options On<br />
                        Customers
                    </h1>
                </div>
                <img 
                    src="https://cellphones.com.vn/sforum/wp-content/uploads/2023/12/hinh-nen-xanh-la-2.jpg" 
                    alt="Decorative plants" 
                    className="absolute right-0 bottom-0 w-3/4 h-auto opacity-80"
                />
            </div>

            {/* Right side with login form */}
            <div className="w-7/12 flex items-center justify-center">
                <div className="w-full max-w-md px-8">
                    <h2 className="text-3xl font-bold text-green-600 mb-8">Đăng nhập tài khoản</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block mb-1">
                                <span className="font-medium">Email <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="abcxyz@gmail.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1">
                                <span className="font-medium">Password <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="********"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Hoặc đăng nhập bằng</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleRedirect}
                                className="flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
                            >
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5">
                                        <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                        <path fill="#34A853" d="M168.9 350.2L212.7 470 340.9 136.1 168.9 350.2z" />
                                        <path fill="#FBBC05" d="M168.9 350.2L212.7 470 340.9 136.1 168.9 350.2z" />
                                        <path fill="#EA4335" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <a href="/forgot-password" className="text-green-600 hover:underline text-sm">
                            Bạn quên mật khẩu? Click vào đây
                        </a>
                        <div className="mt-1">
                            <a href="/register" className="text-green-600 hover:underline text-sm">
                                Đăng kí tài khoản
                            </a>
                        </div>
                        <div className="mt-1">
                            <a href="/" className="text-green-600 hover:underline text-sm">
                                Về trang chủ
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;