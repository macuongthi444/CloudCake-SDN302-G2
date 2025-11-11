import React, { useState, useEffect } from 'react';
import { X, Package, Truck, Phone, MapPin, CreditCard, AlertTriangle, RefreshCcw, XCircle, CheckCircle, Clock } from 'lucide-react';
import ApiService from '../../services/ApiService';

const OrderDetail = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get(`/order/find/${orderId}`);
      const data = res.order || res;

      const shippingAddress = data.user_address_id || data.shippingAddress || {};
      const paymentSource = data.payment_id || data.paymentMethodId || {};

      const normalizedItems = Array.isArray(data.items)
        ? data.items.map(item => {
            const quantity = Number(item.quantity ?? item.qty ?? item.quantityOrdered ?? 0);
            const unitPrice = Number(item.unitPrice ?? item.price ?? (quantity ? (item.totalPrice || 0) / quantity : 0));
            return {
              ...item,
              quantity,
              unitPrice,
              totalPrice: Number(item.totalPrice ?? unitPrice * quantity),
              productName: item.productName || item.product?.name || 'Sản phẩm',
              image: item.image || item.product?.images?.[0]?.url,
              variantLabel: item.variantName || (item.variant?.options ? item.variant.options.join(' / ') : '')
            };
          })
        : [];

      const normalized = {
        ...data,
        id: data._id || data.id,
        customer: data.customer_id || data.userId || { firstName: 'Khách lẻ', email: '', phone: '' },
        shipping: {
          name: data.shipping_id?.name || data.shippingMethodId?.name || 'Không rõ',
          address: shippingAddress.address || shippingAddress.address_line1 || '',
          phone: shippingAddress.phone || shippingAddress.recipientPhone || '',
          recipient: shippingAddress.recipientName || '',
          raw: shippingAddress
        },
        payment: {
          ...paymentSource,
          name: paymentSource?.name || data.payment_method || data.paymentCode || 'Tiền mặt'
        },
        items: normalizedItems,
        status: (data.order_status || data.status || 'pending').toLowerCase(),
        paymentStatus: (data.status_id || data.paymentStatus || '').toString().toLowerCase().includes('paid') ? 'paid' : 'pending',
        total: data.total_price || data.totalAmount || 0,
        createdAt: data.created_at || data.createdAt,
        needRefund: !!data.need_pay_back,
        paymentDetails: data.payment_details || data.paymentDetails || {}
      };

      setOrder(normalized);
    } catch (err) {
      alert('Không tải được chi tiết đơn hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Xác nhận hủy đơn hàng này?')) return;
    try {
      setIsCancelling(true);
      await ApiService.put(`/order/cancel/${orderId}`, {});
      alert('Đã hủy đơn hàng thành công!');
      fetchOrderDetail();
    } catch (err) {
      alert('Hủy đơn hàng thất bại!');
    } finally {
      setIsCancelling(false);
    }
  };

  const markAsRefunded = async () => {
    if (!window.confirm('Xác nhận đã hoàn tiền cho khách?')) return;
    try {
      setIsRefunding(true);
      await ApiService.put(`/order/refund/${orderId}`, {});
      alert('Đã đánh dấu hoàn tiền thành công!');
      fetchOrderDetail();
    } catch (err) {
      alert('Lỗi khi đánh dấu hoàn tiền!');
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleString('vi-VN');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center mt-4">Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full text-center">
          <XCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p>Không tìm thấy đơn hàng</p>
          <button onClick={onBack} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
            <p className="text-sm text-gray-600">Mã đơn: <span className="font-medium">#{order.id}</span></p>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status === 'pending' ? 'Chờ xác nhận' :
                 order.status === 'processing' ? 'Đã xác nhận' :
                 order.status === 'shipped' ? 'Đang giao' :
                 order.status === 'delivered' ? 'Hoàn thành' :
                 order.status === 'cancelled' ? 'Đã hủy' : order.status}
              </span>
              {order.needRefund && (
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  Cần hoàn tiền
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={cancelOrder}
                  disabled={isCancelling}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70"
                >
                  <XCircle size={18} />
                  {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
                </button>
              )}
              {order.needRefund && (
                <button
                  onClick={markAsRefunded}
                  disabled={isRefunding}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-70"
                >
                  <RefreshCcw size={18} />
                  {isRefunding ? 'Đang xử lý...' : 'Đã hoàn tiền'}
                </button>
              )}
            </div>
          </div>

          {/* Customer & Shipping */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Package size={20} /> Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Họ tên:</strong> {order.customer.firstName} {order.customer.lastName || ''}</p>
                <p><strong>Email:</strong> {order.customer.email || 'Không có'}</p>
                <p><strong>SĐT:</strong> {order.customer.phone || 'Không có'}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Truck size={20} /> Vận chuyển
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Phương thức:</strong> {order.shipping.name}</p>
                <p><strong>Người nhận:</strong> {order.shipping.recipient || order.customer.firstName}</p>
                <p><strong>Địa chỉ:</strong> {order.shipping.address || 'Không có'}</p>
                <p><strong>SĐT:</strong> {order.shipping.phone || 'Không có'}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <CreditCard size={20} /> Thanh toán
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Phương thức:</strong> {order.payment.name}</p>
                <p><strong>Trạng thái:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                  </span>
                </p>
              </div>
              {order.paymentDetails && Object.keys(order.paymentDetails).length > 0 && (
                <div className="text-xs bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-1">Chi tiết thanh toán:</p>
                  {Object.entries(order.paymentDetails).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {String(v)}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Package size={20} /> Sản phẩm
            </h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.variantLabel && `${item.variantLabel} · `}
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">{formatVND(item.totalPrice || item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{formatVND(order.total)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <Clock size={16} className="inline mr-1" />
              Đặt lúc: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;