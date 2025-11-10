import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, ClipboardList, Store, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import ProductService from '../services/ProductService';
import ShopService from '../services/ShopService';

const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </div>
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [hiddenCount, setHiddenCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const shopData = await ShopService.getMyShop().catch(() => null);
        setShop(shopData);

        const prodsResp = await ProductService.getProducts({ limit: 5, isActive: 'true' }).catch(() => ({ products: [] }));
        const prods = prodsResp.products || [];
        setProducts(prods);

        // Best-effort: count hidden by fetching active=false list if API supports, else 0
        try {
          const hiddenResp = await ProductService.getProducts({ limit: 1, isActive: 'false' });
          setHiddenCount(hiddenResp.pagination?.total || 0);
        } catch (e) {
          setHiddenCount(0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="text-gray-600">Tổng quan cửa hàng và thao tác nhanh</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/seller/products')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Tạo sản phẩm
          </button>
          <button
            onClick={() => navigate('/seller/orders')}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <ClipboardList size={18} /> Đơn hàng gần đây
          </button>
        </div>
      </div>

      {/* Shop status */}
      {shop && (
        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600"><Store size={20} /></div>
            <div>
              <div className="font-semibold text-gray-900">{shop.name || 'Cửa hàng của tôi'}</div>
              <div className="text-sm text-gray-500">Trạng thái: <span className={`font-medium ${shop.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>{shop.status}</span> {shop.isActive === false && <span className="text-red-600">(đang ẩn)</span>}</div>
            </div>
          </div>
          <button onClick={() => navigate('/seller/shop')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cập nhật thông tin</button>
        </div>
      )}

      {!shop && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5" size={18} />
          <div>
            <div className="font-semibold">Chưa có cửa hàng</div>
            <div className="text-sm">Hãy tạo cửa hàng để sử dụng đầy đủ tính năng người bán.</div>
          </div>
          <div className="ml-auto">
            <button onClick={() => navigate('/seller/shop')} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Tạo cửa hàng</button>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Package size={18} />} label="Sản phẩm đang bán" value={products.length} sub="5 sản phẩm gần đây" />
        <StatCard icon={<TrendingUp size={18} />} label="Doanh thu 7 ngày" value="—" sub="Sắp cập nhật" />
        <StatCard icon={<DollarSign size={18} />} label="Đang chờ thanh toán" value="—" sub="Sắp cập nhật" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders placeholder */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Đơn hàng gần đây</h3>
            <button onClick={() => navigate('/seller/orders')} className="text-blue-600 hover:underline text-sm">Xem tất cả</button>
          </div>
          <div className="text-gray-500 text-sm">Tính năng sẽ được bổ sung.</div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sản phẩm gần cập nhật</h3>
            <button onClick={() => navigate('/seller/products')} className="text-blue-600 hover:underline text-sm">Quản lý sản phẩm</button>
          </div>
          <div className="space-y-3">
            {products.map(p => (
              <div key={p._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 line-clamp-1 max-w-[240px]">{p.name}</div>
                    <div className="text-sm text-gray-500">{(p.discountedPrice || p.basePrice)?.toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
                <button onClick={() => navigate('/seller/products')} className="text-sm px-3 py-1 border rounded-lg hover:bg-gray-50">Chỉnh sửa</button>
              </div>
            ))}
            {products.length === 0 && <div className="text-gray-500 text-sm">Chưa có sản phẩm.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




