import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Package, AlertCircle } from 'lucide-react';
import ProductVariantService from '../../services/ProductVariantService';
import { toastSuccess, toastError } from '../../utils/toast';

const VariantManagement = ({ productId, onClose }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
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
    }
  });

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await ProductVariantService.getVariantsByProductId(productId);
      setVariants(data);
    } catch (error) {
      console.error('Error loading variants:', error);
      toastError('Không thể tải danh sách biến thể');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      attributes: { size: '', flavor: '', shape: '' },
      price: '',
      discountedPrice: '',
      sku: '',
      weight: { value: '', unit: 'g' },
      inventory: { quantity: '', lowStockThreshold: '10', trackInventory: true }
    });
    setIsEditing(false);
    setSelectedVariant(null);
    setShowVariantModal(true);
  };

  const handleEditClick = (variant) => {
    setFormData({
      name: variant.name || '',
      attributes: variant.attributes || { size: '', flavor: '', shape: '' },
      price: variant.price || '',
      discountedPrice: variant.discountedPrice || '',
      sku: variant.sku || '',
      weight: variant.weight || { value: '', unit: 'g' },
      inventory: variant.inventory || { quantity: 0, lowStockThreshold: 10, trackInventory: true }
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
        productId,
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
        }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Biến thể Sản phẩm</h2>
          <p className="text-gray-600">Thêm các biến thể (kích thước, vị) cho sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Thêm biến thể
          </button>
          
        </div>
      </div>

      {/* Variants List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {variants.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên biến thể</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thuộc tính</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>         
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => (
                <tr key={variant._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{variant.name}</div>
                    {variant.sku && (
                      <div className="text-sm text-gray-500">SKU: {variant.sku}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
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
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {variant.discountedPrice ? (
                        <>
                          <div className="text-lg font-semibold text-blue-600">
                            {variant.discountedPrice.toLocaleString('vi-VN')} ₫
                          </div>
                          <div className="text-sm text-gray-400 line-through">
                            {variant.price.toLocaleString('vi-VN')} ₫
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          {variant.price.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
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
                <div className="grid grid-cols-3 gap-4">
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

export default VariantManagement;

