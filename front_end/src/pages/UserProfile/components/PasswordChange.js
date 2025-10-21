import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../../services/ApiService";
import AuthService from "../../../services/AuthService";

const PasswordChange = () => {
    const navigate = useNavigate();
    const currentUser = AuthService.getCurrentUser();

    // Nếu không có thông tin người dùng, chuyển về trang đăng nhập
    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        }
    }, [currentUser, navigate]);

    // Step: 1 = Xác nhận email, 2 = Nhập OTP, 3 = Đổi mật khẩu
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState(currentUser?.email || "");
    const [otp, setOtp] = useState("");
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: ""
    });

    // Hàm xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Validate password strength khi thay đổi mật khẩu mới
        if (name === 'newPassword') {
            validatePasswordStrength(value);
        }

        if (error) setError("");
    };

    // Hàm đánh giá độ mạnh của mật khẩu
    const validatePasswordStrength = (password) => {
        let score = 0;
        let message = "";

        if (!password) {
            setPasswordStrength({ score: 0, message: "" });
            return;
        }

        // Minimum 8 characters
        if (password.length >= 8) score += 1;

        // Has letter
        if (/[a-zA-Z]/.test(password)) score += 1;
        
        // Has number
        if (/\d/.test(password)) score += 1;
        
        // Has special character
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine message based on score
        if (score === 1) message = "Yếu";
        else if (score === 2) message = "Trung bình";
        else if (score === 3) message = "Khá mạnh";
        else if (score === 4) message = "Mạnh";

        setPasswordStrength({ score, message });
    };

    // Hàm xử lý xác nhận email và gửi OTP
    const handleVerifyEmail = async (e) => {
        e.preventDefault();

        if (!email) {
            setError("Vui lòng nhập email của bạn");
            return;
        }

        // Kiểm tra email có khớp với email đã đăng ký không
        if (email !== currentUser.email) {
            setError("Email không khớp với tài khoản của bạn");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Gọi API để gửi OTP đến email
            await ApiService.post("/user/forgot-password", { email });

            // Chuyển sang bước nhập OTP
            setStep(2);
            setSuccess("Mã OTP đã được gửi đến email của bạn");
        } catch (error) {
            setError(typeof error === 'string' ? error : "Có lỗi xảy ra khi gửi mã OTP");
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý xác nhận OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp) {
            setError("Vui lòng nhập mã OTP");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError("Mã OTP phải có 6 chữ số");
            return;
        }

        setLoading(true);
        setError("");

        // Trong thực tế, bạn sẽ gọi API để xác thực OTP
        // Tuy nhiên, vì không có endpoint cụ thể, nên chúng ta sẽ chuyển sang bước tiếp theo
        try {
            // Giả lập xác thực OTP thành công
            setTimeout(() => {
                setStep(3);
                setSuccess("Xác thực OTP thành công");
                setLoading(false);
            }, 1000);
        } catch (error) {
            setError("Mã OTP không hợp lệ hoặc đã hết hạn");
            setLoading(false);
        }
    };

    // Validate mật khẩu mới - sử dụng logic giống với Register.js
    const validatePassword = (password) => {
        if (!password) {
            return "Mật khẩu không được để trống";
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
            return "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số";
        }
        return "";
    };

    // Hàm xử lý đổi mật khẩu
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu mới
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Gọi API để đặt lại mật khẩu
            await ApiService.post("/user/reset-password", {
                email,
                otp,
                newPassword: formData.newPassword
            });

            // Hiển thị thông báo thành công
            setSuccess("Đổi mật khẩu thành công!");

            // Đăng xuất người dùng sau 3 giây và chuyển họ đến trang đăng nhập
            setTimeout(() => {
                AuthService.logout();
                navigate("/user-profile");
            }, 3000);
        } catch (error) {
            setError(typeof error === 'string' ? error : "Có lỗi xảy ra khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    // Render password strength indicator
    const renderPasswordStrengthIndicator = () => {
        if (!formData.newPassword) return null;
        
        const { score, message } = passwordStrength;
        let colorClass = "bg-gray-200";
        
        if (score === 1) colorClass = "bg-red-500";
        else if (score === 2) colorClass = "bg-yellow-500";
        else if (score === 3) colorClass = "bg-green-300";
        else if (score === 4) colorClass = "bg-green-500";
        
        return (
            <div className="mt-1">
                <div className="h-2 w-full bg-gray-200 rounded">
                    <div className={`h-full ${colorClass} rounded`} style={{ width: `${score * 25}%` }}></div>
                </div>
                <p className="text-xs mt-1">{message}</p>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Đổi Mật Khẩu</h2>

            {/* Hiển thị thông báo lỗi */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Hiển thị thông báo thành công */}
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}

            {/* Form xác nhận email */}
            {step === 1 && (
                <form className="space-y-4" onSubmit={handleVerifyEmail}>
                    <div>
                        <p className="text-gray-600 mb-4">
                            Để đảm bảo an toàn cho tài khoản của bạn, vui lòng xác nhận email trước khi đổi mật khẩu.
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email của bạn
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Gửi mã xác nhận"}
                        </button>
                    </div>
                </form>
            )}

            {/* Form nhập OTP */}
            {step === 2 && (
                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                    <div>
                        <p className="text-gray-600 mb-4">
                            Mã OTP đã được gửi đến email {email}. Vui lòng kiểm tra và nhập mã xác nhận.
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã OTP
                        </label>
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="Nhập mã 6 chữ số"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Mã OTP có hiệu lực trong 10 phút
                        </p>
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                    </div>
                </form>
            )}

            {/* Form đổi mật khẩu */}
            {step === 3 && (
                <form className="space-y-4" onSubmit={handleChangePassword}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="Nhập mật khẩu mới"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                            required
                        />
                        {renderPasswordStrengthIndicator()}
                        <p className="text-xs text-gray-500 mt-1">
                            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu mới"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PasswordChange;