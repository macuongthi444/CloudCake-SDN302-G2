import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

const SellerLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-72 border-r bg-white">
        <Sidebar />
      </div>
      <div className="flex-1">
        <MainContent />
      </div>
    </div>
  );
};

export default SellerLayout;







