import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from '../../services/AuthService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ""
  });
  const navigate = useNavigate();

  // Kiểm tra nếu người dùng đã đăng nhập thì chuyển hướng
  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }

    // Validate on change for password
    if (name === 'password') {
      validatePasswordStrength(value);
    }

    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, formData[name]);
  };

  const validatePasswordStrength = (password) => {
    let score = 0;
    let message = "";

    if (!password) {
      setPasswordStrength({ score: 0, message: "" });
      return;
    }

    // Minimum 8 characters
    if (password.length >= 8) score += 1;

    // Has letter
    if (/[a-zA-Z]/.test(password)) score += 1;
    
    // Has number
    if (/\d/.test(password)) score += 1;
    
    // Has special character
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determine message based on score
    if (score === 1) message = "Yếu";
    else if (score === 2) message = "Trung bình";
    else if (score === 3) message = "Khá mạnh";
    else if (score === 4) message = "Mạnh";

    setPasswordStrength({ score, message });
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = "Tên không được để trống";
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = "Họ không được để trống";
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = "Số điện thoại không được để trống";
        } else if (!/^(84|0[3-9])[0-9]{8,9}$/.test(value)) {
          newErrors.phone = "Số điện thoại không hợp lệ (0xxxxxxxxx hoặc 84xxxxxxxxx)";
        } else {
          delete newErrors.phone;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Email không hợp lệ";
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = "Mật khẩu không được để trống";
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(value)) {
          newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số";
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};
    let newTouched = {};
    
    // Mark all fields as touched
    Object.keys(formData).forEach(key => {
      newTouched[key] = true;
      if (!validateField(key, formData[key])) {
        isValid = false;
      }
    });
    
    setTouched(newTouched);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setErrors({});
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await AuthService.register(
        formData.firstName,
        formData.lastName,
        formData.phone,
        formData.email,
        formData.password
      );

      // Đăng ký thành công
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error.message || error);
      
      // Get the error message
      const errorMessage = error.message || error;
      
      // Map API error messages to specific form fields
      if (errorMessage.includes("email") && errorMessage.includes("exists")) {
        setErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
      } else if (errorMessage.includes("already exists")) {
        setErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
      } else if (errorMessage.includes("phone")) {
        setErrors(prev => ({
          ...prev,
          phone: errorMessage
        }));
      } else if (errorMessage.includes("password")) {
        setErrors(prev => ({
          ...prev,
          password: errorMessage
        }));
      } else {
        // Display the exact API error message
        setGeneralError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render password strength indicator
  const renderPasswordStrengthIndicator = () => {
    if (!touched.password || !formData.password) return null;
    
    const { score, message } = passwordStrength;
    let colorClass = "bg-gray-200";
    
    if (score === 1) colorClass = "bg-red-500";
    else if (score === 2) colorClass = "bg-yellow-500";
    else if (score === 3) colorClass = "bg-green-300";
    else if (score === 4) colorClass = "bg-green-500";
    
    return (
      <div className="mt-1">
        <div className="h-2 w-full bg-gray-200 rounded">
          <div className={`h-full ${colorClass} rounded`} style={{ width: `${score * 25}%` }}></div>
        </div>
        <p className="text-xs mt-1">{message}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left side with title and plant image */}
      <div className="w-5/12 bg-green-600 flex items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10">
          <h1 className="text-white text-6xl font-bold leading-tight">
            The Real
            <br />
            Options On
            <br />
            Customers
          </h1>
        </div>
        <img 
          src="https://cellphones.com.vn/sforum/wp-content/uploads/2023/12/hinh-nen-xanh-la-2.jpg" 
          alt="Decorative plants" 
          className="absolute right-0 bottom-0 w-3/4 h-auto opacity-80"
        />
      </div>

      {/* Right side with registration form */}
      <div className="w-7/12 flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          <h2 className="text-3xl font-bold text-green-600 mb-8">
            Đăng ký tài khoản
          </h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {generalError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1">
                <span className="font-medium">
                  Họ <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Nhập họ"
                className={`w-full px-3 py-2 border ${touched.lastName && errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.lastName && errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block mb-1">
                <span className="font-medium">
                  Tên <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Nhập tên"
                className={`w-full px-3 py-2 border ${touched.firstName && errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.firstName && errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block mb-1">
                <span className="font-medium">
                  Số điện thoại <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Nhập số điện thoại"
                className={`w-full px-3 py-2 border ${touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng: 0912345678 hoặc 84912345678</p>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block mb-1">
                <span className="font-medium">
                  Email <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Nhập email"
                className={`w-full px-3 py-2 border ${touched.email && errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block mb-1">
                <span className="font-medium">
                  Mật khẩu <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                className={`w-full px-3 py-2 border ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {renderPasswordStrengthIndicator()}
              <p className="text-xs text-gray-500 mt-1">
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số
              </p>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : "Đăng ký"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="mt-1">
              <a href="/login" className="text-green-600 hover:underline text-sm">
                Bạn đã có tài khoản? Đăng nhập ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;