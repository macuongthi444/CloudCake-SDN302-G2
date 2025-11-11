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

    // Function to redirect based on user role
    const redirectBasedOnRole = (roles = []) => {
        console.log("Redirecting based on roles:", roles);
        let redirectPath = '/';
        if (!Array.isArray(roles)) {
            console.error("Roles is not an array:", roles);
            roles = [];
        }
        const hasAdminRole = roles.some(role =>
            typeof role === 'string' &&
            (role.toUpperCase() === 'ROLE_ADMIN' || role.toUpperCase() === 'ADMIN')
        );
        const hasSellerRole = roles.some(role =>
            typeof role === 'string' &&
            (role.toUpperCase() === 'ROLE_SELLER' || role.toUpperCase() === 'SELLER')
        );
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

    // Check if user is already logged in
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
            const result = await login(formData.email, formData.password);
            console.log("Login successful, result:", result);
            const roles = result?.roles || userRoles || [];
            console.log("Roles for redirection:", roles);
            redirectBasedOnRole(roles);
        } catch (error) {
            console.error("Login error:", error);
            setError(error || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRedirect = () => {
        window.location.href = `${BE_API_URL}/api/auth/google`;
    };

    const processGoogleAuthData = (userDataEncoded) => {
        try {
            const userData = JSON.parse(decodeURIComponent(userDataEncoded));
            console.log("Google auth data:", userData);
            const success = handleGoogleAuthLogin(userData);
            if (success) {
                console.log("Google login successful, roles:", userData.roles);
                setTimeout(() => {
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

    return (
        <div className="flex h-screen w-full bg-gradient-to-br from-pink-100 to-cream-100">
            {/* Left side with title and cake image */}
            <div className="w-5/12 bg-pink-300 flex items-center p-16 relative overflow-hidden animate__animated animate__fadeIn animate__slow">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-white text-5xl font-bold leading-tight font-playfair animate__animated animate__fadeInDown">
                        Sweet Delights<br />
                        Cake Shop<br />
                        Welcome Back
                    </h1>
                </div>
                <img
                    src="https://www.marthastewart.com/thmb/I23am9WHQalDICEqnfOE94GDsxw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/brooke-shea-wedding-172-d111277_vert-2000-a9a8ab0ce65c4fcc8a2d47ef174eb56e.jpg"
                    alt="Decorative cake"
                    className="absolute right-0 bottom-0 h-auto opacity-80"
                />
            </div>

            {/* Right side with login form */}
            <div className="w-7/12 flex items-center justify-center bg-cream-50">
                <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg animate__animated animate__slideInRight">
                    <h2 className="text-3xl font-bold text-pink-600 mb-8 font-playfair animate__animated animate__fadeIn">Đăng nhập</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate__animated animate__shakeX">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block mb-1 font-medium text-brown-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="abcxyz@gmail.com"
                                className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-brown-700">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="********"
                                className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition transform hover:scale-105 animate__animated animate__pulse animate__infinite animate__slow flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-t-pink-700 border-pink-200 rounded-full animate-spin"></div>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-pink-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-brown-600">Hoặc đăng nhập bằng</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleRedirect}
                                className="flex items-center justify-center px-6 py-2 border border-pink-300 rounded-md shadow-sm bg-white hover:bg-pink-50 transition transform hover:scale-110 animate__animated animate__fadeInUp"
                            >
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5">
                                        <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                        <path fill="#34A853" d="M168.9 350.2L212.7 470 340.9 136.1 168.9 350.2z" />
                                        <path fill="#FBBC05" d="M168.9 350.2L212.7 470 340.9 136.1 168.9 350.2z" />
                                        <path fill="#EA4335" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                    </svg>
                                    <span className="ml-2 text-brown-600">Google</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-center space-y-2">
                        <a href="/forgot-password" className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700">
                            Quên mật khẩu?
                        </a>
                        <div>
                            <a href="/register" className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700">
                                Tạo tài khoản mới
                            </a>
                        </div>
                        <div>
                            <a href="/" className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700">
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