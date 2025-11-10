import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductVariantService from '../../services/ProductVariantService';
import ProductService from '../../services/ProductService';
import { toastSuccess, toastError } from '../../utils/toast';

const ProductVariantManagement = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    productId: '',
    isActive: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    attributes: {
      size: '',
      flavor: '',
      shape: ''
    },
    price: '',
    discountedPrice: '',
    sku: '',
    weight: { value: '', unit: 'g' },
    inventory: {
      quantity: '',
      lowStockThreshold: '10',
      trackInventory: true
    },
    isActive: true
  });

  useEffect(() => {
    loadVariants();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await ProductVariantService.getAll(filters);
      setVariants(data.variants || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
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
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadVariants();
  };

  const handleCreateClick = () => {
    setFormData({
      productId: '',
      name: '',
      attributes: { size: '', flavor: '', shape: '' },
      price: '',
      discountedPrice: '',
      sku: '',
      weight: { value: '', unit: 'g' },
      inventory: { quantity: '', lowStockThreshold: '10', trackInventory: true },
      isActive: true
    });
    setIsEditing(false);
    setSelectedVariant(null);
    setShowVariantModal(true);
  };

  const handleEditClick = (variant) => {
    setFormData({
      productId: variant.productId?._id || variant.productId || '',
      name: variant.name || '',
      attributes: variant.attributes || { size: '', flavor: '', shape: '' },
      price: variant.price || '',
      discountedPrice: variant.discountedPrice || '',
      sku: variant.sku || '',
      weight: variant.weight || { value: '', unit: 'g' },
      inventory: variant.inventory || { quantity: 0, lowStockThreshold: 10, trackInventory: true },
      isActive: variant.isActive !== undefined ? variant.isActive : true
    });
    setSelectedVariant(variant);
    setIsEditing(true);
    setShowVariantModal(true);
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const variantData = {
        productId: formData.productId,
        name: formData.name,
        attributes: {
          size: formData.attributes.size || undefined,
          flavor: formData.attributes.flavor || undefined,
          shape: formData.attributes.shape || undefined
        },
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        sku: formData.sku || undefined,
        weight: {
          value: parseFloat(formData.weight.value) || 0,
          unit: formData.weight.unit
        },
        inventory: {
          quantity: parseInt(formData.inventory.quantity) || 0,
          lowStockThreshold: parseInt(formData.inventory.lowStockThreshold) || 10,
          trackInventory: formData.inventory.trackInventory
        },
        isActive: formData.isActive
      };

      if (isEditing) {
        await ProductVariantService.updateVariant(selectedVariant._id, variantData);
      } else {
        await ProductVariantService.createVariant(variantData);
      }

      await loadVariants();
      setShowVariantModal(false);
      toastSuccess('Lưu thành công!');
    } catch (error) {
      console.error('Error saving variant:', error);
      toastError('Không thể lưu biến thể: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Quản lý Biến thể Sản phẩm</h2>
          <p className="text-sm sm:text-base text-gray-600">Quản lý tất cả biến thể sản phẩm trong hệ thống</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Thêm biến thể</span>
          <span className="sm:hidden">Thêm</span>
        </button>
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
                          <span className={`font-medium ${
                            variant.inventory.quantity === 0 ? 'text-red-600' :
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(variant)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(variant)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(variant)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(variant)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
                        <span className={`font-medium ${
                          variant.inventory.quantity === 0 ? 'text-red-600' :
                          variant.inventory.quantity <= variant.inventory.lowStockThreshold ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {variant.inventory.quantity}
                        </span>
                        {variant.inventory.quantity <= variant.inventory.lowStockThreshold && (
                          <AlertCircle size={14} className="text-orange-500" />
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination */}
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
            <p className="text-gray-500 mb-4">Chưa có biến thể nào</p>
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mx-auto"
            >
              <Plus size={20} />
              Thêm biến thể đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Chỉnh sửa Biến thể' : 'Thêm Biến thể Mới'}
              </h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sản phẩm *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  required
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên biến thể *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Nhỏ - Vị Dâu, Vừa - Vị Socola"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kích thước
                  </label>
                  <select
                    value={formData.attributes.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      attributes: {...formData.attributes, size: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Chọn size</option>
                    <option value="SMALL">Nhỏ</option>
                    <option value="MEDIUM">Vừa</option>
                    <option value="LARGE">Lớn</option>
                    <option value="EXTRA_LARGE">Rất lớn</option>
                    <option value="CUSTOM">Tùy chỉnh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị
                  </label>
                  <input
                    type="text"
                    value={formData.attributes.flavor}
                    onChange={(e) => setFormData({
                      ...formData,
                      attributes: {...formData.attributes, flavor: e.target.value}
                    })}
                    placeholder="VD: Dâu, Socola, Vanilla"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình dạng
                  </label>
                  <input
                    type="text"
                    value={formData.attributes.shape}
                    onChange={(e) => setFormData({
                      ...formData,
                      attributes: {...formData.attributes, shape: e.target.value}
                    })}
                    placeholder="VD: Tròn, Vuông, Trái tim"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá (₫) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá khuyến mãi (₫)
                  </label>
                  <input
                    type="number"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({...formData, discountedPrice: e.target.value})}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trọng lượng
                  </label>
                  <input
                    type="number"
                    value={formData.weight.value}
                    onChange={(e) => setFormData({
                      ...formData,
                      weight: {...formData.weight, value: e.target.value}
                    })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn vị
                  </label>
                  <select
                    value={formData.weight.unit}
                    onChange={(e) => setFormData({
                      ...formData,
                      weight: {...formData.weight, unit: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Quản lý Tồn kho</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      value={formData.inventory.quantity}
                      onChange={(e) => setFormData({
                        ...formData,
                        inventory: {...formData.inventory, quantity: e.target.value}
                      })}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng cảnh báo
                    </label>
                    <input
                      type="number"
                      value={formData.inventory.lowStockThreshold}
                      onChange={(e) => setFormData({
                        ...formData,
                        inventory: {...formData.inventory, lowStockThreshold: e.target.value}
                      })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theo dõi tồn kho
                    </label>
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={formData.inventory.trackInventory}
                        onChange={(e) => setFormData({
                          ...formData,
                          inventory: {...formData.inventory, trackInventory: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Bật theo dõi</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hoạt động</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantManagement;

