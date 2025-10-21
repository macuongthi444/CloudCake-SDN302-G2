import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ApiService.post('/user/forgot-password', { email });
      setSuccess(true);
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 3000);
    } catch (error) {
      setError(typeof error === 'string' ? error : 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
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
            Recover Your Account
          </h1>
        </div>
        <img
          src="https://www.marthastewart.com/thmb/I23am9WHQalDICEqnfOE94GDsxw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/brooke-shea-wedding-172-d111277_vert-2000-a9a8ab0ce65c4fcc8a2d47ef174eb56e.jpg"
          alt="Decorative cake"
          className="absolute right-0 bottom-0 h-auto opacity-80"
        />
      </div>

      {/* Right side with form */}
      <div className="w-7/12 flex items-center justify-center bg-cream-50">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg animate__animated animate__slideInRight">
          <h2 className="text-3xl font-bold text-pink-600 mb-6 font-playfair animate__animated animate__fadeIn">Quên mật khẩu</h2>

          {success ? (
            <div className="bg-pink-100 border border-pink-400 text-pink-700 px-4 py-3 rounded mb-4 animate__animated animate__fadeInUp">
              <p className="font-medium">Đã gửi OTP thành công!</p>
              <p>Vui lòng kiểm tra email của bạn để lấy mã OTP.</p>
              <p className="mt-2">Bạn sẽ được chuyển hướng đến trang đặt lại mật khẩu...</p>
            </div>
          ) : (
            <>
              <p className="text-brown-600 mb-6 animate__animated animate__fadeIn">
                Vui lòng nhập địa chỉ email bạn đã sử dụng để đăng ký tài khoản.
                Chúng tôi sẽ gửi mã OTP để xác nhận việc đặt lại mật khẩu của bạn.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate__animated animate__shakeX">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block mb-1 font-medium text-brown-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-cream-50 transition duration-300 ease-in-out"
                    value={email}
                    onChange={handleEmailChange}
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
                    "Gửi mã xác nhận"
                  )}
                </button>
              </form>
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

export default ForgotPassword;