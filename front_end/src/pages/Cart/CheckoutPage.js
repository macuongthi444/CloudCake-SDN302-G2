import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Login/context/AuthContext';
import { CreditCard, Truck, MapPin, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import CartService from '../../services/CartService';
import OrderService from '../../services/OrderService';
import PaymentService from '../../services/PaymentService';
import AddressService from '../../services/AddressService';
import { toastError, toastSuccess, toastInfo } from '../../utils/toast';
import { useCart } from '../Login/context/CartContext';

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { cart: globalCart, setCart: setGlobalCart, loadCart } = useCart();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!currentUser?.id) {
          navigate('/login');
          return;
        }
        
        // Always reload cart from API to get latest data (bypass cache)
        // This ensures we have the correct cart state even if user navigates back
        const cartData = await CartService.getCartByUserId(currentUser.id, true);
        setCart(cartData);
        // Also update global cart to keep it in sync
        setGlobalCart(cartData);
        
        // Load addresses
        try {
          const addressData = await AddressService.getAddresses(currentUser.id);
          setAddresses(Array.isArray(addressData) ? addressData : []);
          // Select first active address or first address
          const activeAddress = addressData?.find(addr => addr.status) || addressData?.[0];
          if (activeAddress) {
            setSelectedAddress(activeAddress);
          }
        } catch (addrError) {
          console.error('Error loading addresses:', addrError);
          // Continue without addresses
        }
      } catch (e) {
        console.error('Error loading checkout data:', e);
        toastError('Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, navigate, setGlobalCart]);

  // Always use local cart (fresh from API) to ensure accuracy
  // Global cart might be stale, so we prioritize local cart
  const displayCart = cart || globalCart;

  const createOrderIfNeeded = async (paymentCode) => {
    if (order && order.paymentMethodId) {
      // Check if order payment method matches
      return order;
    }
    
    setCreating(true);
    try {
      const shippingAddress = selectedAddress ? {
        recipientName: currentUser?.firstName && currentUser?.lastName 
          ? `${currentUser.firstName} ${currentUser.lastName}` 
          : currentUser?.email || 'Customer',
        phone: selectedAddress.phone || currentUser?.phone || '',
        city: selectedAddress.city || '',
        address_line1: selectedAddress.address_line1 || '',
        address_line2: selectedAddress.address_line2 || '',
        district: selectedAddress.district || '',
        ward: selectedAddress.ward || '',
        postalCode: selectedAddress.postalCode || ''
      } : {};
      
      const created = await OrderService.createFromCart({
        userId: currentUser.id,
        paymentCode,
        shippingAddress
      });
      setOrder(created);
      return created;
    } catch (e) {
      console.error('Error creating order:', e);
      const errorMessage = e?.response?.data?.error?.message || e?.message || 'Không thể tạo đơn hàng';
      toastError(errorMessage);
      throw e;
    } finally {
      setCreating(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toastError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      console.log('🔄 Starting payment flow...');
      console.log('Payment method:', selectedPaymentMethod);
      setCreating(true);
      
      console.log('Step 1: Creating order...');
      const o = await createOrderIfNeeded(selectedPaymentMethod);
      console.log('✅ Order created:', o._id);
      
      if (selectedPaymentMethod === 'VNPAY') {
        console.log('Step 2: Creating VNPay payment URL...');
        const response = await PaymentService.createVNPayPayment(o._id);
        console.log('✅ Payment URL received:', response);
        
        const paymentUrl = response?.paymentUrl || response?.data?.paymentUrl;
        if (!paymentUrl) {
          console.error('❌ No payment URL in response:', response);
          toastError('Không nhận được URL thanh toán từ VNPay');
          setCreating(false);
          return;
        }
        
        console.log('Step 3: Redirecting to VNPay...');
        toastInfo('Đang chuyển hướng đến cổng thanh toán VNPay...', { autoClose: 2000 });
        // Small delay to show toast before redirect
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 500);
      } else if (selectedPaymentMethod === 'COD') {
        console.log('Step 2: Confirming COD order...');
        await PaymentService.confirmCOD(o._id);
        
        // Optimistic update: Clear cart immediately in UI
        const emptyCart = { userId: currentUser.id, items: [], totalPrice: 0 };
        setGlobalCart(emptyCart);
        setCart(emptyCart);
        
        // Reload cart from API to sync with backend (backend clears cart for COD)
        // Wait for reload to complete to ensure UI shows correct state
        // Use bypassCache to ensure we get fresh data from server
        try {
          const freshCartData = await CartService.getCartByUserId(currentUser.id, true);
          setCart(freshCartData);
          setGlobalCart(freshCartData);
          // Also reload global cart context
          await loadCart();
          console.log('✅ Cart reloaded and synced after COD order:', freshCartData);
        } catch (err) {
          console.error('Error reloading cart:', err);
          // Keep optimistic update even if reload fails
        }
        
        toastSuccess(
          `Đơn hàng #${o.orderNumber || o._id} đã được tạo thành công! Bạn sẽ thanh toán khi nhận hàng.`,
          { autoClose: 5000 }
        );
        // Navigate after short delay to show toast
        setTimeout(() => {
          navigate('/user-profile/orders');
        }, 1000);
      }
    } catch (e) {
      console.error('❌ Payment error:', e);
      const errorMessage = e?.response?.data?.error?.message || e?.message || 'Không thể xử lý thanh toán';
      toastError(errorMessage);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!displayCart || !displayCart.items || displayCart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3 sm:px-4">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = displayCart.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  const shippingFee = 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại giỏ hàng
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Địa chỉ giao hàng</h2>
              </div>
              
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      onClick={() => setSelectedAddress(address)}
                      className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedAddress?._id === address._id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {currentUser?.firstName && currentUser?.lastName
                                ? `${currentUser.firstName} ${currentUser.lastName}`
                                : currentUser?.email || 'Khách hàng'}
                            </span>
                            {selectedAddress?._id === address._id && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Đã chọn</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm break-words">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm break-words">
                            {[address.ward, address.district, address.city].filter(Boolean).join(', ')}
                          </p>
                          {address.phone && (
                            <p className="text-gray-600 text-xs sm:text-sm mt-1">📞 {address.phone}</p>
                          )}
                        </div>
                        {selectedAddress?._id === address._id && (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/user-profile/addresses"
                    className="block text-center text-blue-600 hover:text-blue-700 py-2 border border-blue-600 rounded-lg transition"
                  >
                    + Thêm địa chỉ mới
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ giao hàng</p>
                  <Link
                    to="/user-profile/addresses"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Thêm địa chỉ
                  </Link>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
              </div>
              
              <div className="space-y-3">
                {/* VNPay */}
                <div
                  onClick={() => setSelectedPaymentMethod('VNPAY')}
                  className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPaymentMethod === 'VNPAY'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0 ${
                        selectedPaymentMethod === 'VNPAY'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'VNPAY' && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base text-gray-900">Thanh toán trực tuyến (VNPay)</div>
                        <div className="text-xs sm:text-sm text-gray-600">Thanh toán qua thẻ ATM, thẻ quốc tế, ví điện tử</div>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'VNPAY' && (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* COD */}
                <div
                  onClick={() => setSelectedPaymentMethod('COD')}
                  className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPaymentMethod === 'COD'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0 ${
                        selectedPaymentMethod === 'COD'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'COD' && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                        <div className="text-xs sm:text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</div>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'COD' && (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sản phẩm</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {displayCart.items.map((item) => (
                  <div key={item._id || `${item.productId}-${item.variantId}`} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      {item.image || item.image?.url ? (
                        <img
                          src={typeof item.image === 'string' ? item.image : item.image?.url}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{item.productName}</h3>
                      {item.variantName && (
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Phân loại: {item.variantName}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {(item.price || 0).toLocaleString('vi-VN')} ₫/sản phẩm
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-4">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-gray-600">
                    <span>Giảm giá:</span>
                    <span className="text-red-600">-{discount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {total.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={creating || !selectedPaymentMethod || addresses.length === 0}
                className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold text-sm sm:text-base sm:text-lg flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{selectedPaymentMethod === 'VNPAY' ? 'Thanh toán VNPay' : 'Đặt hàng (COD)'}</span>
                  </>
                )}
              </button>

              {addresses.length === 0 && (
                <p className="text-xs sm:text-sm text-red-600 mt-2 text-center">
                  Vui lòng thêm địa chỉ giao hàng
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
