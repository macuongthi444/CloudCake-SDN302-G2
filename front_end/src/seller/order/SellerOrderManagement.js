import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Clock, Package, XCircle, Truck, CheckCircle, RefreshCw } from 'lucide-react';
import ApiService from '../../services/ApiService';
import ShopService from '../../services/ShopService';
import OrderDetail from './OrderDetail';
import { toastSuccess, toastError } from '../../utils/toast';

const SellerOrderManagement = () => {
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    },
    totalRevenue: 0
  });

  // Filter states
  const [filter, setFilter] = useState({
    all: true,
    pending: false,
    processing: false,
    shipped: false,
    delivered: false,
    cancelled: false
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Load shop ID first
  useEffect(() => {
    const loadShop = async () => {
      try {
        const shop = await ShopService.getMyShop();
        if (shop && shop._id) {
          setShopId(shop._id);
        } else {
          setError('Bạn chưa có cửa hàng. Vui lòng tạo cửa hàng trước.');
        }
      } catch (err) {
        console.error('Error loading shop:', err);
        setError('Không thể tải thông tin cửa hàng.');
      }
    };
    loadShop();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    
    try {
      setLoading(true);
      const response = await ApiService.get(`/order/shop/${shopId}`, true);
      
      // Backend trả về format: [{ order, orderDetails: [...] }] hoặc mảng orders trực tiếp
      let ordersList = [];
      if (Array.isArray(response)) {
        if (response.length > 0 && response[0].order) {
          // Format: [{ order, orderDetails }]
          ordersList = response.map(item => ({
            ...item.order,
            orderDetails: item.orderDetails || [],
            // Map old model fields to new model fields for consistency
            _id: item.order._id || item.order.id,
            order_status: item.order.order_status || item.order.status || 'pending',
            totalAmount: item.order.total_price || item.order.totalAmount || 0,
            customerId: item.order.customer_id || item.order.userId,
            createdAt: item.order.created_at || item.order.createdAt
          }));
        } else {
          // Format: [orders] - new model
          ordersList = response.map(order => ({
            ...order,
            order_status: order.status || order.order_status || 'PENDING',
            totalAmount: order.totalAmount || order.total_price || 0,
            customerId: order.userId || order.customer_id,
            createdAt: order.createdAt || order.created_at
          }));
        }
      }
      
      let filteredOrders = ordersList;
      
      // Apply status filter (normalize status to lowercase for comparison)
      if (filter.pending) {
        filteredOrders = filteredOrders.filter(order => {
          const status = (order.order_status || order.status || '').toLowerCase();
          return status === 'pending';
        });
      } else if (filter.processing) {
        filteredOrders = filteredOrders.filter(order => {
          const status = (order.order_status || order.status || '').toLowerCase();
          // New model uses 'confirmed', old model uses 'processing'
          return status === 'processing' || status === 'confirmed';
        });
      } else if (filter.shipped) {
        filteredOrders = filteredOrders.filter(order => {
          const status = (order.order_status || order.status || '').toLowerCase();
          // New model uses 'shipping', old model uses 'shipped'
          return status === 'shipped' || status === 'shipping';
        });
      } else if (filter.delivered) {
        filteredOrders = filteredOrders.filter(order => {
          const status = (order.order_status || order.status || '').toLowerCase();
          return status === 'delivered';
        });
      } else if (filter.cancelled) {
        filteredOrders = filteredOrders.filter(order => {
          const status = (order.order_status || order.status || '').toLowerCase();
          return status === 'cancelled';
        });
      }

      // Apply search
      if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
          (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customerId && 
            ((order.customerId.firstName && order.customerId.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (order.customerId.lastName && order.customerId.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (order.customerId.email && order.customerId.email.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          ) ||
          (order.totalAmount && order.totalAmount.toString().includes(searchTerm))
        );
      }

      // Sort by newest first
      filteredOrders.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

      setOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError('Lỗi khi tải dữ liệu đơn hàng: ' + (error.message || error));
      setLoading(false);
    }
  }, [shopId, filter, searchTerm]);

  const calculateStatistics = useCallback(() => {
    if (!shopId || !orders.length) return;
    
    const stats = {
      totalOrders: orders.length,
      ordersByStatus: {
        pending: orders.filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          return status === 'pending';
        }).length,
        processing: orders.filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          // New model uses 'confirmed', old model uses 'processing'
          return status === 'processing' || status === 'confirmed';
        }).length,
        shipped: orders.filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          // New model uses 'shipping', old model uses 'shipped'
          return status === 'shipped' || status === 'shipping';
        }).length,
        delivered: orders.filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          return status === 'delivered';
        }).length,
        cancelled: orders.filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          return status === 'cancelled';
        }).length
      },
      totalRevenue: orders
        .filter(o => {
          const status = (o.order_status || o.status || '').toLowerCase();
          return status === 'delivered';
        })
        .reduce((sum, o) => sum + (o.totalAmount || o.total_price || 0), 0)
    };
    
    setStatistics(stats);
  }, [shopId, orders]);

  // Fetch orders when shopId is available
  useEffect(() => {
    if (shopId) {
      fetchOrders();
    }
  }, [shopId, fetchOrders]);

  useEffect(() => {
    if (orders.length > 0) {
      calculateStatistics();
    }
  }, [orders, calculateStatistics]);

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleBackFromDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ApiService.put(`/order/status/${orderId}`, { status: newStatus }, true);
      toastSuccess('Cập nhật trạng thái đơn hàng thành công!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toastError('Lỗi khi cập nhật trạng thái: ' + (error.message || error));
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối đơn hàng này?')) return;
    
    try {
      await ApiService.put(`/order/reject/${orderId}`, {}, true);
      toastSuccess('Đã từ chối đơn hàng thành công!');
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toastError('Lỗi khi từ chối đơn hàng: ' + (error.message || error));
    }
  };

  const getStatusBadge = (status) => {
    // Normalize status to lowercase for mapping
    const normalizedStatus = (status || '').toLowerCase();
    
    const statusMap = {
      pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
      processing: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: <Package size={14} /> },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: <Package size={14} /> }, // New model uses CONFIRMED
      shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: <Truck size={14} /> },
      shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: <Truck size={14} /> }, // New model uses SHIPPING
      delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> }
    };
    
    const statusInfo = statusMap[normalizedStatus] || { label: status || 'N/A', color: 'bg-gray-100 text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  };

  if (showOrderDetail && selectedOrder) {
    return <OrderDetail orderId={selectedOrder._id} onBack={handleBackFromDetail} />;
  }

  if (error && !shopId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
        <p className="text-gray-600">Xem và xử lý đơn hàng của cửa hàng bạn</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Chờ xác nhận</div>
          <div className="text-2xl font-bold text-yellow-600">{statistics.ordersByStatus.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Đã xác nhận</div>
          <div className="text-2xl font-bold text-blue-600">{statistics.ordersByStatus.processing}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Doanh thu</div>
          <div className="text-2xl font-bold text-green-600">
            {statistics.totalRevenue.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter({ all: true, pending: false, processing: false, shipped: false, delivered: false, cancelled: false })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.all ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả ({statistics.totalOrders})
          </button>
          <button
            onClick={() => setFilter({ all: false, pending: true, processing: false, shipped: false, delivered: false, cancelled: false })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.pending ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chờ xác nhận ({statistics.ordersByStatus.pending})
          </button>
          <button
            onClick={() => setFilter({ all: false, pending: false, processing: true, shipped: false, delivered: false, cancelled: false })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.processing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã xác nhận ({statistics.ordersByStatus.processing})
          </button>
          <button
            onClick={() => setFilter({ all: false, pending: false, processing: false, shipped: true, delivered: false, cancelled: false })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.shipped ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đang giao ({statistics.ordersByStatus.shipped})
          </button>
          <button
            onClick={() => setFilter({ all: false, pending: false, processing: false, shipped: false, delivered: true, cancelled: false })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.delivered ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã giao ({statistics.ordersByStatus.delivered})
          </button>
          <button
            onClick={() => setFilter({ all: false, pending: false, processing: false, shipped: false, delivered: false, cancelled: true })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter.cancelled ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã hủy ({statistics.ordersByStatus.cancelled})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="animate-spin mx-auto text-blue-600" size={32} />
          <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="mx-auto text-gray-400" size={48} />
          <p className="mt-4 text-gray-600">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id?.slice(-8) || order.id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {(() => {
                        const customer = order.customerId || order.customer_id || order.userId;
                        if (customer && typeof customer === 'object') {
                          return customer.firstName && customer.lastName
                            ? `${customer.firstName} ${customer.lastName}`
                            : customer.email || 'N/A';
                        }
                        return 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(order.totalAmount || order.total_price || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.order_status || order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt 
                        ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                        : order.created_at
                        ? new Date(order.created_at).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye size={16} />
                          Chi tiết
                        </button>
                        {(() => {
                          const status = (order.order_status || order.status || '').toLowerCase();
                          if (status === 'pending') {
                            return (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(order._id || order.id, 'processing')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Xác nhận
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order._id || order.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Từ chối
                                </button>
                              </>
                            );
                          }
                          // New model uses 'confirmed', old model uses 'processing'
                          if (status === 'processing' || status === 'confirmed') {
                            return (
                              <button
                                onClick={() => handleUpdateStatus(order._id || order.id, 'shipped')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Giao hàng
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrderManagement;
