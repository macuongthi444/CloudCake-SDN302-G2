
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';
import ApiService from '../../services/ApiService';
import ShopService from '../../services/ShopService';
import { toastError } from '../../utils/toast';

const SellerPayoutsPage = () => {
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    pendingPayout: 0,
    completedPayout: 0,
    thisMonth: 0,
    lastMonth: 0
  });
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]); // [{label, value}]

  useEffect(() => {
    const loadData = async () => {
      try {
        const shop = await ShopService.getMyShop();
        if (shop && shop._id) {
          setShopId(shop._id);
          await loadStatistics(shop._id);
          await loadOrders(shop._id);
        }
      } catch (error) {
        console.error('Error loading shop:', error);
        toastError('Không thể tải thông tin cửa hàng');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const normalizeShopOrders = (raw) => {
    const list = Array.isArray(raw) ? raw : [];
    return list.map(item => {
      const o = item.order ? { ...item.order } : { ...item };
      return {
        ...o,
        id: o._id || o.id,
        order_status: (o.order_status || o.status || '').toString().toLowerCase(),
        paymentStatus: (o.paymentStatus || o.status_id || '').toString().toLowerCase(),
        totalAmount: o.totalAmount ?? o.total_price ?? 0,
        createdAt: o.createdAt ?? o.created_at,
        updatedAt: o.updatedAt ?? o.updated_at
      };
    });
  };

  const loadStatistics = async (shopId) => {
    try {
      // Get orders for this shop
      const response = await ApiService.get(`/order/shop/${shopId}`, true);
      const shopOrders = normalizeShopOrders(response);

      // Calculate statistics
      const deliveredOrders = shopOrders.filter(o => o.order_status === 'delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthOrders = deliveredOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= thisMonthStart;
      });

      const lastMonthOrders = deliveredOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });

      const thisMonth = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastMonth = lastMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      const pendingOrders = shopOrders.filter(o => 
        ['processing', 'shipped'].includes(o.order_status) && o.paymentStatus === 'paid'
      );
      const pendingPayout = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      // Build last 6 months series for chart
      const nowYM = new Date(now.getFullYear(), now.getMonth(), 1);
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowYM.getFullYear(), nowYM.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`, value: 0 });
      }
      const byKey = Object.fromEntries(months.map(m => [m.key, m]));
      deliveredOrders.forEach(o => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (byKey[key]) byKey[key].value += o.totalAmount;
      });
      setChartData(months);

      setStatistics({
        totalRevenue,
        pendingPayout,
        completedPayout: totalRevenue,
        thisMonth,
        lastMonth
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadOrders = async (shopId) => {
    try {
      const response = await ApiService.get(`/order/shop/${shopId}`, true);
      const shopOrders = normalizeShopOrders(response);
      
      // Filter only delivered orders for payout tracking
      const deliveredOrders = shopOrders
        .filter(o => o.order_status === 'delivered')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20); // Latest 20 orders

      setOrders(deliveredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handlePayOrder = async (order) => {
    try {
      setPayingOrderId(order._id || order.id);
      // Call VNPay create URL API
      const res = await ApiService.post('/payment/vnpay/create', { orderId: order._id || order.id }, true);
      const paymentUrl = res?.paymentUrl || res?.url || '';
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán');
      }
    } catch (err) {
      console.error('Create payment URL error:', err);
      toastError('Không tạo được URL thanh toán');
    } finally {
      setPayingOrderId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderBarChart = () => {
    const width = 900;
    const height = 260;
    const padding = { top: 10, right: 20, bottom: 40, left: 50 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const barW = innerW / Math.max(chartData.length, 1) - 12;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {/* Y axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + innerH - t * innerH;
          const val = Math.round((t * maxVal));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eee" />
              <text x={padding.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="#6b7280">
                {formatCurrency(val).replace(/\s?₫/,'')}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {chartData.map((d, idx) => {
          const x = padding.left + idx * (innerW / chartData.length) + 6;
          const h = (d.value / maxVal) * innerH;
          const y = padding.top + innerH - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill="#3b82f6" />
              <text x={x + barW / 2} y={height - padding.bottom + 16} fontSize="10" textAnchor="middle" fill="#6b7280">
                {d.label}
              </text>
              <text x={x + barW / 2} y={y - 6} fontSize="10" textAnchor="middle" fill="#1f2937">
                {d.value > 0 ? formatCurrency(d.value) : ''}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <RefreshCw className="animate-spin mx-auto text-blue-600" size={32} />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thanh toán & Doanh thu</h1>
        <p className="text-gray-600">Theo dõi doanh thu và thanh toán của cửa hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(statistics.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang chờ thanh toán</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {formatCurrency(statistics.pendingPayout)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tháng này</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(statistics.thisMonth)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tháng trước</p>
              <p className="text-2xl font-bold text-gray-600 mt-2">
                {formatCurrency(statistics.lastMonth)}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Calendar className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ doanh thu 6 tháng gần nhất</h3>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2" />
              <p>Chưa có dữ liệu</p>
            </div>
          </div>
        ) : (
          <div className="w-full">{renderBarChart()}</div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Đơn hàng đã giao (gần đây)</h3>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày giao</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái thanh toán</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    Chưa có đơn hàng nào đã giao
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id || order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id?.slice(-8) || order.id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.updatedAt 
                        ? new Date(order.updatedAt).toLocaleDateString('vi-VN')
                        : order.updated_at
                        ? new Date(order.updated_at).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {order.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handlePayOrder(order)}
                          disabled={payingOrderId === (order._id || order.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {payingOrderId === (order._id || order.id) ? 'Đang tạo...' : 'Thanh toán'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Thông tin về thanh toán</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Doanh thu được tính từ các đơn hàng đã giao thành công</li>
          <li>Thanh toán sẽ được chuyển vào tài khoản của bạn sau khi đơn hàng được xác nhận giao thành công</li>
          <li>Thời gian xử lý thanh toán: 3-5 ngày làm việc</li>
        </ul>
      </div>
    </div>
  );
};

export default SellerPayoutsPage;
