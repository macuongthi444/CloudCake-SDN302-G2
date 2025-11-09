import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Menu,
    Search,
    User,
    Heart,
    ShoppingCart,
    Globe,
    PiggyBank,
    ChevronRight,
    LogOut,
    MessageSquare,
    Package,
    MapPin,
    Lock,
    UserCircle,
    Store
} from 'lucide-react';

import logo from '../assets/Logo.jpg';
import AuthService from '../services/AuthService';
import ApiService from '../services/ApiService';

import headerBg from '../assets/Header.jpg';

const flashingAnimation = `
@keyframes flash {
  0%, 100% { 
    color: #ff3333; 
    transform: scale(1);
  }
  25% { 
    color: #ff0000; 
    transform: scale(1.05);
  }
  50% { 
    color: #ffcc00; 
    transform: scale(1);
  }
  75% { 
    color: #ff3333; 
    transform: scale(1.05);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes trainEffect {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  10% {
    transform: translateX(-70%);
    opacity: 1;
  }
  25% {
    transform: translateX(0%);
    opacity: 1;
  }
  45% {
    transform: translateX(0%);
    opacity: 1;
  }
  65% {
    transform: translateX(70%);
    opacity: 1;
  }
  75% {
    transform: translateX(70%);
    opacity: 0;
  }
  90% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% { 
    transform: translateX(100%);
    opacity: 0;
  }
}
.navbar-container {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-logo {
  position: relative;
  margin-left: -100px; 
}

.promotion-container {
  position: relative;
  overflow: hidden;
  width: 340px;
  margin-left: auto;
}

.flashing-text {
  animation: flash 2s infinite, bounce 1.5s infinite, trainEffect 10s linear infinite;
  font-weight: bold;
  background-size: 200% 200%;
  color: white;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: visible;
  position: relative;
  min-width: 340px;
}

.flashing-text:hover {
  background-position: right center;
  transform: scale(1.05);
  animation-play-state: paused;
}

.piggy-bank-icon {
  animation: bounce 1.5s infinite;
  display: inline-block;
}

.user-dropdown {
  max-height: 400px;
  overflow-y: auto;
  z-index: 1900;
}
`;

