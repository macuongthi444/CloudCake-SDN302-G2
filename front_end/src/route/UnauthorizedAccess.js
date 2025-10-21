// src/components/UnauthorizedAccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedAccess = ({ isAuthenticated = false, redirectTo = '/', message, countdownSeconds = 3 }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(countdownSeconds);
  
  useEffect(() => {
    // Redirect after countdown
    const timer = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timer);
          navigate(redirectTo);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate, redirectTo]);
  
  const defaultMessage = isAuthenticated
    ? "Bạn không có quyền truy cập trang này." 
    : "Vui lòng đăng nhập để tiếp tục.";
    
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isAuthenticated ? 'Truy Cập Bị Từ Chối' : 'Yêu Cầu Đăng Nhập'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message || defaultMessage}
        </p>
        
        <div className="text-sm text-gray-500">
          Tự động chuyển hướng sau <span className="font-bold">{countdown}</span> giây...
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => navigate(redirectTo)}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isAuthenticated ? 'Về Trang Chủ' : 'Đăng Nhập Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;