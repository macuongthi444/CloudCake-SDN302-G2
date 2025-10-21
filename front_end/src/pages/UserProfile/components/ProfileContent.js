import React, { useState, useEffect } from 'react';
import ShopAvatar from '../../../assets/ShopAvatar.png';
import ApiService from '../../../services/ApiService';
import AuthService from '../../../services/AuthService';
import { MapPin } from 'lucide-react';

// Country options for address
const countryOptions = [
  { name: 'Việt Nam', code: '+84' },
  { name: 'Hoa Kỳ', code: '+1' },
  { name: 'Anh', code: '+44' },
  { name: 'Úc', code: '+61' },
  { name: 'Singapore', code: '+65' },
  { name: 'Nhật Bản', code: '+81' },
  { name: 'Hàn Quốc', code: '+82' },
  { name: 'Trung Quốc', code: '+86' },
  { name: 'Thái Lan', code: '+66' },
];

// Profile Content Component
const ProfileContent = ({ profile, handleInputChange, handleBirthDateChange, updateProfile }) => {
    // Thêm state để theo dõi trạng thái chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    // State cho loading
    const [loading, setLoading] = useState(false);
    // State cho thông báo lỗi và thành công
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // State cho địa chỉ đầu tiên của người dùng
    const [primaryAddress, setPrimaryAddress] = useState(null);
    const [addressLoading, setAddressLoading] = useState(false);

    // State cho dữ liệu tỉnh/quận/phường
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    
    // State cho các trường select của địa chỉ
    const [addressForm, setAddressForm] = useState({
        provinceId: '0',
        provinceName: '',
        districtId: '0',
        districtName: '',
        wardId: '0',
        wardName: '',
        address: '',
        address_line2: '',
        phoneNumber: '',
        countryCode: '+84',
        country: 'Việt Nam'
    });

    // Thêm state để kiểm tra xem địa chỉ có thay đổi hay không
    const [addressModified, setAddressModified] = useState(false);

    // Lưu trữ giá trị ban đầu để có thể hủy thay đổi
    const [initialProfile, setInitialProfile] = useState(null);
    const [initialAddress, setInitialAddress] = useState(null);
    const [initialAddressForm, setInitialAddressForm] = useState(null);

    // Lấy userId từ thông tin người dùng đã đăng nhập
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?._id || currentUser?.id || currentUser?.userId || "";

    // Helper function to parse phone number
    const parsePhoneNumber = (phone) => {
        if (!phone) return { countryCode: '+84', phoneNumber: '' };
        
        // Convert to string and clean up
        let phoneStr = String(phone).trim();
        
        // Check against known country codes
        for (const country of countryOptions) {
            const codeDigits = country.code.replace('+', '');
            if (phoneStr.startsWith(codeDigits)) {
                return {
                    countryCode: country.code,
                    phoneNumber: phoneStr.substring(codeDigits.length),
                    country: country.name
                };
            }
        }
        
        // If no country code matched but starts with 0, assume Vietnam
        if (phoneStr.startsWith('0')) {
            return {
                countryCode: '+84',
                phoneNumber: phoneStr.substring(1),
                country: 'Việt Nam'
            };
        }
        
        // Default case - assume Vietnam phone without country code
        return {
            countryCode: '+84',
            phoneNumber: phoneStr,
            country: 'Việt Nam'
        };
    };
    
    // Helper function to format phone with country code
    const formatPhoneWithCountryCode = (countryCode, phoneNumber) => {
        if (!phoneNumber) return '';
        return countryCode.replace('+', '') + phoneNumber;
    };

    // Fetch danh sách tỉnh/thành phố
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
                const data = await response.json();

                if (data.error === 0) {
                    setProvinces(data.data);
                } else {
                    console.error('Lỗi khi lấy dữ liệu tỉnh/thành phố');
                }
            } catch (error) {
                console.error('Lỗi khi gọi API tỉnh/thành phố:', error);
            }
        };

        fetchProvinces();
    }, []);

    // Phân tích địa chỉ từ chuỗi city để lấy thông tin tỉnh/quận/phường
    const parseAddressComponents = (cityString) => {
        if (!cityString) return { province: '', district: '', ward: '' };
        
        // Địa chỉ thường có định dạng: "phường/xã, quận/huyện, tỉnh/thành phố"
        const parts = cityString.split(', ');
        
        if (parts.length >= 3) {
            return {
                province: parts[parts.length - 1].trim(),
                district: parts[parts.length - 2].trim(),
                ward: parts[parts.length - 3].trim()
            };
        } else if (parts.length === 2) {
            return {
                province: parts[parts.length - 1].trim(),
                district: parts[parts.length - 2].trim(),
                ward: ''
            };
        } else if (parts.length === 1) {
            return {
                province: parts[0].trim(),
                district: '',
                ward: ''
            };
        }
        
        return { province: '', district: '', ward: '' };
    };

    // Fetch địa chỉ đầu tiên của người dùng
    useEffect(() => {
        const fetchPrimaryAddress = async () => {
            if (!userId) return;
            
            try {
                setAddressLoading(true);
                
                // Thử các endpoint khác nhau để lấy danh sách địa chỉ
                const possibleEndpoints = [
                    `/address/list`,
                    `/user-address/list`,
                    `/user-address/user/${userId}`,
                    `/address/user/${userId}`
                ];
                
                let foundAddress = false;
                
                for (const endpoint of possibleEndpoints) {
                    try {
                        const response = await ApiService.get(endpoint);
                        
                        let addresses = [];
                        
                        // Xử lý dữ liệu phản hồi theo cấu trúc
                        if (Array.isArray(response)) {
                            addresses = response;
                        } else if (response && Array.isArray(response.data)) {
                            addresses = response.data;
                        } else if (response && Array.isArray(response.addresses)) {
                            addresses = response.addresses;
                        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
                            addresses = [response];
                        }
                        
                        // Lọc địa chỉ theo userId nếu là endpoint list
                        if (endpoint.includes('/list')) {
                            addresses = addresses.filter(addr => 
                                String(addr.user_id) === String(userId)
                            );
                        }
                        
                        // Nếu có địa chỉ, lấy địa chỉ đầu tiên
                        if (addresses.length > 0) {
                            const address = addresses[0];
                            setPrimaryAddress(address);
                            setInitialAddress(address);
                            
                            // Phân tích địa chỉ để lấy các thành phần
                            const parsedAddress = {
                                address: address.address_line1 || '',
                                address_line2: address.address_line2 || '',
                                country: address.country || 'Việt Nam'
                            };
                            
                            // Phân tích số điện thoại
                            const phoneInfo = parsePhoneNumber(address.phone);
                            
                            // Phân tích thành phần từ city (tỉnh/quận/phường)
                            const addressComponents = parseAddressComponents(address.city);
                            
                            // Cập nhật form address với dữ liệu đã phân tích
                            setAddressForm({
                                address: parsedAddress.address,
                                address_line2: parsedAddress.address_line2,
                                country: parsedAddress.country,
                                provinceName: addressComponents.province,
                                districtName: addressComponents.district,
                                wardName: addressComponents.ward,
                                provinceId: '0',
                                districtId: '0',
                                wardId: '0',
                                countryCode: phoneInfo.countryCode,
                                phoneNumber: phoneInfo.phoneNumber
                            });
                            
                            // Lưu lại form ban đầu
                            setInitialAddressForm({
                                address: parsedAddress.address,
                                address_line2: parsedAddress.address_line2,
                                country: parsedAddress.country,
                                provinceName: addressComponents.province,
                                districtName: addressComponents.district,
                                wardName: addressComponents.ward,
                                provinceId: '0',
                                districtId: '0',
                                wardId: '0',
                                countryCode: phoneInfo.countryCode,
                                phoneNumber: phoneInfo.phoneNumber
                            });
                            
                            // Log để debug
                            console.log('Parsed phone data:', {
                                original: address.phone,
                                countryCode: phoneInfo.countryCode,
                                phoneNumber: phoneInfo.phoneNumber
                            });
                            
                            foundAddress = true;
                            
                            // Nếu có thông tin tỉnh/thành phố và đã tải danh sách provinces
                            if (addressComponents.province && provinces.length > 0) {
                                // Tìm province theo tên
                                const foundProvince = provinces.find(p =>
                                    p.full_name.toLowerCase() === addressComponents.province.toLowerCase()
                                );
                                
                                if (foundProvince) {
                                    setAddressForm(prev => ({
                                        ...prev,
                                        provinceId: foundProvince.id,
                                        provinceName: foundProvince.full_name
                                    }));
                                    
                                    // Tải danh sách quận/huyện
                                    fetchDistricts(foundProvince.id, addressComponents);
                                }
                            }
                            
                            break;
                        }
                    } catch (error) {
                        console.error(`Error fetching addresses from ${endpoint}:`, error);
                    }
                }
                
                if (!foundAddress) {
                    console.log("No addresses found for user");
                }
            } catch (err) {
                console.error("Error fetching primary address:", err);
            } finally {
                setAddressLoading(false);
            }
        };
        
        if (provinces.length > 0) {
            fetchPrimaryAddress();
        }
    }, [userId, provinces]);

    // Xử lý khi nhấn nút Chỉnh sửa
    const handleEdit = () => {
        // Ensure we have the updated phone information
        if (profile.phone) {
            const phoneInfo = parsePhoneNumber(profile.phone);
            setAddressForm(prev => ({
                ...prev,
                countryCode: phoneInfo.countryCode,
                phoneNumber: phoneInfo.phoneNumber
            }));
        }
        
        setInitialProfile({ ...profile }); // Lưu giá trị hiện tại trước khi chỉnh sửa
        setInitialAddress(primaryAddress ? { ...primaryAddress } : null);
        setInitialAddressForm({ ...addressForm });
        setIsEditing(true);
        // Reset thông báo và trạng thái đã sửa đổi địa chỉ
        setError('');
        setSuccess('');
        setAddressModified(false);
    };

    // Xử lý khi nhấn nút Hủy
    const handleCancel = () => {
        // Khôi phục giá trị ban đầu
        if (initialProfile) {
            Object.keys(initialProfile).forEach(key => {
                if (key === 'birthDate') {
                    Object.keys(initialProfile.birthDate).forEach(dateKey => {
                        handleBirthDateChange(dateKey, initialProfile.birthDate[dateKey]);
                    });
                } else {
                    handleInputChange(key, initialProfile[key]);
                }
            });
        }
        
        // Khôi phục địa chỉ ban đầu
        setPrimaryAddress(initialAddress);
        setAddressForm(initialAddressForm || addressForm);
        
        setIsEditing(false);
        // Reset thông báo và trạng thái đã sửa đổi địa chỉ
        setError('');
        setSuccess('');
        setAddressModified(false);
    };

    // Lấy dữ liệu quận/huyện khi chọn tỉnh/thành phố
    const fetchDistricts = async (provinceId, addressComponents = null) => {
        try {
            const response = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
            const data = await response.json();

            if (data.error === 0) {
                setDistricts(data.data);
                
                // Nếu có thông tin quận/huyện từ địa chỉ hiện tại
                if (addressComponents && addressComponents.district) {
                    // Tìm district theo tên
                    const foundDistrict = data.data.find(d => 
                        d.full_name.toLowerCase() === addressComponents.district.toLowerCase()
                    );
                    
                    if (foundDistrict) {
                        setAddressForm(prev => ({
                            ...prev,
                            districtId: foundDistrict.id,
                            districtName: foundDistrict.full_name
                        }));
                        
                        // Tải danh sách phường/xã
                        fetchWards(foundDistrict.id, addressComponents);
                    } else {
                        setWards([]); // Reset danh sách phường/xã nếu không tìm thấy quận/huyện
                    }
                } else {
                    // Nếu không có thông tin quận/huyện, reset các giá trị liên quan
                    setWards([]);
                    setAddressForm(prev => ({
                        ...prev,
                        districtId: '0',
                        districtName: '',
                        wardId: '0',
                        wardName: ''
                    }));
                }
            } else {
                console.error('Lỗi khi lấy dữ liệu quận/huyện');
                setWards([]);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API quận/huyện:', error);
            setWards([]);
        }
    };

    // Lấy dữ liệu phường/xã khi chọn quận/huyện
    const fetchWards = async (districtId, addressComponents = null) => {
        try {
            const response = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
            const data = await response.json();

            if (data.error === 0) {
                setWards(data.data);
                
                // Nếu có thông tin phường/xã từ địa chỉ hiện tại
                if (addressComponents && addressComponents.ward) {
                    // Tìm ward theo tên
                    const foundWard = data.data.find(w => 
                        w.full_name.toLowerCase() === addressComponents.ward.toLowerCase()
                    );
                    
                    if (foundWard) {
                        setAddressForm(prev => ({
                            ...prev,
                            wardId: foundWard.id,
                            wardName: foundWard.full_name
                        }));
                    } else {
                        setAddressForm(prev => ({
                            ...prev,
                            wardId: '0',
                            wardName: ''
                        }));
                    }
                } else {
                    setAddressForm(prev => ({
                        ...prev,
                        wardId: '0',
                        wardName: ''
                    }));
                }
            } else {
                console.error('Lỗi khi lấy dữ liệu phường/xã');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API phường/xã:', error);
        }
    };

    // Xử lý các sự kiện chọn tỉnh/quận/phường
    const handleProvinceChange = (e) => {
        const provinceId = e.target.value;
        const selectedProvince = provinces.find(p => p.id === provinceId);

        setAddressForm({
            ...addressForm,
            provinceId,
            provinceName: selectedProvince ? selectedProvince.full_name : ''
        });
        setAddressModified(true); // Đánh dấu địa chỉ đã thay đổi

        if (provinceId !== '0') {
            fetchDistricts(provinceId);
        } else {
            setDistricts([]);
            setWards([]);
        }
    };

    const handleDistrictChange = (e) => {
        const districtId = e.target.value;
        const selectedDistrict = districts.find(d => d.id === districtId);

        setAddressForm({
            ...addressForm,
            districtId,
            districtName: selectedDistrict ? selectedDistrict.full_name : ''
        });
        setAddressModified(true); // Đánh dấu địa chỉ đã thay đổi

        if (districtId !== '0') {
            fetchWards(districtId);
        } else {
            setWards([]);
        }
    };

    const handleWardChange = (e) => {
        const wardId = e.target.value;
        const selectedWard = wards.find(w => w.id === wardId);

        setAddressForm({
            ...addressForm,
            wardId,
            wardName: selectedWard ? selectedWard.full_name : ''
        });
        setAddressModified(true); // Đánh dấu địa chỉ đã thay đổi
    };

    // Handle country change
    const handleCountryChange = (e) => {
        const selectedCountry = e.target.value;
        // Find the corresponding country code
        const country = countryOptions.find(c => c.name === selectedCountry);
        const countryCode = country ? country.code : '+84'; // Default to Vietnam

        setAddressForm(prev => ({
            ...prev,
            country: selectedCountry,
            countryCode: countryCode
        }));
        setAddressModified(true);
    };

    // Handle phone number change
    const handlePhoneNumberChange = (e) => {
        // Only allow digits
        const value = e.target.value.replace(/\D/g, '');
        
        // Check max length based on country
        const maxLength = getMaxPhoneLength();
        if (value.length <= maxLength) {
            setAddressForm(prev => ({
                ...prev,
                phoneNumber: value
            }));
            
            // Update the profile phone with the formatted number
            const formattedPhone = formatPhoneWithCountryCode(addressForm.countryCode, value);
            handleInputChange('phone', formattedPhone);
        }
        setAddressModified(true);
    };

    // Get maximum phone length based on country
    const getMaxPhoneLength = () => {
        switch (addressForm.country) {
            case 'Việt Nam': return 9; // 9 digits after +84
            case 'Hoa Kỳ': return 10;
            case 'Nhật Bản': return 10;
            case 'Hàn Quốc': return 10;
            case 'Trung Quốc': return 11;
            case 'Singapore': return 8;
            default: return 12; // Default for other countries
        }
    };

    // Hàm xử lý thay đổi thông tin địa chỉ
    const handleAddressFormChange = (e) => {
        const { name, value } = e.target;
        setAddressForm({
            ...addressForm,
            [name]: value
        });
        setAddressModified(true); // Đánh dấu địa chỉ đã thay đổi
    };

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

        // Validate phone number
        if (profile.phone) {
            // Parse the phone to check format
            const phoneInfo = parsePhoneNumber(profile.phone);
            const phoneNumber = phoneInfo.phoneNumber;
            
            // Check minimum length based on country
            const minLength = phoneInfo.country === 'Singapore' ? 8 : 9;
            if (phoneNumber.length < minLength) {
                errors.phone = `Số điện thoại phải có ít nhất ${minLength} chữ số`;
            }
        }

        return { isValid: Object.keys(errors).length === 0, errors };
    };

    // Validate địa chỉ trước khi lưu
    const validateAddress = () => {
        // Nếu không chỉnh sửa địa chỉ hoặc không có địa chỉ hoặc không thay đổi địa chỉ, bỏ qua validation
        if (!primaryAddress || !isEditing || !addressModified) return { isValid: true, errors: {} };
        
        let errors = {};
        
        // Kiểm tra địa chỉ chi tiết
        if (!addressForm.address || addressForm.address.trim().length < 5) {
            errors.address = 'Vui lòng nhập địa chỉ chi tiết (tối thiểu 5 ký tự)';
        }
        
        // Kiểm tra đã chọn đầy đủ địa chỉ chưa
        if (addressForm.provinceId === '0' || addressForm.districtId === '0' || addressForm.wardId === '0') {
            errors.location = 'Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã';
        }
        
        // Check phone number
        if (!addressForm.phoneNumber) {
            errors.phone = 'Vui lòng nhập số điện thoại';
        } else {
            const minLength = addressForm.country === 'Singapore' ? 8 : 9;
            if (addressForm.phoneNumber.length < minLength) {
                errors.phone = `Số điện thoại phải có ít nhất ${minLength} chữ số`;
            }
        }
        
        return { isValid: Object.keys(errors).length === 0, errors };
    };

    // Cập nhật hàm handleSave để dùng validation và cập nhật cả địa chỉ
    const handleSave = async (e) => {
        e.preventDefault();

        // Validate dữ liệu trước khi gửi
        const { isValid, errors } = validateProfileData();
        if (!isValid) {
            const errorMessage = Object.values(errors).join(', ');
            setError(errorMessage);
            return;
        }
        
        // Validate địa chỉ nếu có thay đổi
        const addressValidation = validateAddress();
        if (!addressValidation.isValid) {
            const errorMessage = Object.values(addressValidation.errors).join(', ');
            setError(errorMessage);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Ensure profile.phone is properly formatted
            if (addressForm.phoneNumber) {
                profile.phone = formatPhoneWithCountryCode(addressForm.countryCode, addressForm.phoneNumber);
            }
            
            // Gọi hàm updateProfile để cập nhật thông tin người dùng
            const result = await updateProfile(profile);

            // Chỉ cập nhật địa chỉ nếu có địa chỉ, đang trong chế độ chỉnh sửa và địa chỉ đã được thay đổi
            if (primaryAddress && primaryAddress._id && isEditing && addressModified) {
                try {
                    // Tạo chuỗi địa chỉ đầy đủ từ các thành phần đã chọn
                    const city = `${addressForm.wardName}, ${addressForm.districtName}, ${addressForm.provinceName}`;
                    
                    const updatedAddressData = {
                        address_line1: addressForm.address,
                        address_line2: addressForm.address_line2 || "",
                        city: city,
                        country: addressForm.country,
                        phone: profile.phone, // Use the formatted phone number
                        status: true
                    };
                    
                    // Log the address data being sent
                    console.log("Sending address data:", updatedAddressData);
                    
                    // Thử cập nhật địa chỉ
                    try {
                        await ApiService.put(`/address/edit/${primaryAddress._id}`, updatedAddressData);
                    } catch (apiError) {
                        await ApiService.put(`/user-address/edit/${primaryAddress._id}`, updatedAddressData);
                    }
                    
                    // Cập nhật lại state address
                    setPrimaryAddress({
                        ...primaryAddress,
                        ...updatedAddressData
                    });
                    
                    // Cập nhật lại initial address
                    setInitialAddress({
                        ...primaryAddress,
                        ...updatedAddressData
                    });
                    
                } catch (addressErr) {
                    console.error('Error updating address:', addressErr);
                    setError('Đã cập nhật thông tin cá nhân nhưng không thể cập nhật địa chỉ');
                    setIsEditing(false);
                    setLoading(false);
                    return;
                }
            }

            if (result && result.success) {
                setSuccess('Cập nhật thông tin thành công!');
                setIsEditing(false);
                // Reset trạng thái đã sửa đổi địa chỉ
                setAddressModified(false);
            } else {
                setError(result?.error || 'Đã xảy ra lỗi khi cập nhật thông tin.');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra nếu profile chưa được load
    if (!profile) {
        return <div className="p-6">Đang tải thông tin người dùng...</div>;
    }

    // Format địa chỉ đầy đủ để hiển thị
    const getFormattedAddress = () => {
        if (!primaryAddress) return "";
        
        const addressLine1 = primaryAddress.address_line1 || "";
        const addressLine2 = primaryAddress.address_line2 ? `, ${primaryAddress.address_line2}` : "";
        const city = primaryAddress.city ? `, ${primaryAddress.city}` : "";
        
        return `${addressLine1}${addressLine2}${city}`;
    };

    return (
        <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <img src={ShopAvatar} className='w-full h-full' alt="Profile" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Dung lượng file tối đa 1 MB</p>
                    <p className="text-sm text-gray-500">Định dạng: JPEG, PNG</p>
                </div>
            </div>

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
                            <strong>Lưu ý:</strong> Bạn có thể cập nhật họ, tên, số điện thoại và địa chỉ. Email không thể thay đổi.
                            Nếu không muốn thay đổi địa chỉ, bạn có thể để nguyên thông tin địa chỉ hiện tại.
                        </p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Họ</label>
                        <input
                            type="text"
                            value={profile.lastName || ""}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                        <input
                            type="text"
                            value={profile.firstName || ""}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={!isEditing}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                        type="email"
                        value={profile.email || ""}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={true} // Email không được phép thay đổi
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                    {isEditing ? (
                        <div>
                            <div className="flex">
                                <div className="border p-2 rounded-l-md bg-gray-100 flex items-center justify-center min-w-[60px]">
                                    {addressForm.countryCode}
                                </div>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    name="phoneNumber"
                                    placeholder="Số điện thoại"
                                    value={addressForm.phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                    maxLength={getMaxPhoneLength()}
                                    className="border p-2 rounded-r-md w-full"
                                    required
                                />
                            </div>
                            {addressForm.country === 'Việt Nam' && (
                                <p className="text-xs text-gray-500 mt-1">Ví dụ: Đối với số 0987654321, chỉ cần nhập 987654321</p>
                            )}
                        </div>
                    ) : (
                        <input
                            type="tel"
                            value={profile.phone || ""}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled
                        />
                    )}
                </div>

                {/* Thêm phần địa chỉ */}
                <div>
                    <div className="flex items-center mb-2">
                        <MapPin size={16} className="mr-1 text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                    </div>
                    
                    {addressLoading ? (
                        <div className="py-2 text-sm text-gray-500">Đang tải địa chỉ...</div>
                    ) : primaryAddress ? (
                        <div className="space-y-3">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Quốc gia</label>
                                        <select
                                            name="country"
                                            value={addressForm.country}
                                            onChange={handleCountryChange}
                                            className="border p-2 rounded-md w-full"
                                        >
                                            {countryOptions.map(country => (
                                                <option key={country.code} value={country.name}>{country.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label htmlFor="provinceId" className="block text-sm text-gray-600 mb-1">Tỉnh / Thành phố</label>
                                            <select
                                                id="provinceId"
                                                name="provinceId"
                                                value={addressForm.provinceId}
                                                onChange={handleProvinceChange}
                                                className="border p-2 rounded-md w-full"
                                                required={addressModified}
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
                                            <label htmlFor="districtId" className="block text-sm text-gray-600 mb-1">Quận / Huyện</label>
                                            <select
                                                id="districtId"
                                                name="districtId"
                                                value={addressForm.districtId}
                                                onChange={handleDistrictChange}
                                                className="border p-2 rounded-md w-full"
                                                required={addressModified}
                                                disabled={addressForm.provinceId === '0'}
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
                                            <label htmlFor="wardId" className="block text-sm text-gray-600 mb-1">Phường / Xã</label>
                                            <select
                                                id="wardId"
                                                name="wardId"
                                                value={addressForm.wardId}
                                                onChange={handleWardChange}
                                                className="border p-2 rounded-md w-full"
                                                required={addressModified}
                                                disabled={addressForm.districtId === '0'}
                                            >
                                                <option value="0">Chọn Phường/Xã</option>
                                                {wards.map((ward) => (
                                                    <option key={ward.id} value={ward.id}>
                                                        {ward.full_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm text-gray-600 mb-1">Địa chỉ cụ thể</label>
                                        <input
                                            id="address"
                                            type="text"
                                            name="address"
                                            placeholder="Số nhà, tên đường"
                                            value={addressForm.address}
                                            onChange={handleAddressFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            required={addressModified}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="address_line2" className="block text-sm text-gray-600 mb-1">Địa chỉ bổ sung (không bắt buộc)</label>
                                        <input
                                            id="address_line2"
                                            type="text"
                                            name="address_line2"
                                            placeholder="Tòa nhà, số tầng, số phòng, ..."
                                            value={addressForm.address_line2}
                                            onChange={handleAddressFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="border p-3 rounded-md bg-gray-50">
                                    <p className="text-gray-700">{getFormattedAddress()}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {primaryAddress.phone ? `Số điện thoại: ${primaryAddress.phone}` : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border p-3 rounded-md bg-gray-50 text-gray-500">
                            <p>Bạn chưa có địa chỉ nào</p>
                            <a href="/user-profile/addresses" className="text-purple-600 text-sm hover:underline mt-1 inline-block">
                                + Thêm địa chỉ mới
                            </a>
                        </div>
                    )}
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
                                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={loading}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ProfileContent;