const Header = () => {
    const navigate = useNavigate();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [language, setLanguage] = useState('Vietnamese');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesSidebarOpen, setIsCategoriesSidebarOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn());
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const categoriesButtonRef = useRef(null);
    const userDropdownRef = useRef(null);
    const userButtonRef = useRef(null);

    
    const userId = currentUser?.id || currentUser?._id || "";

    useEffect(() => {
        if (isLoggedIn) {
            fetchCartTotal();
        } else {
            setCartTotal(0);
        }
    }, [isLoggedIn, userId]);

    useEffect(() => {
        if (isLoggedIn && isCartOpen) {
            fetchCartTotal();
        }
    }, [isCartOpen]);

   

    useEffect(() => {
        const handleStorageChange = () => {
            const user = AuthService.getCurrentUser();
            const loggedIn = AuthService.isLoggedIn();
            setIsLoggedIn(loggedIn);
            setCurrentUser(user);
            console.log('Header detected auth change:', { loggedIn, userRoles: user?.roles });
        };
        window.addEventListener('storage', handleStorageChange);
        handleStorageChange();
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getUserRoleStrings = () => {
        if (!currentUser) return [];
        const candidates = [];
        // Common shapes
        if (Array.isArray(currentUser.roles)) candidates.push(...currentUser.roles);
        if (Array.isArray(currentUser.authorities)) candidates.push(...currentUser.authorities);
        if (currentUser.role) candidates.push(currentUser.role);
        if (currentUser.roleName) candidates.push(currentUser.roleName);
        if (currentUser.roleNames) candidates.push(...(Array.isArray(currentUser.roleNames) ? currentUser.roleNames : [currentUser.roleNames]));
        // Normalize to strings
        const strings = candidates.map(r => {
            if (!r) return '';
            if (typeof r === 'string') return r;
            if (typeof r === 'object' && r.name) return r.name;
            if (typeof r === 'object' && r.role) return r.role;
            return String(r);
        });
        return strings.filter(Boolean);
    };

    const hasPermissionString = (perm) => {
        const p = currentUser?.permissions;
        if (!p) return false;
        if (typeof p === 'string') return p.toLowerCase().includes(perm);
        if (Array.isArray(p)) return p.some(x => String(x).toLowerCase().includes(perm));
        return false;
    };

    const isSeller = () => {
        if (!isLoggedIn || !currentUser) return false;
        const roleStrings = getUserRoleStrings().map(r => r.toUpperCase());
        const hasSellerRole = roleStrings.some(up => up === 'SELLER' || up === 'ROLE_SELLER' || up.includes('SELLER'));
        const hasSellerPermission = hasPermissionString('sell');
        return hasSellerRole || hasSellerPermission;
    };

    const isAdmin = () => {
        if (!isLoggedIn || !currentUser) return false;
        const roleStrings = getUserRoleStrings().map(r => r.toUpperCase());
        const hasAdminRole = roleStrings.some(up => up === 'ADMIN' || up === 'ROLE_ADMIN' || up.includes('ADMIN'));
        const hasAdminPermission = hasPermissionString('delete');
        return hasAdminRole || hasAdminPermission;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price).replace('₫', 'đ');
    };

    const fetchCartTotal = async () => {
        if (!userId) {
            setCartTotal(0);
            return;
        }
        try {
            const response = await ApiService.get(`/cart/user/${userId}`);
            if (response && response.items && response.items.length > 0) {
                const itemsWithCompleteVariants = await ensureCompleteVariantInfo(response.items);
                const total = itemsWithCompleteVariants.reduce((sum, item) => {
                    if (item.variant_id && typeof item.variant_id === 'object' && item.variant_id.price) {
                        return sum + (item.variant_id.price * item.quantity);
                    }
                    const price = item.product_id && typeof item.product_id === 'object'
                        ? (item.product_id.discounted_price || item.product_id.price || 0)
                        : 0;
                    return sum + price * item.quantity;
                }, 0);
                setCartTotal(total);
            } else {
                setCartTotal(0);
            }
        } catch (error) {
            console.error('Error fetching cart total:', error);
            setCartTotal(0);
        }
    };

    const ensureCompleteVariantInfo = async (items) => {
        const updatedItems = [...items];
        for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            if (item.variant_id && (typeof item.variant_id === 'string' || !item.variant_id.attributes)) {
                const productId = typeof item.product_id === 'object'
                    ? item.product_id._id
                    : item.product_id;
                const variantId = typeof item.variant_id === 'string'
                    ? item.variant_id
                    : item.variant_id._id;
                if (productId && variantId) {
                    try {
                        const variants = await ApiService.get(`/product-variant/product/${productId}`, false);
                        const fullVariant = variants.find(v => v._id === variantId);
                        if (fullVariant) {
                            updatedItems[i] = { ...item, variant_id: fullVariant };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch complete variant data for product ${productId}:`, error);
                    }
                }
            }
        }
        return updatedItems;
    };

    const toggleCategoriesSidebar = () => {
        setIsCategoriesSidebarOpen(!isCategoriesSidebarOpen);
    };

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = () => {
        AuthService.logout();
        setIsUserDropdownOpen(false);
        setIsLoggedIn(false);
        setCurrentUser(null);
        navigate('/');
        window.location.reload();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userDropdownRef.current &&
                !userDropdownRef.current.contains(event.target) &&
                userButtonRef.current &&
                !userButtonRef.current.contains(event.target)
            ) {
                setIsUserDropdownOpen(false);
            }
        };
        if (isUserDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserDropdownOpen]);

    return (
        <div
            className="bg-cover bg-center bg-no-repeat shadow-sm relative"
            style={{ backgroundImage: `url(${headerBg})`, minHeight: '220px', zIndex: 1000 }}
        >
            <div className="bg-white bg-opacity-80 shadow-sm relative">
                <style>{flashingAnimation}</style>
                <nav
                    className="absolute top-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 shadow px-4 py-2 rounded-md max-w-6xl w-full"
                    style={{ zIndex: 1800 }}
                >
                    <div className="flex items-center justify-between">
                        <Link to="/" className="navbar-logo relative">
                            <img src={logo} alt="CloudCake" className="w-28 h-16 object-contain scale-125" />
                        </Link>
                        <div className="flex items-center justify-between mt-2 space-x-6 text-sm px-8">
                            <Link to="/introduction" className="hover:text-purple-600 font-semibold">Giới Thiệu</Link>
                            <Link to="/products" className="hover:text-purple-600 font-semibold">Sản phẩm</Link>
                            {!isSeller() && (
                                <Link to="/register" className="text-red-500 font-semibold hover:text-red-600">
                                    Đăng ký bán hàng
                                </Link>
                            )}
                        </div>
                        <div className="flex-grow flex items-center space-x-4 px-4">
                            <form onSubmit={handleSearch} className="flex-grow relative w-2/5">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    aria-label="Tìm kiếm sản phẩm"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-0 top-0 bottom-0 px-4 bg-[#2E7D32] text-white rounded-r-md hover:bg-purple-700"
                                    aria-label="Tìm kiếm"
                                >
                                    <Search size={20} />
                                </button>
                            </form>
                        </div>
                        <div className="flex items-center space-x-12">
                            <div className="relative">
                                {isLoggedIn ? (
                                    <button
                                        ref={userButtonRef}
                                        className="flex flex-col items-center text-gray-600 hover:text-purple-600 text-xs relative"
                                        onClick={toggleUserDropdown}
                                        aria-label="Menu tài khoản"
                                        aria-expanded={isUserDropdownOpen}
                                    >
                                        <User size={24} />
                                        <span>Tài khoản</span>
                                        {unreadMessageCount > 0 && (
                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                            </div>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className="flex flex-col items-center text-gray-600 hover:text-purple-600 text-xs"
                                        onClick={() => navigate('/login')}
                                        aria-label="Đăng nhập"
                                    >
                                        <User size={24} />
                                        <span>Đăng nhập</span>
                                    </button>
                                )}
                                {isLoggedIn && isUserDropdownOpen && (
                                    <div
                                        ref={userDropdownRef}
                                        className="absolute user-dropdown right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border"
                                        role="menu"
                                    >
                                        <div className="px-4 py-2 border-b">
                                            <div className="font-medium text-gray-900">{currentUser?.email}</div>
                                        </div>
                                        <Link
                                            to="/user-profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <UserCircle size={16} className="mr-2" />
                                            Tài khoản của tôi
                                        </Link>
                                        <Link
                                            to="/user-profile/orders"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Package size={16} className="mr-2" />
                                            Đơn mua
                                        </Link>
                                        <Link
                                            to="/user-profile/messages"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center relative"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <MessageSquare size={16} className="mr-2" />
                                            Tin nhắn
                                            {unreadMessageCount > 0 && (
                                                <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                </div>
                                            )}
                                        </Link>
                                        <Link
                                            to="/user-profile/addresses"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <MapPin size={16} className="mr-2" />
                                            Địa chỉ nhận hàng
                                        </Link>
                                        <Link
                                            to="/user-profile/followed-shops"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Store size={16} className="mr-2" />
                                            Cửa hàng đã theo dõi
                                        </Link>
                                        <Link
                                            to="/user-profile/password"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Lock size={16} className="mr-2" />
                                            Đổi mật khẩu
                                        </Link>
                                        {isSeller() && (
                                            <Link
                                                to="/seller"
                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <Store size={16} className="mr-2" />
                                                Seller Dashboard
                                            </Link>
                                        )}
                                        {isAdmin() && (
                                            <Link
                                                to="/admin"
                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <Store size={16} className="mr-2" />
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <div className="border-t mt-1">
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsUserDropdownOpen(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                            >
                                                <LogOut size={16} className="mr-2" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    id="cartbutton"
                                    className="cartbutton flex flex-col items-center text-gray-600 hover:text-purple-600 text-xs"
                                    onClick={() => navigate('/cart')}
                                    aria-label="Mở giỏ hàng"
                                >
                                    <ShoppingCart size={24} />
                                    <span>Giỏ hàng</span>
                                </button>
                                <div className="flex flex-col items-center text-gray-600 text-xs">
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default Header;
                                              