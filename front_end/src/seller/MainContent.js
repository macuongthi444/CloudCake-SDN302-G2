
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../pages/Login/context/AuthContext';
import ProductList from './component/ProductList';
import Dashboard from './Dashboard';
import SellerOrderManagement from './order/SellerOrderManagement';
import SellerShopManagement from './shop/SellerShopManagement';
import SellerPayoutsPage from './payouts/SellerPayoutsPage';

const MainContent = () => {
  const { isLoggedIn, hasRole } = useAuth();
  const isSeller = hasRole?.([], 'SELLER') || true; // fallback visual access; actual API guards still apply

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/orders" element={<SellerOrderManagement />} />
      <Route path="/shop" element={<SellerShopManagement />} />
      <Route path="/payouts" element={<SellerPayoutsPage />} />
      <Route path="*" element={<Navigate to="/seller" replace />} />
    </Routes>
  );
};

export default MainContent;


