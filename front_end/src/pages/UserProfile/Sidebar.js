import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Lock } from 'lucide-react'
import avatar from '../../assets/avatar.png'
import { useEffect, useState } from 'react';

// Sidebar Component
const Sidebar = ({ profile }) => {
  const location = useLocation();

  // Lắng nghe sự kiện thay đổi số lượng tin nhắn chưa đọc
  

  const sidebarItems = [
    { icon: User, label: 'Tài khoản của tôi', key: 'profile', path: '/user-profile' },
    
    
    { icon: Lock, label: 'Đổi mật khẩu', key: 'password', path: '/user-profile/password' },
  ];

  return (
    <div className="w-64 bg-white border p-4">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <img src={avatar} className='w-full h-full' alt="Profile" />
        </div>
        <div>
          <p className="font-semibold">
            {profile && (profile.lastName || profile.firstName) ?
              `${profile.lastName || ''} ${profile.firstName || ''}`.trim() :
              'Người dùng'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`
              flex items-center w-full p-2 rounded relative
              ${location.pathname === item.path
                ? 'bg-purple-100 text-purple-600'
                : 'hover:bg-gray-100'}
            `}
          >
            <item.icon className="mr-3" size={20} />
            <span>{item.label}</span>

            {/* Badge hiển thị số lượng chưa đọc */}
            {item.badge && (
              <div className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {item.badge > 9 ? '9+' : item.badge}
              </div>
            )}
          </Link>
        ))}

        <Link
          to="/"
          className="flex items-center w-full p-2 rounded hover:bg-gray-100 text-red-500"
        >
          <LogOut className="mr-3" size={20} />
          <span>Thoát</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;