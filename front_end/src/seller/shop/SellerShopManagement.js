import React, { useState, useEffect } from 'react';
import { Save, Upload, Store, MapPin, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import ShopService from '../../services/ShopService';
import { toastSuccess, toastError } from '../../utils/toast';

const SellerShopManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shop, setShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      ward: '',
      district: '',
      city: '',
      postalCode: ''
    }
  });

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      setLoading(true);
      const shopData = await ShopService.getMyShop();
      setShop(shopData);
      setFormData({
        name: shopData.name || '',
        description: shopData.description || '',
        phone: shopData.phone || '',
        email: shopData.email || '',
        address: {
          street: shopData.address?.street || '',
          ward: shopData.address?.ward || '',
          district: shopData.address?.district || '',
          city: shopData.address?.city || '',
          postalCode: shopData.address?.postalCode || ''
        }
      });
    } catch (error) {
      console.error('Error loading shop:', error);
      toastError('Không thể tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop || !shop._id) {
      toastError('Không tìm thấy cửa hàng');
      return;
    }

    try {
      setSaving(true);
      await ShopService.updateShop(shop._id, formData);
      toastSuccess('Cập nhật thông tin cửa hàng thành công!');
      await loadShop();
    } catch (error) {
      console.error('Error updating shop:', error);
      toastError('Lỗi khi cập nhật: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!shop || !shop._id) {
      toastError('Không tìm thấy cửa hàng');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      // Assuming API endpoint exists for shop image upload
      const response = await fetch(`/api/shop/upload/${shop._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      toastSuccess('Cập nhật ảnh cửa hàng thành công!');
      await loadShop();
    } catch (error) {
      console.error('Error uploading image:', error);
      toastError('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Chưa có cửa hàng</h3>
              <p className="text-amber-800 mb-4">Bạn cần tạo cửa hàng trước khi có thể quản lý thông tin.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Cửa hàng</h1>
        <p className="text-gray-600">Cập nhật thông tin cửa hàng của bạn</p>
      </div>

      {/* Status Alert */}
      {shop.status !== 'ACTIVE' && (
        <div className={`rounded-lg p-4 ${
          shop.status === 'PENDING' 
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {shop.status === 'PENDING' ? (
              <>
                <AlertCircle size={20} />
                <span className="font-medium">Cửa hàng đang chờ duyệt</span>
              </>
            ) : (
              <>
                <AlertCircle size={20} />
                <span className="font-medium">Cửa hàng bị từ chối hoặc đã khóa</span>
              </>
            )}
          </div>
        </div>
      )}

      {shop.status === 'ACTIVE' && shop.isActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle size={20} />
            <span className="font-medium">Cửa hàng đang hoạt động bình thường</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Shop Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện cửa hàng</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={shop.logo || shop.image_cover || 'https://via.placeholder.com/150'}
                alt="Shop logo"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload size={18} />
                {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">JPG, PNG tối đa 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Store size={16} className="inline mr-1" />
              Tên cửa hàng *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-1" />
              Số điện thoại *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả cửa hàng</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả về cửa hàng của bạn..."
            />
          </div>
        </div>

        {/* Address */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Địa chỉ cửa hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Số nhà / Đường</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phường / Xã</label>
              <input
                type="text"
                name="address.ward"
                value={formData.address.ward}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quận / Huyện</label>
              <input
                type="text"
                name="address.district"
                value={formData.address.district}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh / Thành phố</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã bưu điện</label>
              <input
                type="text"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={loadShop}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerShopManagement;

