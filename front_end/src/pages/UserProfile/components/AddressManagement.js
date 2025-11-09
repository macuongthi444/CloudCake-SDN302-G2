import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, X } from 'lucide-react';
import AddressService from '../../../services/AddressService';
import { useAuth } from '../../Login/context/AuthContext';
import { toastSuccess, toastError } from '../../../utils/toast';

const AddressManagement = () => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    ward: '',
    postalCode: '',
    phone: '',
    country: 'Vietnam'
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('0');
  const [selectedDistrict, setSelectedDistrict] = useState('0');
  const [selectedWard, setSelectedWard] = useState('0');

  useEffect(() => {
    if (currentUser?.id) {
      loadAddresses();
      loadProvinces();
    }
  }, [currentUser]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await AddressService.getAddresses(currentUser.id);
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toastError('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
      const data = await response.json();
      if (data.error === 0) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  };

  const loadDistricts = async (provinceId) => {
    try {
      const response = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
      const data = await response.json();
      if (data.error === 0) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadWards = async (districtId) => {
    try {
      const response = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
      const data = await response.json();
      if (data.error === 0) {
        setWards(data.data);
      }
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const handleCreateClick = () => {
    setEditingAddress(null);
    setFormData({
      address_line1: '',
      address_line2: '',
      city: '',
      district: '',
      ward: '',
      postalCode: '',
      phone: '',
      country: 'Vietnam'
    });
    setSelectedProvince('0');
    setSelectedDistrict('0');
    setSelectedWard('0');
    setDistricts([]);
    setWards([]);
    setShowModal(true);
    // Scroll to top when modal opens
    setTimeout(() => {
      const modalContent = document.querySelector('.modal-content-scroll');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  };

  const handleEditClick = (address) => {
    setEditingAddress(address);
    setFormData({
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      district: address.district || '',
      ward: address.ward || '',
      postalCode: address.postalCode || '',
      phone: address.phone || '',
      country: address.country || 'Vietnam'
    });
    
    // Parse city to get province/district/ward if needed
    if (address.city) {
      const parts = address.city.split(', ');
      if (parts.length >= 3) {
        const provinceName = parts[parts.length - 1].trim();
        const districtName = parts[parts.length - 2].trim();
        const wardName = parts[parts.length - 3].trim();
        
        // Find and set province
        const province = provinces.find(p => p.full_name === provinceName);
        if (province) {
          setSelectedProvince(province.id);
          loadDistricts(province.id).then(() => {
            const district = districts.find(d => d.full_name === districtName);
            if (district) {
              setSelectedDistrict(district.id);
              loadWards(district.id);
            }
          });
        }
      }
    }
    
    setShowModal(true);
    // Scroll to top when modal opens
    setTimeout(() => {
      const modalContent = document.querySelector('.modal-content-scroll');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  };

  const handleDeleteClick = async (address) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    try {
      await AddressService.deleteAddress(address._id);
      await loadAddresses();
      toastSuccess('Xóa địa chỉ thành công');
    } catch (error) {
      toastError('Không thể xóa địa chỉ');
    }
  };

  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedDistrict('0');
    setSelectedWard('0');
    setDistricts([]);
    setWards([]);
    if (provinceId !== '0') {
      loadDistricts(provinceId);
    }
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard('0');
    setWards([]);
    if (districtId !== '0') {
      loadWards(districtId);
    }
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address_line1 || !formData.phone) {
      toastError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const provinceName = provinces.find(p => p.id === selectedProvince)?.full_name || '';
      const districtName = districts.find(d => d.id === selectedDistrict)?.full_name || '';
      const wardName = wards.find(w => w.id === selectedWard)?.full_name || '';
      
      const city = `${wardName}${wardName && districtName ? ', ' : ''}${districtName}${districtName && provinceName ? ', ' : ''}${provinceName}`.trim();
      
      const addressData = {
        user_id: currentUser.id,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || '',
        city: city || formData.city,
        district: districtName || formData.district,
        ward: wardName || formData.ward,
        postalCode: formData.postalCode || '',
        phone: formData.phone,
        country: formData.country
      };

      if (editingAddress) {
        await AddressService.updateAddress(editingAddress._id, addressData);
        toastSuccess('Cập nhật địa chỉ thành công');
      } else {
        await AddressService.createAddress(addressData);
        toastSuccess('Thêm địa chỉ thành công');
      }

      setShowModal(false);
      await loadAddresses();
    } catch (error) {
      toastError(editingAddress ? 'Không thể cập nhật địa chỉ' : 'Không thể thêm địa chỉ');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Địa chỉ nhận hàng</h2>
          <p className="text-gray-600 mt-1">Quản lý địa chỉ giao hàng của bạn</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus size={20} />
          Thêm địa chỉ mới
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có địa chỉ nào</h3>
          <p className="text-gray-600 mb-6">Thêm địa chỉ để có thể nhận hàng nhanh chóng</p>
          <button
            onClick={handleCreateClick}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address._id} className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Địa chỉ {addresses.indexOf(address) + 1}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(address)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Chỉnh sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(address)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                {address.city && <p>{address.city}</p>}
                {address.phone && <p className="text-gray-600">📞 {address.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl modal-content-scroll" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh / Thành phố *
                </label>
                <select
                  value={selectedProvince}
                  onChange={handleProvinceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                >
                  <option value="0">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận / Huyện *
                </label>
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  disabled={selectedProvince === '0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100"
                  required
                >
                  <option value="0">Chọn Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phường / Xã *
                </label>
                <select
                  value={selectedWard}
                  onChange={handleWardChange}
                  disabled={selectedDistrict === '0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100"
                  required
                >
                  <option value="0">Chọn Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ cụ thể (Số nhà, tên đường) *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                  placeholder="Ví dụ: 123 Đường ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ bổ sung (Tòa nhà, số tầng, số phòng)
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Ví dụ: Tòa nhà XYZ, Tầng 5, Phòng 501"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                  placeholder="Ví dụ: 0987654321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã bưu điện
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Ví dụ: 700000"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingAddress ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManagement;

