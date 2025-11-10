import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Phone,
  Store,
  FileText,
  Wallet,
  X
} from 'lucide-react';
import OrderService from '../../../services/OrderService';
import PaymentService from '../../../services/PaymentService';
import { toastError, toastInfo, toastSuccess } from '../../../utils/toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await OrderService.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order detail:', error);
      toastError('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status, paymentStatus) => {
    const statusMap = {
      PENDING: {
        label: 'Chờ xử lý',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        description: 'Đơn hàng đang chờ được xử lý'
      },
      CONFIRMED: {
        label: 'Đã xác nhận',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle,
        description: 'Đơn hàng đã được xác nhận'
      },
      PROCESSING: {
        label: 'Đang xử lý',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: Package,
        description: 'Đơn hàng đang được chuẩn bị'
      },
      SHIPPED: {
        label: 'Đang giao hàng',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Truck,
        description: 'Đơn hàng đang được vận chuyển'
      },
      DELIVERED: {
        label: 'Đã giao hàng',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        description: 'Đơn hàng đã được giao thành công'
      },
      CANCELLED: {
        label: 'Đã hủy',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        description: 'Đơn hàng đã bị hủy'
      },
      REFUNDED: {
        label: 'Đã hoàn tiền',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: AlertCircle,
        description: 'Đơn hàng đã được hoàn tiền'
      }
    };

    const paymentStatusMap = {
      PENDING: {
        label: 'Chờ thanh toán',
        color: 'text-yellow-600',
        icon: Clock
      },
      PAID: {
        label: 'Đã thanh toán',
        color: 'text-green-600',
        icon: CheckCircle
      },
      FAILED: {
        label: 'Thanh toán thất bại',
        color: 'text-red-600',
        icon: XCircle
      },
      REFUNDED: {
        label: 'Đã hoàn tiền',
        color: 'text-gray-600',
        icon: AlertCircle
      }
    };

    return {
      orderStatus: statusMap[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Package,
        description: 'Trạng thái đơn hàng'
      },
      paymentStatus: paymentStatusMap[paymentStatus] || {
        label: paymentStatus,
        color: 'text-gray-600',
        icon: CreditCard
      }
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const handlePayVNPay = async () => {
    if (!order) return;
    try {
      toastInfo('Đang chuyển hướng đến cổng thanh toán VNPay...');
      const response = await PaymentService.createVNPayPayment(order._id);
      if (response && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        toastError('Không thể tạo URL thanh toán');
      }
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      toastError('Không thể tạo thanh toán VNPay. Vui lòng thử lại.');
    }
  };

  const shouldShowPayButton = () => {
    if (!order) return false;
    // Show pay button if:
    // 1. Payment status is PENDING
    // 2. Payment method is VNPay
    // Priority: order.paymentCode > paymentMethodId.paymentCode
    if (order.paymentStatus !== 'PENDING') {
      return false;
    }
    const isVNPay = 
      order.paymentCode === 'VNPAY' || 
      (order.paymentMethodId && typeof order.paymentMethodId === 'object' && order.paymentMethodId.paymentCode === 'VNPAY');
    return isVNPay;
  };

  const shouldShowCancelButton = () => {
    if (!order) return false;
    // Show cancel button if:
    // 1. Order status is PENDING or CONFIRMED
    // 2. Order is not already cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    return cancellableStatuses.includes(order.status) && order.status !== 'CANCELLED';
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      const id = order.orderNumber || order._id;
      await OrderService.cancelOrder(id, cancelReason || 'Khách hàng yêu cầu hủy');
      
      toastSuccess('Đơn hàng đã được hủy thành công');
      setShowCancelModal(false);
      setCancelReason('');
      
      // Reload order detail
      await loadOrderDetail();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toastError(error.response?.data?.error?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
          <p className="text-gray-600 mb-6">Đơn hàng không tồn tại hoặc đã bị xóa</p>
          <button
            onClick={() => navigate('/user-profile/orders')}
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const { orderStatus, paymentStatus } = getStatusInfo(order.status, order.paymentStatus);
  const StatusIcon = orderStatus.icon;
  const PaymentIcon = paymentStatus.icon;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/user-profile/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách đơn hàng</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="w-6 h-6" />
              Chi tiết đơn hàng
            </h2>
            <p className="text-gray-600">
              Mã đơn hàng: <span className="font-semibold">{order.orderNumber || order._id}</span>
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${orderStatus.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-semibold">{orderStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sản phẩm đã đặt
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-24 h-24 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={typeof item.image === 'string' ? item.image : item.image?.url}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.productName}</h4>
                      {item.variantName && (
                        <p className="text-sm text-gray-600 mb-2">Phân loại: {item.variantName}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Số lượng: {item.quantity}</span>
                        <span>×</span>
                        <span>{formatCurrency(item.unitPrice)} ₫</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {formatCurrency(item.totalPrice)} ₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cancellation Info */}
          {order.status === 'CANCELLED' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Đơn hàng đã bị hủy</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {order.cancelledAt && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Thời gian hủy: </span>
                      <span>{formatDate(order.cancelledAt)}</span>
                    </div>
                  )}
                  {order.cancellationReason && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Lý do hủy: </span>
                      <p className="text-red-700 mt-1 bg-white p-3 rounded border border-red-200">
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Địa chỉ giao hàng
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">{order.shippingAddress.recipientName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700">{order.shippingAddress.phone}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="text-gray-700">
                      <p>{order.shippingAddress.address_line1}</p>
                      {order.shippingAddress.address_line2 && (
                        <p>{order.shippingAddress.address_line2}</p>
                      )}
                      <p>
                        {[
                          order.shippingAddress.ward,
                          order.shippingAddress.district,
                          order.shippingAddress.city
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Thông tin đơn hàng
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ngày đặt hàng:</span>
                <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cập nhật lần cuối:</span>
                  <span className="font-medium text-gray-900">{formatDate(order.updatedAt)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <PaymentIcon className={`w-4 h-4 ${paymentStatus.color}`} />
                  <span className="text-sm text-gray-600">Trạng thái thanh toán:</span>
                </div>
                <p className={`font-semibold ${paymentStatus.color}`}>{paymentStatus.label}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {order.paymentMethodId && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Phương thức thanh toán
                </h3>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900">
                  {typeof order.paymentMethodId === 'object' && order.paymentMethodId.name
                    ? order.paymentMethodId.name
                    : order.paymentMethodId}
                </p>
              </div>
            </div>
          )}

          {/* Shipping Method */}
          {order.shippingMethodId && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Phương thức vận chuyển
                </h3>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900">
                  {typeof order.shippingMethodId === 'object' && order.shippingMethodId.name
                    ? order.shippingMethodId.name
                    : order.shippingMethodId}
                </p>
              </div>
            </div>
          )}

          {/* Shop Info */}
          {order.shopId && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Cửa hàng
                </h3>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900">
                  {typeof order.shopId === 'object' && order.shopId.name
                    ? order.shopId.name
                    : order.shopId}
                </p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tổng tiền</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)} ₫</span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="text-gray-900">{formatCurrency(order.shippingFee)} ₫</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(order.discount)} ₫</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {formatCurrency(order.totalAmount)} ₫
                  </span>
                </div>
              </div>
              {shouldShowPayButton() && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <button
                    onClick={handlePayVNPay}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Thanh toán VNPay
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay
                  </p>
                </div>
              )}
              {shouldShowCancelButton() && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đã xác nhận"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hủy đơn hàng</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hủy đơn hàng <span className="font-semibold">{order.orderNumber || order._id}</span>?
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đã xác nhận". 
                  Nếu đơn hàng đã được thanh toán, tiền sẽ được hoàn lại sau khi hủy.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy (tùy chọn)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn hàng..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;

