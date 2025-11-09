import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, Calendar, CreditCard, Truck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import OrderService from '../../../services/OrderService';
import { useAuth } from '../../Login/context/AuthContext';
import { toastError } from '../../../utils/toast';

const OrderManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    if (currentUser?.id) {
      loadOrders();
    }
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
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {[
          { value: 'ALL', label: 'Tất cả' },
          { value: 'PENDING', label: 'Chờ thanh toán' },
          { value: 'PAID', label: 'Đã thanh toán' },
          { value: 'PROCESSING', label: 'Đang xử lý' },
          { value: 'SHIPPED', label: 'Đang giao' },
          { value: 'DELIVERED', label: 'Đã giao' }
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value)}
            className={`px-4 py-2 font-medium transition ${
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'ALL' 
              ? 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!'
              : `Không có đơn hàng nào với trạng thái "${selectedStatus}"`}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Mua sắm ngay
          </button>
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
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className={`flex items-center gap-1 ${paymentStatus.color}`}>
                        <CreditCard className="w-4 h-4" />
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      {order.totalAmount?.toLocaleString('vi-VN')} ₫
                    </p>
                    <button
                      onClick={() => navigate(`/user-profile/orders/${order._id}`)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </button>
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
    </div>
  );
};

export default OrderManagement;
