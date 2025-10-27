import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import MainContent from './MainContent.js';

const AdminLayout = () => {
  return (
    <div className="flex w-full h-screen">
      <div className='w-1/5 h-screen'>
        <Sidebar />
      </div>

      <div className='w-4/5'>
        <MainContent />
      </div>

    </div>
  );
};

export default AdminLayout;