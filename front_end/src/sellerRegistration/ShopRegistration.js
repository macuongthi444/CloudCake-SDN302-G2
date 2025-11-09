import React, { useState, useEffect } from 'react';
import {
  Store, Upload, Package,  Loader,  CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';

const ShopRegistration = () => {
  const navigate = useNavigate();

  // CHỈ GIỮ LẠI ĐÚNG CÁC TRƯỜNG TRONG MODEL
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      district: '',
      ward: '',
      postalCode: ''
    },
    logo: null,
    coverImage: null,
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    },
    openingHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '08:00', close: '12:00' },
      sunday: { open: '', close: '' }
    }
  });

  // File preview
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Step & UI
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  // Fetch user + categories
  useEffect(() => {
    const init = async () => {
      if (!AuthService.isLoggedIn()) {
        navigate('/login', { state: { from: '/shop/register' } });
        return;
      }

      const user = AuthService.getCurrentUser();
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        phone: user.phone || ''
      }));

      try {
        setLoading(true);
        const cats = await ApiService.get('/category/list', false);
        setCategories(cats || []);
      } catch (err) {
        setCategories([
          { _id: "1", name: 'Bánh Sinh Nhật', count: 14 },
          { _id: "2", name: 'Bánh Mì Ngọt', count: 10 },
          { _id: "3", name: 'Bánh Kem', count: 7 },
          { _id: "4", name: 'Bánh Tart & Pie', count: 5 },
          { _id: "5", name: 'Bánh Cupcake', count: 8 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, [child]: value }
        }));
      } else if (parent === 'bankAccount') {
        setFormData(prev => ({
          ...prev,
          bankAccount: { ...prev.bankAccount, [child]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // File upload
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files[0]) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);

    if (name === 'logo') {
      setLogoPreview(preview);
      setFormData(prev => ({ ...prev, logo: file }));
    } else if (name === 'coverImage') {
      setCoverPreview(preview);
      setFormData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const removeImage = (field) => {
    if (field === 'logo') {
      setLogoPreview(null);
      setFormData(prev => ({ ...prev, logo: null }));
    } else if (field === 'coverImage') {
      setCoverPreview(null);
      setFormData(prev => ({ ...prev, coverImage: null }));
    }
  };

  // Upload image
  const uploadImage = async (file, field, shopId) => {
    if (!file || !shopId) return null;
    const form = new FormData();
    form.append('image', file);
    form.append('field', field);
    const res = await ApiService.uploadFile(`/shop/upload/${shopId}`, form);
    return res?.[field] || null;
  };

  // Submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setProgressPercent(10);
    setProgressStatus('Đang tạo cửa hàng...');

    try {
      const shopData = {
        ...formData,
        logo: undefined,
        coverImage: undefined
      };

      setProgressPercent(30);
      const res = await ApiService.post('/shop/create', shopData);
      const shopId = res?.shop?._id;
      if (!shopId) throw new Error('Tạo shop thất bại');

      setProgressStatus('Đang tải ảnh...');
      setProgressPercent(60);

      if (formData.logo) {
        await uploadImage(formData.logo, 'logo', shopId);
      }
      if (formData.coverImage) {
        await uploadImage(formData.coverImage, 'coverImage', shopId);
      }

      setProgressStatus('Lưu danh mục...');
      setProgressPercent(80);
      if (selectedCategories.length > 0) {
        await ApiService.post(`/shop-categories/${shopId}`, { categoryIds: selectedCategories });
      }

      setProgressPercent(100);
      setProgressStatus('Thành công!');
      setSuccess(true);

      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedCategories.length === 0) {
      setError('Vui lòng chọn ít nhất 1 danh mục');
      return;
    }
    if (currentStep === 2) {
      const required = ['name', 'phone', 'email', 'address.street', 'address.city', 'address.district', 'address.ward'];
      const missing = required.filter(field => {
        if (field.includes('.')) {
          const [p, c] = field.split('.');
          return !formData[p][c];
        }
        return !formData[field];
      });
      if (missing.length > 0) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
       const phoneRegex = /^(0[3-9])[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Số điện thoại không hợp lệ. Phải có 10 chữ số và bắt đầu bằng 0');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Email không hợp lệ');
        return;
      }
    }
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
    else handleSubmit();
  };

  // Render helpers
  const ProgressBar = ({ percent, status }) => percent > 0 && (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-green-600">{status}</span>
        <span className="text-sm font-bold">{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex justify-center gap-8 mb-10">
      {[
        { n: 1, title: 'Danh mục', icon: Package },
        { n: 2, title: 'Thông tin', icon: Store },
        { n: 3, title: 'Hoàn tất', icon: CheckCircle }
      ].map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= s.n ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
            <s.icon size={24} />
          </div>
          {i < 2 && <div className={`w-24 h-1 ${currentStep > s.n ? 'bg-green-600' : 'bg-gray-300'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-700">Đăng ký bán hàng</h1>
        <p className="text-green-600 mt-2">Chỉ 3 bước để bắt đầu kinh doanh!</p>
      </div>

      <StepIndicator />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-green-100 border border-green-500 text-green-700 px-6 py-8 rounded-lg text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold">Đăng ký thành công!</h2>
          <p>Chúng tôi sẽ xét duyệt trong 24-48h. Chuyển về trang chủ...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Bước 1: Danh mục */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-6">Chọn danh mục kinh doanh</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <div
                    key={cat._id}
                    onClick={() => {
                      setSelectedCategories(prev =>
                        prev.includes(cat._id)
                          ? prev.filter(id => id !== cat._id)
                          : [...prev, cat._id]
                      );
                    }}
                    className={`border-2 rounded-lg p-6 text-center cursor-pointer transition-all
                      ${selectedCategories.includes(cat._id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                      }`}
                  >
                    <Package size={40} className="mx-auto mb-2 text-green-600" />
                    <p className="font-medium">{cat.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bước 2: Thông tin shop */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-green-700">Thông tin cửa hàng</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên cửa hàng *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả cửa hàng" rows={3} className="px-4 py-3 border-2 border-green-500 rounded-lg md:col-span-2" />
              </div>

              <div>
                <h3 className="font-bold text-green-700 mb-4">Địa chỉ</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input name="address.street" value={formData.address.street} onChange={handleChange} placeholder="Đường, số nhà *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                  <input name="address.ward" value={formData.address.ward} onChange={handleChange} placeholder="Phường/Xã *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                  <input name="address.district" value={formData.address.district} onChange={handleChange} placeholder="Quận/Huyện *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                  <input name="address.city" value={formData.address.city} onChange={handleChange} placeholder="Tỉnh/Thành phố *" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                  <input name="address.postalCode" value={formData.address.postalCode} onChange={handleChange} placeholder="Mã bưu điện" className="px-4 py-3 border-2 border-green-500 rounded-lg" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block font-bold text-green-700 mb-3">Logo cửa hàng</label>
                  <div className="border-2 border-dashed border-green-500 rounded-lg p-8 text-center cursor-pointer" onClick={() => document.getElementById('logo').click()}>
                    {logoPreview ? <img src={logoPreview} alt="logo" className="mx-auto max-h-40" /> : <Upload size={48} className="mx-auto text-green-600" />}
                    <input id="logo" type="file" name="logo" onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-green-700 mb-3">Ảnh bìa</label>
                  <div className="border-2 border-dashed border-green-500 rounded-lg p-8 text-center cursor-pointer" onClick={() => document.getElementById('cover').click()}>
                    {coverPreview ? <img src={coverPreview} alt="cover" className="mx-auto max-h-40" /> : <Upload size={48} className="mx-auto text-green-600" />}
                    <input id="cover" type="file" name="coverImage" onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bước 3: Xác nhận */}
          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-700 mb-6">Xác nhận đăng ký</h2>
              <div className="bg-green-50 rounded-lg p-8 max-w-2xl mx-auto">
                <CheckCircle size={80} className="mx-auto text-green-600 mb-4" />
                <p className="text-lg">Bạn đã hoàn tất thông tin cửa hàng!</p>
                <p className="text-gray-600 mt-4">Sau khi gửi, chúng tôi sẽ xét duyệt trong vòng 24-48 giờ.</p>
              </div>
              {progressPercent > 0 && <ProgressBar percent={progressPercent} status={progressStatus} />}
            </div>
          )}

          <div className="flex justify-between mt-12">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-full hover:bg-green-50"
              disabled={currentStep === 1}
            >
              Quay lại
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center gap-2"
            >
              {loading ? <Loader className="animate-spin" /> : null}
              {currentStep === 3 ? 'Gửi đăng ký' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRegistration;