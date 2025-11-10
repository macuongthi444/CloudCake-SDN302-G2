import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/toast';
import { useCart } from '../Login/context/CartContext';
import OrderService from '../../services/OrderService';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cartContext = useCart();
  const loadCart = cartContext?.loadCart || (async () => {});
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState(null);

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId');
    let message = searchParams.get('message') || '';
    
    // Safely decode message
    try {
      if (message) {
        message = decodeURIComponent(message);
      }
    } catch (e) {
      console.warn('Could not decode message:', message);
      message = message || '';
    }

    console.log('Payment result page loaded:', {
      success,
      orderId,
      message
    });

    // If orderId is an ObjectId (24 hex chars, not starting with "ORD-"), fetch order to get orderNumber
    const fetchOrderNumber = async () => {
      if (orderId && !orderId.startsWith('ORD-') && orderId.length === 24) {
        try {
          const order = await OrderService.getById(orderId);
          if (order && order.orderNumber) {
            setOrderNumber(order.orderNumber);
          } else {
            setOrderNumber(orderId); // Fallback to orderId if orderNumber not found
          }
        } catch (err) {
          console.warn('Could not fetch orderNumber:', err);
          setOrderNumber(orderId); // Fallback to orderId
        }
      } else {
        // orderId is already orderNumber or empty
        setOrderNumber(orderId || null);
      }
    };

    if (orderId) {
      fetchOrderNumber();
    } else {
      setOrderNumber(null);
    }

    setLoading(false);

    // Show toast notification with a small delay to ensure component is mounted
    const timer = setTimeout(async () => {
      if (success) {
        // Reload cart after successful payment (backend clears cart for successful VNPay)
        // Reload in background, don't wait for it
        if (loadCart && typeof loadCart === 'function') {
          loadCart().catch(err => console.error('Error reloading cart:', err));
        }
        
        const successMessage = message || 'Thanh toán thành công! Đơn hàng của bạn đã được xử lý.';
        toastSuccess(successMessage, {
          autoClose: 5000,
        });
      } else {
        // Do NOT reload cart on payment failure - user may want to retry
        let errorMessage = message || 'Bạn đã hủy thanh toán hoặc có lỗi xảy ra trong quá trình thanh toán.';
        
        if (message.includes('Chữ ký không hợp lệ') || message.includes('không hợp lệ')) {
          errorMessage = 'Chữ ký không hợp lệ. Vui lòng liên hệ hỗ trợ nếu bạn đã thanh toán.';
        } else if (message.includes('thất bại') || message.includes('failed')) {
          errorMessage = message || 'Thanh toán thất bại. Vui lòng thử lại.';
        } else if (!message) {
          errorMessage = 'Bạn đã hủy thanh toán. Đơn hàng vẫn được lưu và bạn có thể thanh toán lại sau.';
        }
        
        toastError(errorMessage, {
          autoClose: 6000,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');
  let message = searchParams.get('message') || '';
  
  // Safely decode message
  try {
    if (message) {
      message = decodeURIComponent(message);
    }
  } catch (e) {
    console.warn('Could not decode message:', message);
    message = message || '';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {success ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              {message || 'Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.'}
            </p>
            {orderNumber && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: <span className="font-mono font-semibold">{orderNumber}</span>
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/user-profile/orders')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Xem đơn hàng
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Về trang chủ
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại ❌
            </h1>
            <p className="text-gray-600 mb-6">
              {message || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại thông tin và thử lại.'}
            </p>
            {orderNumber && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: <span className="font-mono font-semibold">{orderNumber}</span>
              </p>
            )}
            <div className="space-y-3">
              {orderNumber && (
                <button
                  onClick={() => navigate(`/user-profile/orders/${orderNumber}`)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Xem đơn hàng và thanh toán lại
                </button>
              )}
              <button
                onClick={() => navigate('/user-profile/orders')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Xem tất cả đơn hàng
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Về trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
