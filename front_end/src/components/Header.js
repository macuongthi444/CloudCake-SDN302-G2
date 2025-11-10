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
import { useCart } from '../pages/Login/context/CartContext';

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
    const cartContext = useCart();
    // Ensure cartContext is always an object (fallback from useCart should handle this, but double-check)
    const cart = (cartContext && typeof cartContext === 'object' && cartContext.cart) ? cartContext.cart : null;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
    const [language, setLanguage] = useState('Vietnamese');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesSidebarOpen, setIsCategoriesSidebarOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn());
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const categoriesButtonRef = useRef(null);
    const userDropdownRef = useRef(null);
    const userButtonRef = useRef(null);
    const cartDropdownRef = useRef(null);
    const cartButtonRef = useRef(null);
    const mobileMenuRef = useRef(null);

    
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

    // Close cart dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                cartDropdownRef.current &&
                !cartDropdownRef.current.contains(event.target) &&
                cartButtonRef.current &&
                !cartButtonRef.current.contains(event.target)
            ) {
                setIsCartDropdownOpen(false);
            }
        };

        if (isCartDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCartDropdownOpen]);

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
                    className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 shadow px-2 sm:px-4 py-2 rounded-md max-w-6xl w-[95%] sm:w-full"
                    style={{ zIndex: 1800 }}
                >
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:text-purple-600"
                            aria-label="Toggle menu"
                        >
                            <Menu size={24} />
                        </button>

                        <Link to="/" className="navbar-logo relative flex-shrink-0">
                            <img src={logo} alt="CloudCake" className="w-20 h-12 sm:w-28 sm:h-16 object-contain scale-125" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center justify-between mt-2 space-x-4 xl:space-x-6 text-sm px-4 xl:px-8">
                            <Link to="/introduction" className="hover:text-purple-600 font-semibold whitespace-nowrap">Giới Thiệu</Link>
                            <Link to="/products" className="hover:text-purple-600 font-semibold whitespace-nowrap">Sản phẩm</Link>
                            {!isSeller() && (
                                <Link to="/register" className="text-red-500 font-semibold hover:text-red-600 whitespace-nowrap">
                                    Đăng ký bán hàng
                                </Link>
                            )}
                        </div>

                        {/* Desktop Search */}
                        <div className="hidden md:flex flex-grow items-center space-x-4 px-2 sm:px-4 max-w-md">
                            <form onSubmit={handleSearch} className="flex-grow relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    aria-label="Tìm kiếm sản phẩm"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-0 top-0 bottom-0 px-3 sm:px-4 bg-[#2E7D32] text-white rounded-r-md hover:bg-purple-700"
                                    aria-label="Tìm kiếm"
                                >
                                    <Search size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </form>
                        </div>

                        {/* Mobile Search Button */}
                        <button
                            onClick={() => {
                                const searchInput = document.getElementById('mobile-search-input');
                                if (searchInput) {
                                    searchInput.focus();
                                }
                            }}
                            className="md:hidden p-2 text-gray-600 hover:text-purple-600"
                            aria-label="Search"
                        >
                            <Search size={20} />
                        </button>

                        <div className="flex items-center space-x-4 sm:space-x-8 xl:space-x-12">
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
                                        className="absolute user-dropdown right-0 mt-2 w-52 sm:w-56 bg-white rounded-md shadow-lg py-1 border z-50"
                                        role="menu"
                                    >
                                        <div className="px-3 sm:px-4 py-2 border-b">
                                            <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">{currentUser?.email}</div>
                                        </div>
                                        <Link
                                            to="/user-profile"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <UserCircle size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Tài khoản của tôi</span>
                                        </Link>
                                        <Link
                                            to="/user-profile/orders"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Package size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Đơn mua</span>
                                        </Link>
                                        <Link
                                            to="/user-profile/messages"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center relative"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <MessageSquare size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate flex-1">Tin nhắn</span>
                                            {unreadMessageCount > 0 && (
                                                <div className="ml-auto bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                                                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                </div>
                                            )}
                                        </Link>
                                        <Link
                                            to="/user-profile/addresses"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <MapPin size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Địa chỉ nhận hàng</span>
                                        </Link>
                                        <Link
                                            to="/user-profile/followed-shops"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Store size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Cửa hàng đã theo dõi</span>
                                        </Link>
                                        <Link
                                            to="/user-profile/password"
                                            className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            role="menuitem"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <Lock size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Đổi mật khẩu</span>
                                        </Link>
                                        {isSeller() && (
                                            <Link
                                                to="/seller"
                                                className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <Store size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                                <span className="truncate">Seller Dashboard</span>
                                            </Link>
                                        )}
                                        {isAdmin() && (
                                            <Link
                                                to="/admin"
                                                className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <Store size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                                <span className="truncate">Admin Dashboard</span>
                                            </Link>
                                        )}
                                        <div className="border-t mt-1">
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsUserDropdownOpen(false);
                                                }}
                                                className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                                role="menuitem"
                                            >
                                                <LogOut size={14} className="sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                                <span className="truncate">Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    ref={cartButtonRef}
                                    id="cartbutton"
                                    className="cartbutton flex flex-col items-center text-gray-600 hover:text-purple-600 text-xs relative"
                                    onMouseEnter={() => setIsCartDropdownOpen(true)}
                                    onMouseLeave={() => setIsCartDropdownOpen(false)}
                                    onClick={() => navigate('/cart')}
                                    aria-label="Mở giỏ hàng"
                                >
                                    <div className="relative">
                                        <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                                        {cart && cart.items && cart.items.length > 0 && (
                                            <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                                                {cart.items.length > 9 ? '9+' : cart.items.length}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden sm:inline">Giỏ hàng</span>
                                </button>
                                
                                {/* Cart Dropdown Popup */}
                                {isCartDropdownOpen && cart && cart.items && cart.items.length > 0 && (
                                    <div
                                        ref={cartDropdownRef}
                                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                                        onMouseEnter={() => setIsCartDropdownOpen(true)}
                                        onMouseLeave={() => setIsCartDropdownOpen(false)}
                                    >
                                        <div className="p-3 sm:p-4 border-b border-gray-200">
                                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Giỏ hàng của bạn
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                {cart.items.length} {cart.items.length === 1 ? 'sản phẩm' : 'sản phẩm'}
                                            </p>
                                        </div>
                                        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                                            {cart.items.slice(0, 5).map((item, index) => (
                                                <div key={index} className="p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50">
                                                    <div className="flex gap-2 sm:gap-3">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                                                            {item.image ? (
                                                                <img
                                                                    src={typeof item.image === 'string' ? item.image : item.image?.url}
                                                                    alt={item.productName || 'Sản phẩm'}
                                                                    className="w-full h-full object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                                    <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                                                                {item.productName || 'Sản phẩm'}
                                                            </p>
                                                            {item.variantName && (
                                                                <p className="text-xs text-gray-600 truncate">
                                                                    {item.variantName}
                                                                </p>
                                                            )}
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                                Số lượng: {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {cart.items.length > 5 && (
                                                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-600">
                                                    và {cart.items.length - 5} sản phẩm khác...
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 sm:p-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    navigate('/cart');
                                                    setIsCartDropdownOpen(false);
                                                }}
                                                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition font-medium text-sm sm:text-base"
                                            >
                                                Xem giỏ hàng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <div
                                ref={mobileMenuRef}
                                className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto"
                            >
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2 text-gray-600 hover:text-gray-900"
                                        aria-label="Close menu"
                                    >
                                        <Menu size={24} />
                                    </button>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Mobile Search */}
                                    <form onSubmit={handleSearch} className="mb-4">
                                        <div className="relative">
                                            <input
                                                id="mobile-search-input"
                                                type="text"
                                                placeholder="Tìm kiếm sản phẩm..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                aria-label="Tìm kiếm sản phẩm"
                                            />
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </form>

                                    {/* Mobile Navigation Links */}
                                    <div className="space-y-2">
                                        <Link
                                            to="/introduction"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition"
                                        >
                                            Giới Thiệu
                                        </Link>
                                        <Link
                                            to="/products"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition"
                                        >
                                            Sản phẩm
                                        </Link>
                                        {!isSeller() && (
                                            <Link
                                                to="/register"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                            >
                                                Đăng ký bán hàng
                                            </Link>
                                        )}
                                    </div>

                                    {/* Mobile User Menu */}
                                    {isLoggedIn ? (
                                        <div className="pt-4 border-t border-gray-200 space-y-2">
                                            <div className="px-4 py-2 text-sm font-medium text-gray-900 truncate">
                                                {currentUser?.email || 'Tài khoản'}
                                            </div>
                                            <Link
                                                to="/user-profile"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                Tài khoản của tôi
                                            </Link>
                                            <Link
                                                to="/user-profile/orders"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                Đơn mua
                                            </Link>
                                            <Link
                                                to="/cart"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                Giỏ hàng
                                            </Link>
                                            {isSeller() && (
                                                <Link
                                                    to="/seller"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                                >
                                                    Seller Dashboard
                                                </Link>
                                            )}
                                            {isAdmin() && (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    navigate('/login');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                Đăng nhập
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
};

export default Header;
                                              