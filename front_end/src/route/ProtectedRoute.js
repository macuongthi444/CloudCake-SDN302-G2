// src/route/ProtectedRoute.js

import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../pages/Login/context/AuthContext';
import UnauthorizedAccess from './UnauthorizedAccess';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isLoggedIn, loading, userRoles = [] } = useAuth();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [unauthorizedReason, setUnauthorizedReason] = useState("");
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Show unauthorized access component if needed
  if (showUnauthorized) {
    return (
      <UnauthorizedAccess 
        isAuthenticated={isLoggedIn} 
        redirectTo={isLoggedIn ? "/" : "/login"}
        message={unauthorizedReason}
      />
    );
  }
  
  // Kiểm tra người dùng đã đăng nhập chưa
  if (!isLoggedIn) {
    setShowUnauthorized(true);
    setUnauthorizedReason("Bạn cần đăng nhập để truy cập trang này.");
    return <UnauthorizedAccess redirectTo="/login" />;
  }
  
  // Nếu không yêu cầu role cụ thể hoặc chỉ yêu cầu đăng nhập
  if (requiredRoles.length === 0) {
    return children || <Outlet />;
  }
  
  // Kiểm tra người dùng có role phù hợp không
  const hasRequiredRole = requiredRoles.some(role => {
    // Format role name if needed (add ROLE_ prefix if not present)
    const formattedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return userRoles.includes(formattedRole);
  });
  
  if (!hasRequiredRole) {
    // Show unauthorized component before redirect
    setShowUnauthorized(true);
    setUnauthorizedReason("Bạn không có quyền truy cập vào trang này.");
    return (
      <UnauthorizedAccess 
        isAuthenticated={true} 
        redirectTo="/"
        message="Bạn không có quyền truy cập vào trang này."
      />
    );
  }
  
  // Nếu đã đăng nhập và có quyền phù hợp
  return children || <Outlet />;
};

// For convenience, create pre-configured route protectors
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['ADMIN']}>
    {children}
  </ProtectedRoute>
);

export const SellerRoute = ({ children }) => {
  const { canAccessSellerDashboard, getSellerDashboardAccessReason, isLoggedIn, userRoles } = useAuth();
  
  // Kiểm tra người dùng có role seller không
  const hasSellerRole = userRoles.some(role => 
    role === 'ROLE_SELLER' || role === 'ROLE_MOD' || role === 'SELLER' || role === 'MOD'
  );
  
  // Nếu người dùng không đăng nhập hoặc không có role seller
  if (!isLoggedIn || !hasSellerRole) {
    return (
      <UnauthorizedAccess 
        isAuthenticated={isLoggedIn} 
        redirectTo={isLoggedIn ? "/" : "/login"}
        message={isLoggedIn ? "Bạn không có quyền truy cập vào trang này." : "Bạn cần đăng nhập để tiếp tục."}
      />
    );
  }
  
  // Kiểm tra trạng thái cửa hàng
 
  
  // Nếu đã đăng nhập, có quyền seller và cửa hàng đang hoạt động
  return children;
};

export default ProtectedRoute;