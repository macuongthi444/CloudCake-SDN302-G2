import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../services/ApiService";
import AuthService from "../../services/AuthService";

const AdminPasswordChange = () => {
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

    // Hàm xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
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
        // Tuy nhiên ở đây chuyển sang bước tiếp theo để đổi mật khẩu
        try {
            // Trong thực tế ở đây sẽ có API kiểm tra OTP
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

    // Hàm xử lý đổi mật khẩu
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu mới
        if (!formData.newPassword) {
            setError("Vui lòng nhập mật khẩu mới");
            return;
        }

        // Kiểm tra mật khẩu mạnh hơn: ít nhất 8 ký tự, có chữ và số
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.newPassword)) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ và số");
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
                navigate("/login");
            }, 3000);
        } catch (error) {
            setError(typeof error === 'string' ? error : "Có lỗi xảy ra khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

export default AdminPasswordChange;