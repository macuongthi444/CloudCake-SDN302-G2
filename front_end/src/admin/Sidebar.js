import React, { useState } from 'react';
import { BarChart2, Package, Grid, ShoppingBag, Users, Truck, HelpCircle, Settings, ChevronDown, ArrowRight, Tag, LogOut, DollarSign, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

// Sidebar Component
const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState(['products']);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  // Handle logout
  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
    window.location.reload(); // Reload to ensure all states are reset
  };
  
  const menuItems = [
    { id: 'dashboard', icon: <BarChart2 size={20} />, label: 'Bảng điều khiển', hasSubmenu: false, path: '/admin/dashboard' },
    { id: 'products', icon: <Package size={20} />, label: 'Sản phẩm', hasSubmenu: true, submenus: [
      { id: 'productManagement', label: 'Quản lý sản phẩm', path: '/admin/products' }
    ]},
    { id: 'categories', icon: <Grid size={20} />, label: 'Danh mục', hasSubmenu: true, submenus: [
      { id: 'allCategories', label: 'Tất cả danh mục', path: '/admin/categories' }
    ]},
    { id: 'brands', icon: <ShoppingBag size={20} />, label: 'Thương hiệu', hasSubmenu: true, submenus: [
      { id: 'brandList', label: 'Danh sách thương hiệu', path: '/admin/brands' }
    ]},
    { id: 'stores', icon: <ShoppingBag size={20} />, label: 'Cửa hàng', hasSubmenu: true, submenus: [
      { id: 'storeList', label: 'Danh sách cửa hàng', path: '/admin/stores' },
      { id: 'confirmStore', label: 'Duyệt cửa hàng', path: '/admin/store-requests' }
    ]},
    { id: 'customers', icon: <Users size={20} />, label: 'Khách hàng', hasSubmenu: true, submenus: [
      { id: 'customerManagement', label: 'Quản lý khách hàng', path: '/admin/customers' }
    ]},
    { id: 'orders', icon: <Truck size={20} />, label: 'Đơn hàng', hasSubmenu: true, submenus: [
      { id: 'orderManagement', label: 'Tất cả đơn hàng', path: '/admin/orders' }
    ]},
    { id: 'coupons', icon: <Tag size={20} />, label: 'Mã giảm giá', hasSubmenu: true, submenus: [
      { id: 'couponList', label: 'Danh sách mã giảm giá', path: '/admin/coupons' }
    ]},
    { id: 'payments', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>, label: 'Thanh toán', hasSubmenu: true, submenus: [
      { id: 'paymentManagement', label: 'Phương thức thanh toán', path: '/admin/payments' }
    ]},
    { id: 'shipping', icon: <Truck size={20} />, label: 'Vận chuyển', hasSubmenu: true, submenus: [
      { id: 'shippingManagement', label: 'Phương thức vận chuyển', path: '/admin/shippings' }
    ]},
    { 
      id: 'revenue', 
      icon: <DollarSign size={20} />, 
      label: 'Quản lý doanh thu', 
      hasSubmenu: true, 
      submenus: [
        { id: 'revenueDashboard', label: 'Bảng điều khiển doanh thu', path: '/admin/revenue/dashboard' },
        // { id: 'shopPayments', label: 'Thanh toán cửa hàng', path: '/admin/revenue/shop-payments' },
        { id: 'paymentBatches', label: 'Đợt thanh toán', path: '/admin/revenue/payment-batches' }
      ]
    },
    { id: 'profile', icon: <User size={20} />, label: 'Hồ sơ của tôi', hasSubmenu: true, submenus: [
      { id: 'profileManagement', label: 'Thông tin cá nhân', path: '/admin/profile' },
      { id: 'passwordChange', label: 'Đổi mật khẩu', path: '/admin/password' }
    ]},
    // { id: 'settings', icon: <Settings size={20} />, label: 'Cài đặt', hasSubmenu: false, path: '/admin/settings' },
  ];
  
  const toggleMenu = (menuId) => {
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId));
    } else {
      setExpandedMenus([...expandedMenus, menuId]);
    }
  };

  const isActiveMenu = (path) => {
    return currentPath === path;
  };

  return (
    <div className="h-screen bg-white border-r border-gray-200 overflow-y-auto px-6 flex flex-col">
      
      <div className="px-4 py-2 flex-grow">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.hasSubmenu ? (
              <div 
                className={`flex items-center p-3 my-1 rounded-lg cursor-pointer hover:bg-gray-50`}
                onClick={() => toggleMenu(item.id)}
              >
                <div className="mr-3 text-gray-500">
                  {item.icon}
                </div>
                <span className="flex-grow font-medium text-gray-700">{item.label}</span>
                <ChevronDown size={18} className={`text-gray-400 transform transition-transform ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`} />
              </div>
            ) : (
              <Link to={item.path}>
                <div 
                  className={`flex items-center p-3 my-1 rounded-lg cursor-pointer ${isActiveMenu(item.path) ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="mr-3 text-gray-500">
                    {item.icon}
                  </div>
                  <span className={`flex-grow font-medium ${isActiveMenu(item.path) ? 'text-blue-600' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            )}
            
            {/* Submenu items */}
            {item.hasSubmenu && item.submenus && expandedMenus.includes(item.id) && (
              <div className="ml-7 my-1">
                {item.submenus.map(submenu => (
                  <Link key={submenu.id} to={submenu.path}>
                    <div
                      className={`flex items-center p-2 pl-4 my-1 rounded-lg cursor-pointer ${isActiveMenu(submenu.path) ? 'bg-gray-100 text-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      <ArrowRight size={16} className="mr-2 text-gray-400" />
                      <span className={`text-sm ${isActiveMenu(submenu.path) ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                        {submenu.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Logout button - new addition */}
      <div className="px-4 py-6 border-t border-gray-200 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;