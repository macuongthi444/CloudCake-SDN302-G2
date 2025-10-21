import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem('resetEmail') || '';
  
  // Store email in localStorage if it exists in state
  useEffect(() => {
    if (location.state?.email) {
      localStorage.setItem('resetEmail', location.state.email);
    }
  }, [location.state]);
  
  const [step, setStep] = useState(1); // 1 = OTP verification, 2 = New password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // OTP input handlers
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setOtp(value);
    if (error) setError('');
  };
  
  // Password input handlers
  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (error) setError('');
  };
  
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError('');
  };
  
  // Validate OTP
  const validateOtp = (otp) => {
    return /^\d{6}$/.test(otp);
  };
  
  // Validate password
  const validatePassword = (password) => {
    return /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
  };
  
  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    
    if (!validateOtp(otp)) {
      setError('Mã OTP phải có 6 chữ số');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // For security reasons, we're not calling a real API endpoint to verify OTP here
      // Advance to password reset step
      setStep(2);
    } catch (error) {
      setError(typeof error === 'string' ? error : 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (!validatePassword(newPassword)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await ApiService.post('/user/reset-password', {
        email,
        otp,
        newPassword
      });
      
      setSuccess(true);
      localStorage.removeItem('resetEmail');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(typeof error === 'string' ? error : 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };
  
  // If no email is provided, redirect to forgot password page
  if (!email) {
    navigate('/forgot-password');
    return null;
  }
  
  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-pink-100 to-cream-100">
      {/* Left side with title and cake image */}
      <div className="w-5/12 bg-pink-300 flex items-center p-16 relative overflow-hidden animate__animated animate__fadeIn animate__slow">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold leading-tight font-playfair animate__animated animate__fadeInDown">
            Sweet Delights<br />
            Cake Shop<br />
            Reset Your Password
          </h1>
        </div>
        <img
          src="https://www.marthastewart.com/thmb/I23am9WHQalDICEqnfOE94GDsxw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/brooke-shea-wedding-172-d111277_vert-2000-a9a8ab0ce65c4fcc8a2d47ef174eb56e.jpg"
          alt="Decorative cake"
          className="absolute right-0 bottom-0 h-auto opacity-80 animate__animated animate__zoomIn animate__delay-1s"
        />
      </div>
      
      {/* Right side with form */}
      <div className="w-7/12 flex items-center justify-center bg-cream-50">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg animate__animated animate__slideInRight">
          <h2 className="text-3xl font-bold text-pink-600 mb-6 font-playfair animate__animated animate__fadeIn">
            {step === 1 ? 'Xác nhận mã OTP' : 'Đặt lại mật khẩu'}
          </h2>
          
          {success ? (
            <div className="bg-pink-100 border border-pink-400 text-pink-700 px-4 py-3 rounded mb-4 animate__animated animate__fadeInUp">
              <p className="font-medium">Đặt lại mật khẩu thành công!</p>
              <p>Bạn có thể đăng nhập bằng mật khẩu mới.</p>
              <p className="mt-2">Bạn sẽ được chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate__animated animate__shakeX">
                  {error}
                </div>
              )}
              
              {step === 1 ? (
                // OTP Verification Form
                <>
                  <p className="text-brown-600 mb-6 animate__animated animate__fadeIn">
                    Mã OTP đã được gửi đến email <span className="font-medium">{email}</span>. 
                    Vui lòng kiểm tra và nhập mã xác nhận bên dưới.
                  </p>
                  
                  <form onSubmit={handleVerifyOtp}>
                    <div className="mb-6">
                      <label className="block mb-1 font-medium text-brown-700">
                        Mã xác nhận OTP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập mã 6 chữ số"
                        maxLength="6"
                        className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                        value={otp}
                        onChange={handleOtpChange}
                        required
                      />
                      <p className="text-sm text-brown-600 mt-1">
                        Mã OTP có hiệu lực trong 10 phút
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition transform hover:scale-105 animate__animated animate__pulse animate__infinite animate__slow flex items-center justify-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-t-pink-700 border-pink-200 rounded-full animate-spin"></div>
                      ) : (
                        "Xác nhận"
                      )}
                    </button>
                  </form>
                </>
              ) : (
                // New Password Form
                <>
                  <p className="text-brown-600 mb-6 animate__animated animate__fadeIn">
                    Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                  </p>
                  
                  <form onSubmit={handleResetPassword}>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium text-brown-700">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                        value={newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <p className="text-xs text-brown-600 mt-1">
                        Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block mb-1 font-medium text-brown-700">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
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
                        "Đặt lại mật khẩu"
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-pink-600 hover:underline text-sm font-medium transition hover:text-pink-700">
              Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;