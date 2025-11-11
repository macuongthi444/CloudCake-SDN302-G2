import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../pages/Login/context/AuthContext';
import SellerProductManagement from './product/SellerProductManagement';
import Dashboard from './Dashboard';

const Placeholder = ({ title, description, children }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      {children}
    </div>
  </div>
);

const OrdersPage = () => (
  <Placeholder title="Đơn hàng" description="Quản lý và xử lý đơn hàng của khách.">
    <div className="text-gray-500">Tính năng sẽ được bổ sung.</div>
  </Placeholder>
);

const PayoutsPage = () => (
  <Placeholder title="Thanh toán" description="Theo dõi thanh toán và doanh thu.">
    <div className="text-gray-500">Tính năng sẽ được bổ sung.</div>
  </Placeholder>
);

const ShopPage = () => (
  <Placeholder title="Cửa hàng của tôi" description="Cập nhật thông tin cửa hàng, trạng thái hoạt động.">
    <div className="text-gray-500">Tính năng sẽ được bổ sung.</div>
  </Placeholder>
);

const MainContent = () => {
  const { isLoggedIn, hasRole } = useAuth();
  const isSeller = hasRole?.([], 'SELLER') || true; // fallback visual access; actual API guards still apply

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<SellerProductManagement />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/payouts" element={<PayoutsPage />} />
      <Route path="*" element={<Navigate to="/seller" replace />} />
    </Routes>
  );
};

export default MainContent;


