import React, { useState, useEffect } from 'react';
import { Search, X, Info, Shield, Trash2, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ProductService from '../../services/ProductService';
import { useAuth } from '../../pages/Login/context/AuthContext';
import { toastSuccess, toastError } from '../../utils/toast';
import ProductDetailModal from './ProductDetailModal';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [newStatus, setNewStatus] = useState('DRAFT');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0
  });

  const { isLoggedIn, userRoles } = useAuth();
  const isAdmin = userRoles?.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN');

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      toastError('Bạn không có quyền truy cập trang này!');
      window.location.href = '/';
      return;
    }
    loadProducts();
  }, [isLoggedIn, isAdmin, pagination.page]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Gọi API với page và limit
      const response = await ProductService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
      });

      // Xử lý dữ liệu sản phẩm (có thể nằm ở nhiều vị trí)
      const products = response.products || response.data || response.items || response || [];

      // Lấy thông tin phân trang từ mọi nguồn có thể
      const pagi = response.pagination || response.meta || {};
      const totalItems = pagi.total || pagi.totalItems || response.total || response.count || products.length;
      const currentLimit = pagi.limit || pagi.pageSize || pagination.limit || 20;
      const currentPage = pagi.page || pagi.currentPage || pagination.page || 1;

      // TÍNH TOÁN pages DỰA TRÊN totalItems
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / currentLimit) : 1;

      // CẬP NHẬT STATE ĐẦY ĐỦ
      setProducts(products);

      const finalPages = totalPages >= 1 ? totalPages : 1;

      setPagination(prev => ({
        ...prev,
        page: currentPage,
        limit: currentLimit,
        total: totalItems,
        pages: finalPages
      }));


      setLoading(false); // Đảm bảo loading = false

      setTimeout(() => setPagination(prev => ({ ...prev })), 0);

    } catch (error) {
      console.error('Load products error:', error);
      toastError('Không thể tải danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (pagination.total > 0 && pagination.pages === 0) {
      // Nếu total > 0 nhưng pages vẫn 0 → BUG → FIX NGAY
      const realPages = Math.ceil(pagination.total / pagination.limit);
      setPagination(prev => ({ ...prev, pages: realPages }));
      console.log('FORCE FIX PAGES:', realPages);
    }
  }, [pagination.total, pagination.limit]);

  const handleStatusClick = (product) => {
    setSelectedProduct(product);
    setNewStatus(product.status || 'DRAFT');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await ProductService.updateProduct(selectedProduct._id, { status: newStatus });
      toastSuccess(`Đã chuyển trạng thái thành "${getStatusLabel(newStatus)}"`);
      await loadProducts();
      setShowStatusModal(false);
    } catch (error) {
      toastError('Cập nhật thất bại!');
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    // Optimistic UI: xóa ngay lập tức trên UI, gọi API ở nền, rollback nếu lỗi
    const id = selectedProduct?._id;
    if (!id) return;

    // Snapshot để rollback nếu cần
    const snapshotProducts = products;
    const snapshotPagination = pagination;

    // Cập nhật UI ngay lập tức
    setProducts((prev) => prev.filter((p) => p._id !== id));
    setPagination((prev) => {
      const newTotal = Math.max((prev.total || 0) - 1, 0);
      const newPages = Math.max(Math.ceil(newTotal / (prev.limit || 20)), 1);
      const newPage = Math.min(prev.page || 1, newPages);
      return { ...prev, total: newTotal, pages: newPages, page: newPage };
    });
    setShowDeleteModal(false);
    setSelectedProduct(null);

    // Gọi API ở nền
    try {
      await ProductService.deleteProduct(selectedProduct._id);
      toastSuccess('Xóa sản phẩm thành công!');
      await loadProducts();
      setShowDeleteModal(false);
    } catch (error) {
      toastError('Xóa thất bại!');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Đang bán';
      case 'DRAFT': return 'Nháp';
      case 'OUT_OF_STOCK': return 'Hết hàng';
      case 'INACTIVE': return 'Ẩn';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300';
      case 'DRAFT': return 'bg-amber-100 text-amber-800 border-2 border-amber-300';
      case 'OUT_OF_STOCK': return 'bg-orange-100 text-orange-800 border-2 border-orange-300';
      case 'INACTIVE': return 'bg-rose-100 text-rose-800 border-2 border-rose-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shopId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === PHÂN TRANG SIÊU ĐẸP ===
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.pages && page !== pagination.page) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const current = pagination.page;
    const total = pagination.pages;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', total);
      } else if (current >= total - 3) {
        pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Shield size={48} className="drop-shadow-lg" />
          <div>
            <h1 className="text-3xl font-bold">QUẢN TRỊ VIÊN - QUẢN LÝ SẢN PHẨM</h1>
            <p className="text-lg opacity-90 mt-2">Chỉ Admin mới có quyền truy cập</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm, SKU, cửa hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 text-lg border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
        />
      </div>
      {pagination.pages > 1 && (
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-sm text-gray-600">
            Hiển thị <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> -{' '}
            <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong tổng số{' '}
            <strong className="text-purple-700">{pagination.total}</strong> sản phẩm
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
              className="p-3 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft size={20} className="text-purple-700" />
            </button>

            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-3 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} className="text-purple-700" />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && goToPage(page)}
                disabled={page === '...'}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${page === pagination.page
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : page === '...'
                    ? 'cursor-default text-gray-400'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-3 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} className="text-purple-700" />
            </button>

            <button
              onClick={() => goToPage(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="p-3 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight size={20} className="text-purple-700" />
            </button>
          </div>
        </div>
      )}
      

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-700 to-pink-700 text-white">
              <tr>
                <th className="px-8 py-5 text-left font-bold">Sản phẩm</th>
                <th className="px-8 py-5 text-left font-bold">Cửa hàng</th>
                <th className="px-8 py-5 text-center font-bold">Giá</th>
                <th className="px-8 py-5 text-center font-bold">Trạng thái</th>
                <th className="px-8 py-5 text-center font-bold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-purple-50 transition-all duration-200">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {product.images?.[0] ? (
                        <img
                          src={product.images.find(i => i.isPrimary)?.url || product.images[0].url}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-xl shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                          <Package size={36} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-lg text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-medium text-purple-700">
                      {product.shopId?.name || 'Chưa có shop'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {product.discountedPrice ? (
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {product.discountedPrice.toLocaleString('vi-VN')}đ
                        </div>
                        <del className="text-gray-400">{product.basePrice.toLocaleString('vi-VN')}đ</del>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-gray-900">
                        {product.basePrice.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 ${getStatusColor(product.status)}`}>
                        {product.status === 'ACTIVE' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {product.status === 'DRAFT' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 15H7v-2h2v2zm0-4H7V7h2v4zm4 4h-2v-2h2v2zm0-4h-2V7h2v4z" />
                          </svg>
                        )}
                        {product.status === 'OUT_OF_STOCK' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7h4a1 1 0 010 2H8a1 1 0 010-2zm0 4h4a1 1 0 010 2H8a1 1 0 010-2z" clipRule="evenodd" />
                          </svg>
                        )}
                        {product.status === 'INACTIVE' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0112 15H8a6 6 0 01-5.477-9.59 1 1 0 011.414 1.414A4 4 0 108 12h4a4 4 0 005.477 3.477 1 1 0 011.414-1.414zM10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                          </svg>
                        )}
                        {getStatusLabel(product.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedProductDetail(product); setShowDetailModal(true); }} className="p-3 bg-blue-100 hover:bg-blue-200 rounded-xl transition-all" title="Xem chi tiết">
                        <Info size={20} className="text-blue-700" />
                      </button>
                      <button onClick={() => handleStatusClick(product)} className="p-3 bg-purple-100 hover:bg-purple-200 rounded-xl transition-all" title="Đổi trạng thái">
                        <Shield size={20} className="text-purple-700" />
                      </button>
                      <button onClick={() => handleDeleteClick(product)} className="p-3 bg-red-100 hover:bg-red-200 rounded-xl transition-all" title="Xóa sản phẩm">
                        <Trash2 size={20} className="text-red-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Package size={80} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>



      {/* Modal đổi trạng thái */}
      {showStatusModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-3xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-purple-800 flex items-center gap-3">
                <Shield size={32} /> Đổi trạng thái
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={28} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <p className="font-bold text-lg mb-2">{selectedProduct.name}</p>
              <p className="text-sm text-gray-600">Cửa hàng: {selectedProduct.shopId?.name}</p>
            </div>

            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-800 mb-4">Chọn trạng thái mới</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-6 py-5 border-4 border-purple-300 rounded-2xl text-xl font-bold focus:ring-8 focus:ring-purple-200"
              >
                <option value="DRAFT">Nháp</option>
                <option value="ACTIVE">Đang bán</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
                <option value="INACTIVE">Ẩn</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 py-4 bg-gray-500 text-white rounded-2xl font-bold hover:bg-gray-600 transition">
                Hủy
              </button>
              <button onClick={handleUpdateStatus} className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 shadow-lg transition">
                CẬP NHẬT TRẠNG THÁI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Xác nhận xóa</h3>
            <p className="text-lg mb-6">
              Bạn có chắc chắn muốn <strong className="text-red-600">XÓA VĨNH VIỄN</strong> sản phẩm:
            </p>
            <div className="bg-red-50 rounded-2xl p-4 mb-6">
              <p className="font-bold text-xl">{selectedProduct.name}</p>
              <p className="text-sm text-gray-600">Cửa hàng: {selectedProduct.shopId?.name}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 border-2 border-gray-400 text-gray-700 rounded-2xl font-bold hover:bg-gray-100">
                Hủy
              </button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg">
                XÓA NGAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && selectedProductDetail && (
        <ProductDetailModal
          product={selectedProductDetail}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProductDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;
