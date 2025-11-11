import React, { useEffect, useState } from 'react';
import ProductService from '../../services/ProductService';
import CategoryService from '../../services/CategoryService';
import { toastError, toastSuccess } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import ModalPortal from '../../components/ModalPortal';

const SellerProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    description: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadMyProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getMyProducts({ page, limit });
      setProducts(data.products || []);
      setPages(data.pagination?.pages || 0);
    } catch (err) {
      console.error('Error loading my products:', err);
      toastError('Không thể tải sản phẩm của bạn');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(true);
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (e) {
      console.warn('Không thể tải danh mục:', e);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.categoryId || !createForm.basePrice) {
      toastError('Vui lòng nhập Tên, Danh mục và Giá');
      return;
    }
    try {
      setCreating(true);
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description?.trim() || '',
        categoryId: createForm.categoryId,
        basePrice: Number(createForm.basePrice)
      };
      const result = await ProductService.createProduct(payload, []); // no images for quick add
      toastSuccess('Tạo sản phẩm thành công');
      setShowCreate(false);
      setCreateForm({ name: '', categoryId: '', basePrice: '', description: '' });
      // prepend new product for responsiveness
      await loadMyProducts();
      if (result?.product?._id) {
        // navigate to edit detail if needed
        // navigate(`/seller/products/${result.product._id}`);
      }
    } catch (err) {
      console.error('Create product error:', err);
      toastError(typeof err === 'string' ? err : (err.message || 'Lỗi tạo sản phẩm'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!productId) return;
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      setDeletingId(productId);
      await ProductService.deleteProduct(productId);
      toastSuccess('Đã xóa sản phẩm');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.error('Delete product error:', err);
      toastError(typeof err === 'string' ? err : (err.message || 'Lỗi xóa sản phẩm'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm của tôi</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p._id} className="bg-white rounded-lg shadow p-4">
            <div className="h-40 w-full bg-gray-100 rounded mb-3 overflow-hidden">
              {p.images?.[0]?.url ? (
                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="font-medium text-gray-900 line-clamp-2">{p.name}</div>
            <div className="text-sm text-gray-500 mt-1">{(p.discountedPrice || p.basePrice)?.toLocaleString('vi-VN')} ₫</div>
            <div className="flex gap-2 mt-4">
              <button
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                onClick={() => navigate(`/seller/products/${p._id}`)}
              >
                Chỉnh sửa
              </button>
              <button
                className="px-3 py-1 text-sm border rounded-lg hover:bg-red-50 text-red-600 border-red-300 disabled:opacity-50"
                onClick={() => handleDelete(p._id)}
                disabled={deletingId === p._id}
              >
                {deletingId === p._id ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-gray-500">Chưa có sản phẩm nào.</div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Trang trước
          </button>
          <span className="px-3 py-1">Trang {page}/{pages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            Trang sau
          </button>
        </div>
      )}

      {showCreate && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 z-[1000]"></div>
          <div className="fixed inset-0 z-[1001] flex items-center justify-center">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Thêm sản phẩm</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select
                  name="categoryId"
                  value={createForm.categoryId}
                  onChange={handleCreateChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản (₫) *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="basePrice"
                  value={createForm.basePrice}
                  onChange={handleCreateChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  rows="3"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả ngắn về sản phẩm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default SellerProductManagement;


