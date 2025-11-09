import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfileContent from './components/ProfileContent'
import PasswordChange from './components/PasswordChange'
import AddressManagement from './components/AddressManagement'
import OrderManagement from './components/OrderManagement'
import OrderDetail from './components/OrderDetail'
import Sidebar from './Sidebar'

import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';

// Main UserProfile Component
const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Lấy id của người dùng từ AuthService
        const currentUser = AuthService.getCurrentUser();

        if (!currentUser) {
          throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        }

        // Gọi API để lấy thông tin chi tiết của người dùng
        const userData = await ApiService.get(`/user/find/${currentUser.email}`);

        // Xử lý dữ liệu nhận được từ API
        let formattedData = {
          ...userData,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender || 'Nam',
          birthDate: {
            day: '1',
            month: '1',
            year: '2003'
          }
        };

        // Nếu API trả về ngày sinh, xử lý định dạng
        if (userData.birthDate) {
          const date = new Date(userData.birthDate);
          formattedData.birthDate = {
            day: date.getDate().toString(),
            month: (date.getMonth() + 1).toString(),
            year: date.getFullYear().toString()
          };
        }

        setProfile(formattedData);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleBirthDateChange = (type, value) => {
    setProfile(prev => ({
      ...prev,
      birthDate: { ...prev.birthDate, [type]: value }
    }));
  };

  // Update profile function to be passed to ProfileContent
  const updateProfile = async (updatedProfile) => {
    try {
      // Lấy id của người dùng
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

  
      // Chuẩn bị dữ liệu để gửi lên API
      const profileToUpdate = {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone
        // Không gửi các trường khác
      };
  
      // Gọi API cập nhật thông tin người dùng
      const response = await ApiService.put(`/user/edit/${updatedProfile._id}`, profileToUpdate);
  
      if (response) {
        // Cập nhật lại state với dữ liệu mới
        setProfile({
          ...profile,
          ...response
        });
  
        return { success: true };
      } else {
        throw new Error("Không nhận được phản hồi từ server");
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      return {
        success: false,
        error: err.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
      };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl flex justify-center items-center h-64">
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto p-4 max-w-7xl flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex gap-10 rounded-lg overflow-hidden">
         <Sidebar profile={profile} />
        <div className="flex-1 bg-white border">
          <Routes>
            {/* Đường dẫn chính phải khớp với path trong Sidebar */}
            <Route
              path="/"
              element={
                <ProfileContent
                  profile={profile}
                  handleInputChange={handleInputChange}
                  handleBirthDateChange={handleBirthDateChange}
                  updateProfile={updateProfile}
                />
              }
            />
           
        
            <Route path="/password" element={<PasswordChange />} />
            <Route path="/addresses" element={<AddressManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            {/* Bổ sung route mặc định để redirect về profile */}
            <Route path="*" element={<Navigate to="/user-profile" replace />} />
           
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
