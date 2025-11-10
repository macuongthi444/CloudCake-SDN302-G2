import React, { useState, useEffect } from 'react';
import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialProfile, setInitialProfile] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  // Fetch admin profile data
  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      // Lấy thông tin người dùng từ localStorage
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }
      
      // Gọi API để lấy thông tin admin sử dụng ID từ localStorage
      const userData = await ApiService.get(`/user/${currentUser.id}`);
      
      // Kiểm tra vai trò của người dùng có phải admin không
      // Có thể thêm logic validation vai trò nếu cần
      
      setProfile(userData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  // Validate profile data
  const validateProfileData = () => {
    let errors = {};
    
    // Kiểm tra firstname không được để trống
    if (!profile.firstName || profile.firstName.trim() === '') {
      errors.firstName = 'Tên không được để trống';
    }
    
    // Kiểm tra lastName không được để trống
    if (!profile.lastName || profile.lastName.trim() === '') {
      errors.lastName = 'Họ không được để trống';
    }
    
    // Kiểm tra số điện thoại chỉ chứa số và đủ định dạng
    if (profile.phone) {
      const phoneRegex = /^(84|0[3-9])[0-9]{8,9}$/;
      if (!phoneRegex.test(profile.phone)) {
        errors.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 84 hoặc 0 và có đủ số)';
      }
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Handle edit button
  const handleEdit = () => {
    setInitialProfile({...profile});
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  // Handle cancel button
  const handleCancel = () => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Handle save button
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate profile data
    const { isValid, errors } = validateProfileData();
    if (!isValid) {
      const errorMessage = Object.values(errors).join(', ');
      setError(errorMessage);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Chuẩn bị dữ liệu để gửi lên API
      const profileToUpdate = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone
        // Không gửi các trường không được phép cập nhật
      };
      
      // Gọi API cập nhật thông tin admin sử dụng ID từ profile
      const response = await ApiService.put(`/user/edit/${profile._id}`, profileToUpdate);
      
      if (response) {
        setSuccess('Cập nhật thông tin thành công!');
        setIsEditing(false);
        
        // Cập nhật lại state với dữ liệu mới
        setProfile(response);
      } else {
        throw new Error("Không nhận được phản hồi từ server");
      }
    } catch (err) {
      console.error('Error updating admin profile:', err);
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return <div className="p-6 text-center">Đang tải thông tin...</div>;
  }

  if (error && !profile) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>
      
      {/* Hiển thị thông báo lỗi nếu có */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Hiển thị thông báo thành công nếu có */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSave}>
        {isEditing && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <p className="text-sm">
              <strong>Lưu ý:</strong> Bạn có thể cập nhật họ, tên và số điện thoại, email không thể thay đổi.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ</label>
            <input
              type="text"
              value={profile?.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
            <input
              type="text"
              value={profile?.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={profile?.email || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            disabled={true} // Email không được phép thay đổi
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
          <input
            type="tel"
            value={profile?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isEditing}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;