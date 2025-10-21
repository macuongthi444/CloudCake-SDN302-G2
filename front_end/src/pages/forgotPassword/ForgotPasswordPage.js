import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  
  // Kiểm tra nếu người dùng đã đăng nhập thì chuyển hướng
  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await AuthService.forgotPassword(email);
      setSuccess("Mã xác nhận đã được gửi đến email của bạn.");
      setShowOtpForm(true);
    } catch (error) {
      setError(error.toString() || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Kiểm tra mật khẩu mới
      if (!newPassword.match(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/)) {
        throw new Error("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số");
      }

      await AuthService.resetPassword(email, otp, newPassword);
      setSuccess("Mật khẩu đã được đặt lại thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(error.toString() || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left side with title and plant image */}
      <div className="w-5/12 bg-green-600 flex items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10">
          <h1 className="text-white text-6xl font-bold leading-tight">
            The Real
            <br />
            Options On
            <br />
            Customers
          </h1>
        </div>
        <img 
          src="https://cellphones.com.vn/sforum/wp-content/uploads/2023/12/hinh-nen-xanh-la-2.jpg" 
          alt="Decorative plants" 
          className="absolute right-0 bottom-0 w-3/4 h-auto opacity-80"
        />
      </div>

      {/* Right side with form */}
      <div className="w-7/12 flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          <h2 className="text-3xl font-bold text-green-600 mb-8">
            {showOtpForm ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {!showOtpForm ? (
            // Form yêu cầu OTP
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label className="block mb-1">
                  <span className="font-medium">
                    Email <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="Nhập email đã đăng ký"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Gửi mã xác nhận"}
              </button>
            </form>
          ) : (
            // Form nhập OTP và mật khẩu mới
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block mb-1">
                  <span className="font-medium">
                    Mã xác nhận <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã xác nhận từ email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1">
                  <span className="font-medium">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <div className="mt-1">
              <a href="/login" className="text-green-600 hover:underline text-sm">
                Quay lại trang đăng nhập
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;