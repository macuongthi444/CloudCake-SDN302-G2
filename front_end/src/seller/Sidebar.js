import React from 'react';
import { Package, ClipboardList, Store, DollarSign, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const logout = () => {
    AuthService.logout();
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">Seller Dashboard</h1>
        <p className="text-sm text-gray-500">Quản lý cửa hàng của bạn</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/seller/products" className={`flex items-center gap-3 p-3 rounded-lg ${isActive('/seller/products') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
          <Package size={18} />
          Sản phẩm
        </Link>
        <Link to="/seller/orders" className={`flex items-center gap-3 p-3 rounded-lg ${isActive('/seller/orders') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
          <ClipboardList size={18} />
          Đơn hàng
        </Link>
        <Link to="/seller/shop" className={`flex items-center gap-3 p-3 rounded-lg ${isActive('/seller/shop') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
          <Store size={18} />
          Cửa hàng của tôi
        </Link>
        <Link to="/seller/payouts" className={`flex items-center gap-3 p-3 rounded-lg ${isActive('/seller/payouts') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
          <DollarSign size={18} />
          Thanh toán
        </Link>
      </nav>
      <div className="p-4 border-t">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-600 hover:bg-red-50">
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;




