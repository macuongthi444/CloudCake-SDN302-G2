import React from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// import ProductManagement from './product/ProductManagement';
// import CategoryManagement from './category/CategoryManagement';
import PaymentManagement from './payment/PaymentManagement';

import logo from '../assets/Logo.jpg'


// Main Content Component
const MainContent = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 h-screen overflow-y-auto">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="p-4 flex gap-2 items-center">
          <img src={logo} alt="" className="h-10" />
          <p>CloudCake</p>
        </div>
        {/* <div className="relative w-3/5">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div> */}

        <div className="flex items-center">
          <div className="mr-4 flex items-center">
            <span className="mr-2">Việt Nam</span>
            <ChevronDown size={16} />
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {/* User profile picture or initials */}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <Routes>
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* <Route path="/products" element={<ProductManagement />} />

          <Route path="/categories" element={<CategoryManagement />} /> */}
          
          <Route path="/payments" element={<PaymentManagement />} />
        
          <Route path="/support" element={<div className="p-6">Nội dung Hỗ trợ</div>} />
          <Route path="/settings" element={<div className="p-6">Nội dung Cài đặt</div>} />

        
        </Routes>
      </div>
    </div>
  );
};

export default MainContent;