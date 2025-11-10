import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, Calendar, CreditCard, Truck, CheckCircle, XCircle, Clock, AlertCircle, Wallet, X } from 'lucide-react';
import OrderService from '../../../services/OrderService';
import PaymentService from '../../../services/PaymentService';
import { useAuth } from '../../Login/context/AuthContext';
import { toastError, toastInfo, toastSuccess } from '../../../utils/toast';

const OrderManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await OrderService.getByUserId(currentUser.id);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toastError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status, paymentStatus) => {
    const statusMap = {
      PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-800', icon: Package },
      SHIPPED: { label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      DELIVERED: { label: 'Đã giao hàng', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
      REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const paymentStatusMap = {
      PENDING: { label: 'Chờ thanh toán', color: 'text-yellow-600' },
      PAID: { label: 'Đã thanh toán', color: 'text-green-600' },
      FAILED: { label: 'Thanh toán thất bại', color: 'text-red-600' },
      REFUNDED: { label: 'Đã hoàn tiền', color: 'text-gray-600' }
    };

    return {
      orderStatus: statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Package },
      paymentStatus: paymentStatusMap[paymentStatus] || { label: paymentStatus, color: 'text-gray-600' }
    };
  };

  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => {
        if (selectedStatus === 'PENDING') return order.paymentStatus === 'PENDING';
        if (selectedStatus === 'PAID') return order.paymentStatus === 'PAID';
        if (selectedStatus === 'CANCELLED') return order.status === 'CANCELLED';
        return order.status === selectedStatus;
      });

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

  const handlePayVNPay = async (order) => {
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

  const shouldShowPayButton = (order) => {
    // Show pay button if:
    // 1. Payment status is PENDING
    // 2. Payment method is VNPay
    
    // Check if payment status is PENDING
    if (order.paymentStatus !== 'PENDING') {
      return false;
    }
    
    // Check if payment method is VNPay
    // Priority: order.paymentCode > paymentMethodId.paymentCode > paymentMethodId (string check)
    const isVNPay = 
      order.paymentCode === 'VNPAY' || 
      (order.paymentMethodId && typeof order.paymentMethodId === 'object' && order.paymentMethodId.paymentCode === 'VNPAY');
    
    return isVNPay;
  };

  const shouldShowCancelButton = (order) => {
    // Show cancel button if:
    // 1. Order status is PENDING or CONFIRMED
    // 2. Order is not already cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    return cancellableStatuses.includes(order.status) && order.status !== 'CANCELLED';
  };

  const handleCancelClick = (order) => {
    setSelectedOrderToCancel(order);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderToCancel) return;

    try {
      setCancellingOrderId(selectedOrderToCancel._id);
      const orderId = selectedOrderToCancel.orderNumber || selectedOrderToCancel._id;
      await OrderService.cancelOrder(orderId, cancelReason || 'Khách hàng yêu cầu hủy');
      
      toastSuccess('Đơn hàng đã được hủy thành công');
      setShowCancelModal(false);
      setSelectedOrderToCancel(null);
      setCancelReason('');
      
      // Reload orders
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toastError(error.response?.data?.error?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancellingOrderId(null);
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Đơn hàng của tôi
        </h2>
        <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { value: 'ALL', label: 'Tất cả' },
          { value: 'PENDING', label: 'Chờ thanh toán' },
          { value: 'PAID', label: 'Đã thanh toán' },
          { value: 'PROCESSING', label: 'Đang xử lý' },
          { value: 'SHIPPED', label: 'Đang giao' },
          { value: 'DELIVERED', label: 'Đã giao' },
          { value: 'CANCELLED', label: 'Đã hủy' }
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value)}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              selectedStatus === filter.value
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedStatus === 'CANCELLED' ? 'Chưa có đơn hàng đã hủy' : 'Chưa có đơn hàng'}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'ALL' 
              ? 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!'
              : selectedStatus === 'CANCELLED'
              ? 'Bạn chưa có đơn hàng nào đã bị hủy'
              : `Không có đơn hàng nào với trạng thái này`}
          </p>
          {selectedStatus !== 'CANCELLED' && (
            <button
              onClick={() => navigate('/products')}
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Mua sắm ngay
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const { orderStatus, paymentStatus } = getStatusInfo(order.status, order.paymentStatus);
            const StatusIcon = orderStatus.icon;

            return (
              <div key={order._id} className="bg-white rounded-lg shadow hover:shadow-md transition">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Đơn hàng: {order.orderNumber || order._id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${orderStatus.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {orderStatus.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className={`flex items-center gap-1 ${paymentStatus.color}`}>
                        <CreditCard className="w-4 h-4" />
                        {paymentStatus.label}
                      </span>
                      {order.status === 'CANCELLED' && order.cancelledAt && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Hủy: {formatDate(order.cancelledAt)}
                        </span>
                      )}
                    </div>
                    {order.status === 'CANCELLED' && order.cancellationReason && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Lý do hủy: </span>
                        <span className="text-red-600">{order.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      {order.totalAmount?.toLocaleString('vi-VN')} ₫
                    </p>
                    <div className="mt-2 flex gap-2 justify-end flex-wrap">
                      {shouldShowPayButton(order) && (
                        <button
                          onClick={() => handlePayVNPay(order)}
                          className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                        >
                          <Wallet className="w-4 h-4" />
                          Thanh toán
                        </button>
                      )}
                      {shouldShowCancelButton(order) && (
                        <button
                          onClick={() => handleCancelClick(order)}
                          disabled={cancellingOrderId === order._id}
                          className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          {cancellingOrderId === order._id ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/user-profile/orders/${order.orderNumber || order._id}`)}
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-16 h-16 flex-shrink-0">
                          {item.image ? (
                            <img
                              src={typeof item.image === 'string' ? item.image : item.image?.url}
                              alt={item.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          {item.variantName && (
                            <p className="text-sm text-gray-600">Phân loại: {item.variantName}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            Số lượng: {item.quantity} × {item.unitPrice?.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {item.totalPrice?.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-sm text-gray-600 text-center pt-2">
                        và {order.items.length - 3} sản phẩm khác...
                      </p>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Giao đến:</span>{' '}
                      {order.shippingAddress.recipientName} - {order.shippingAddress.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.address_line1}
                      {order.shippingAddress.address_line2 && `, ${order.shippingAddress.address_line2}`}
                      {order.shippingAddress.ward && `, ${order.shippingAddress.ward}`}
                      {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
                      {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hủy đơn hàng</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedOrderToCancel(null);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hủy đơn hàng <span className="font-semibold">{selectedOrderToCancel.orderNumber || selectedOrderToCancel._id}</span>?
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
                    setSelectedOrderToCancel(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingOrderId === selectedOrderToCancel._id}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingOrderId === selectedOrderToCancel._id ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
