import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import AuthService from '../../services/AuthService';
import ApiService from '../../services/ApiService';

const CustomerManagement = () => {
  // State cho dữ liệu người dùng
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage, setUsersPerPage] = useState(5);

  // Filter states
  const [filter, setFilter] = useState({
    all: true,
    active: false,
    inactive: false
  });

  // New state for role filter
  const [roleFilter, setRoleFilter] = useState('all');

  // Sort state
  const [sortOption, setSortOption] = useState('');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roles: ['MEMBER']
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/user/list');
      setUsers(response);
      setTotalUsers(response.length);
      setLoading(false);
    } catch (error) {
      setError('Lỗi khi tải dữ liệu người dùng: ' + error);
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
  };

  // Handle sorting option change
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Format roles correctly
  const formatRoles = (roles) => {
    if (!roles || !Array.isArray(roles)) return 'Thành viên';
    
    // Known role ID mapping (from the screenshot)
    // These will need to be updated with the actual role IDs from your database
    const roleIdMap = {
      // Admin role IDs
      "67c9c76c03bef5536ed80246": "Quản trị viên",
      // Seller role IDs
      "67c9eae4bd4e8f0bd03344b6": "Người bán",
      // Member role IDs
      "67c74b6d60a991d7575a0b34": "Thành viên"
    };
    
    // Format and normalize each role
    const formattedRoles = roles.map(role => {
      // Handle ObjectID string references
      if (typeof role === 'string' && role.length === 24) {
        // Check if we have this ID in our mapping
        if (roleIdMap[role]) {
          return roleIdMap[role];
        }
      }
      
      // Handle object format (with name property)
      if (typeof role === 'object' && role !== null) {
        // Handle when role is directly populated with the actual role object
        if (role.name) {
          if (role.name === 'ADMIN') return 'Quản trị viên';
          if (role.name === 'SELLER') return 'Người bán';
          if (role.name === 'MEMBER') return 'Thành viên';
        }
        
        // Handle when role is populated but has an _id instead of a name
        if (role._id && typeof role._id === 'string' && roleIdMap[role._id]) {
          return roleIdMap[role._id];
        }
      }
      
      // Handle string format with role name (not ID)
      if (typeof role === 'string') {
        if (role.includes('ADMIN')) return 'Quản trị viên';
        if (role.includes('SELLER')) return 'Người bán';
        if (role.includes('MEMBER')) return 'Thành viên';
      }
      
      return 'Thành viên'; // Default to Member for unknown roles
    });
    
    // Filter out null values and remove duplicates
    const uniqueRoles = [...new Set(formattedRoles.filter(role => role !== null))];
    
    return uniqueRoles.join(', ');
  };

  // Check if a user has a specific role
  const userHasRole = (user, roleToCheck) => {
    if (!user.roles || !Array.isArray(user.roles)) return false;
    
    // Known role ID mapping
    const roleIdMap = {
      "admin": ["67c9c76c03bef5536ed80246"], // Admin role IDs
      "seller": ["67c9eae4bd4e8f0bd03344b6"], // Seller role IDs
      "member": ["67c74b6d60a991d7575a0b34"] // Member role IDs
    };
    
    // Get the role IDs to check against
    const roleIdsToCheck = roleIdMap[roleToCheck] || [];
    
    // Check if any of the user's roles match our criteria
    return user.roles.some(role => {
      // Check for string ID
      if (typeof role === 'string' && roleIdsToCheck.includes(role)) {
        return true;
      }
      
      // Check for object with name
      if (typeof role === 'object' && role !== null) {
        if (role.name && role.name.includes(roleToCheck.toUpperCase())) {
          return true;
        }
        
        // Check for object with _id
        if (role._id && typeof role._id === 'string' && roleIdsToCheck.includes(role._id)) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Apply filters and sort to users
  const getFilteredAndSortedUsers = () => {
    // Apply filters first
    let result = [...users];
    
    // Status filter
    if (filter.active) {
      result = result.filter(user => user.status === true);
    } else if (filter.inactive) {
      result = result.filter(user => user.status === false);
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => userHasRole(user, roleFilter));
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower) ||
              (user.email && user.email.toLowerCase().includes(searchLower)) ||
              (user.phone && user.phone.includes(searchTerm));
      });
    }
    
    // Apply sorting
    if (sortOption) {
      switch (sortOption) {
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'name':
          result.sort((a, b) => {
            const nameA = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
            const nameB = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        default:
          break;
      }
    }
    
    return result;
  };

  const filteredAndSortedUsers = getFilteredAndSortedUsers();
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

  // Paginate users
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Handle pagination
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Handle view user detail
  const handleViewUserDetail = (user) => {
    console.log("View user details:", user);
    // We would navigate to a user detail page or open a modal here
  };

  // Handle change user status
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      // Call API to update user status
      await ApiService.put(`/user/edit/${userId}`, {
        status: !currentStatus
      });
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: !currentStatus } : user
      ));
    } catch (error) {
      setError('Lỗi khi cập nhật trạng thái người dùng: ' + error);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await ApiService.delete(`/user/delete/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
      } catch (error) {
        setError('Lỗi khi xóa người dùng: ' + error);
      }
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle role selection
  const handleRoleChange = (e) => {
    const { value } = e.target;
    setNewUser({
      ...newUser,
      roles: [value]
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!newUser.firstName.trim()) {
      errors.firstName = 'Vui lòng nhập tên';
    }
    
    if (!newUser.lastName.trim()) {
      errors.lastName = 'Vui lòng nhập họ';
    }
    
    if (!newUser.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!newUser.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(84|0[3-9])[0-9]{8,9}$/.test(newUser.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!newUser.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(newUser.password)) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      // Prepare data for API
      const userData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        roles: [newUser.roles[0]]  // Make sure roles is formatted correctly
      };

      // Call API to create new user
      const response = await ApiService.post('/auth/signup', userData);
      
      // Add new user to list - set default values for fields not returned from API
      const newUserData = {
        ...response,
        status: true, // Default to active
        roles: [{ name: newUser.roles[0] }] // Ensure roles is properly formatted for display
      };
      
      setUsers([...users, newUserData]);
      
      // Reset form and close modal
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roles: ['MEMBER']
      });
      setShowModal(false);
      
      // Show success message
      alert('Thêm người dùng mới thành công!');
    } catch (error) {
      console.error("Creation error:", error);
      setFormErrors({
        submit: 'Lỗi khi thêm người dùng: ' + error
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  // Count active and inactive users
  const activeUsersCount = users.filter(user => user.status === true).length;
  const inactiveUsersCount = users.filter(user => user.status === false).length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-6 text-gray-600">
          <button 
            className={`${filter.all ? 'text-blue-600 font-medium' : ''}`}
            onClick={() => setFilter({all: true, active: false, inactive: false})}
          >
            Tất cả ( {users.length} )
          </button>
          <button 
            className={`${filter.active ? 'text-blue-600 font-medium' : ''}`}
            onClick={() => setFilter({all: false, active: true, inactive: false})}
          >
            Đang hoạt động ( {activeUsersCount} )
          </button>
          <button 
            className={`${filter.inactive ? 'text-blue-600 font-medium' : ''}`}
            onClick={() => setFilter({all: false, active: false, inactive: true})}
          >
            Bị khóa ( {inactiveUsersCount} )
          </button>
        </div>
      </div>

      {/* Function bar */}
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
        </div>
        <div className="flex items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center mr-4"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} className="mr-1" />
            Thêm người dùng mới
          </button>
          
          {/* Role filter - New addition */}
          <div className="mr-4">
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="seller">Người bán</option>
              <option value="member">Thành viên</option>
            </select>
          </div>
          
          <div className="mr-4">
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="">Sắp xếp theo</option>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              className="border border-gray-300 rounded-md px-3 py-2"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-md shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-medium">
                            {user.firstName ? user.firstName.charAt(0).toUpperCase() : ''}
                            {user.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
                          </span>
                        </div>
                        <span 
                          className="text-sm text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleViewUserDetail(user)}
                        >
                          {user.lastName} {user.firstName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{user.email}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{user.phone}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{formatRoles(user.roles)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{formatDate(user.createdAt)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button 
                          className={`px-2 py-1 rounded text-white ${user.status ? 'bg-orange-500' : 'bg-green-500'}`}
                          onClick={() => handleToggleStatus(user._id, user.status)}
                        >
                          {user.status ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button 
                          className="px-2 py-1 rounded bg-red-500 text-white"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-6 text-center text-gray-500">
                    Không có người dùng nào phù hợp với tìm kiếm
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  className={`p-2 border border-gray-300 rounded-md mr-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  // Calculate which page numbers to show
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }
                  
                  return (
                    <button 
                      key={pageNumber}
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        currentPage === pageNumber
                          ? 'bg-pink-500 text-white'
                          : 'text-gray-700'
                      }`}
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  className={`p-2 border border-gray-300 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="flex items-center text-sm text-gray-700">
                <span>Trang {currentPage} của {totalPages}</span>
                <span className="mx-4">-</span>
                <span>Hiển thị</span>
                <select 
                  className="mx-2 border border-gray-300 rounded p-1"
                  value={usersPerPage}
                  onChange={(e) => {
                    setUsersPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span>/</span>
                <span className="ml-2">{filteredAndSortedUsers.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Thêm người dùng mới</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {formErrors.submit && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formErrors.submit}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={newUser.lastName}
                  onChange={handleInputChange}
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={newUser.firstName}
                  onChange={handleInputChange}
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={newUser.email}
                  onChange={handleInputChange}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className={`w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={newUser.phone}
                  onChange={handleInputChange}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Định dạng: 0912345678 hoặc 84912345678</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className={`w-full px-3 py-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={newUser.password}
                  onChange={handleInputChange}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newUser.roles[0]}
                  onChange={handleRoleChange}
                >
                  <option value="MEMBER">Thành viên</option>
                  <option value="SELLER">Người bán</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thêm người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;