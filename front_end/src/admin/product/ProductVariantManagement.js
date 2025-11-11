import React, { useState, useEffect } from 'react';
import { Search, Package, AlertCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import ProductVariantService from '../../services/ProductVariantService';
import ProductService from '../../services/ProductService';
import { toastSuccess, toastError } from '../../utils/toast';

const ProductVariantManagement = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    productId: '',
    isActive: '',
    page: 1,
    limit: 5
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, pages: 0 });

  useEffect(() => {
    loadVariantsWithFilters(filters);
    loadProducts();
  }, [filters]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await ProductVariantService.getAll(filters);
      setVariants(data.variants || []);
      setPagination(data.pagination || { page: 1, limit: 5, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error loading variants:', error);
      toastError('Không thể tải danh sách biến thể');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await ProductService.getAll({ page: 1, limit: 100 });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: key === 'page' ? value : 1 };
      // Gọi loadVariants ngay sau khi setFilters
      loadVariantsWithFilters(newFilters);
      return newFilters;
    });
  };
  const loadVariantsWithFilters = async (currentFilters) => {
    try {
      setLoading(true);
      const data = await ProductVariantService.getAll(currentFilters);
      setVariants(data.variants || []);
      setPagination(data.pagination || { page: 1, limit: 5, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error loading variants:', error);
      toastError('Không thể tải danh sách biến thể');
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    loadVariants();
  };

  const handleDeleteClick = async (variant) => {
    if (window.confirm(`Xóa biến thể "${variant.name}"?`)) {
      try {
        await ProductVariantService.deleteVariant(variant._id);
        await loadVariants();
        toastSuccess('Xóa thành công!');
      } catch (error) {
        console.error('Error deleting variant:', error);
        toastError('Không thể xóa biến thể: ' + (error.message || 'Lỗi không xác định'));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getVariantStatusLabel = (variant) => {
    const productStatus = variant.productId?.status;
    if (productStatus !== 'ACTIVE') return 'Khóa';
    return variant.isActive ? 'Đang bán' : 'Tạm dừng';
  };

  const getVariantStatusColor = (variant) => {
    const productStatus = variant.productId?.status;
    if (productStatus !== 'ACTIVE') return 'bg-red-100 text-red-800';
    return variant.isActive
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading && variants.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Quản lý Biến thể Sản phẩm</h2>
        <p className="text-sm sm:text-base text-gray-600">Xem và xóa biến thể sản phẩm</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Tìm theo tên hoặc SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm</label>
            <select
              value={filters.productId}
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tất cả</option>
              <option value="true">Hoạt động</option>
              <option value="false">Tạm dừng</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Search size={20} />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <span className="sm:hidden">Tìm</span>
          </button>
        </form>
      </div>

      {/* Variants List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {variants.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên biến thể</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thuộc tính</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => (
                    <tr key={variant._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {variant.productId?.name || 'N/A'}
                        </div>
                        {variant.productId?.shopId?.name && (
                          <div className="text-sm text-gray-500">
                            Shop: {variant.productId.shopId.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-900">{variant.name}</div>
                        {variant.sku && (
                          <div className="text-sm text-gray-500">SKU: {variant.sku}</div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {variant.attributes.size && (
                            <div>Size: <span className="font-medium">{variant.attributes.size}</span></div>
                          )}
                          {variant.attributes.flavor && (
                            <div>Vị: <span className="font-medium">{variant.attributes.flavor}</span></div>
                          )}
                          {variant.attributes.shape && (
                            <div>Hình: <span className="font-medium">{variant.attributes.shape}</span></div>
                          )}
                          {!variant.attributes.size && !variant.attributes.flavor && !variant.attributes.shape && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          {variant.discountedPrice ? (
                            <>
                              <div className="text-lg font-semibold text-blue-600">
                                {formatCurrency(variant.discountedPrice)} ₫
                              </div>
                              <div className="text-sm text-gray-400 line-through">
                                {formatCurrency(variant.price)} ₫
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(variant.price)} ₫
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${variant.inventory.quantity === 0 ? 'text-red-600' :
                              variant.inventory.quantity <= variant.inventory.lowStockThreshold ? 'text-orange-600' :
                                'text-green-600'
                            }`}>
                            {variant.inventory.quantity}
                          </span>
                          {variant.inventory.quantity <= variant.inventory.lowStockThreshold && (
                            <AlertCircle size={16} className="text-orange-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVariantStatusColor(variant)}`}>
                          {getVariantStatusLabel(variant)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteClick(variant)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {variants.map((variant) => (
                  <div key={variant._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{variant.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {variant.productId?.name || 'N/A'}
                        </p>
                        {variant.productId?.shopId?.name && (
                          <p className="text-xs text-gray-500">Shop: {variant.productId.shopId.name}</p>
                        )}
                        {variant.sku && (
                          <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteClick(variant)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Thuộc tính</p>
                        <div className="text-sm text-gray-700">
                          {variant.attributes.size && (
                            <div>Size: <span className="font-medium">{variant.attributes.size}</span></div>
                          )}
                          {variant.attributes.flavor && (
                            <div>Vị: <span className="font-medium">{variant.attributes.flavor}</span></div>
                          )}
                          {variant.attributes.shape && (
                            <div>Hình: <span className="font-medium">{variant.attributes.shape}</span></div>
                          )}
                          {!variant.attributes.size && !variant.attributes.flavor && !variant.attributes.shape && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Giá</p>
                        <div>
                          {variant.discountedPrice ? (
                            <>
                              <div className="text-base font-semibold text-blue-600">
                                {formatCurrency(variant.discountedPrice)} ₫
                              </div>
                              <div className="text-xs text-gray-400 line-through">
                                {formatCurrency(variant.price)} ₫
                              </div>
                            </>
                          ) : (
                            <div className="text-base font-semibold text-gray-900">
                              {formatCurrency(variant.price)} ₫
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Tồn kho:</span>
                        <span className={`font-medium ${variant.inventory.quantity === 0 ? 'text-red-600' :
                            variant.inventory.quantity <= variant.inventory.lowStockThreshold ? 'text-orange-600' :
                              'text-green-600'
                          }`}>
                          {variant.inventory.quantity}
                        </span>
                        {variant.inventory.quantity <= variant.inventory.lowStockThreshold && (
                          <AlertCircle size={14} className="text-orange-500" />
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVariantStatusColor(variant)}`}>
                        {getVariantStatusLabel(variant)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {pagination.pages > 1 && (
              <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} biến thể
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-700">
                    Trang {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có biến thể nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariantManagement;