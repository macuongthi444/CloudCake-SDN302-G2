// src/components/modal/ProductDetailModal.jsx
import React from 'react';
import { X, Package, Tag, Info, AlertCircle, Clock, Calendar, Store } from 'lucide-react';

const ProductDetailModal = ({ product, onClose }) => {
  if (!product) return null;

  const formatPrice = (price) => price?.toLocaleString('vi-VN') + ' ₫' || '-';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Chi tiết sản phẩm</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="text-blue-600" size={20} />
                Hình ảnh
              </h3>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.url}
                        alt={`Hình ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Chính
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center">
                  <Package size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Info className="text-blue-600" size={20} />
                  Thông tin cơ bản
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên sản phẩm:</span>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-mono text-sm">{product.sku || 'Chưa có'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Danh mục:</span>
                    <span className="font-medium">{product.categoryId?.name || 'Chưa chọn'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cửa hàng:</span>
                    <span className="font-medium flex items-center gap-2">
                      <Store size={16} />
                      {product.shopId?.name || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Tag className="text-green-600" size={20} />
                  Giá bán
                </h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-gray-600">Giá gốc:</span>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(product.basePrice)}
                      </div>
                    </div>
                    {product.discountedPrice ? (
                      <div className="text-right">
                        <span className="text-gray-600">Giá khuyến mãi:</span>
                        <div className="text-3xl font-bold text-red-600">
                          {formatPrice(product.discountedPrice)}
                        </div>
                        <span className="text-sm text-red-600">
                          -{Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-green-600 font-medium">Không giảm giá</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="mx-auto mb-2 text-blue-600" size={32} />
              <span className="text-sm text-gray-600">Trạng thái</span>
              <div className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${
                product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                product.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                product.status === 'OUT_OF_STOCK' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {product.status === 'ACTIVE' ? 'Đang bán' :
                 product.status === 'DRAFT' ? 'Nháp' :
                 product.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Ẩn'}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Calendar className="mx-auto mb-2 text-purple-600" size={32} />
              <span className="text-sm text-gray-600">Ngày tạo</span>
              <div className="mt-1 font-medium">
                {new Date(product.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <AlertCircle className="mx-auto mb-2 text-amber-600" size={32} />
              <span className="text-sm text-gray-600">Cập nhật lần cuối</span>
              <div className="mt-1 font-medium">
                {new Date(product.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Mô tả sản phẩm</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {product.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              ) : (
                <p className="text-gray-400 italic">Chưa có mô tả</p>
              )}
            </div>
          </div>

          {/* Tags & Ingredients */}
          {(product.tags?.length > 0 || product.ingredients?.length > 0 || product.allergens?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.tags?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.ingredients?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Nguyên liệu</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.allergens?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Chất gây dị ứng</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((all, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {all}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weight & Shelf Life */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Khối lượng</h4>
              <p className="text-2xl font-bold text-gray-900">
                {product.weight?.value || 0} {product.weight?.unit || 'g'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Hạn sử dụng</h4>
              <p className="text-2xl font-bold text-gray-900">
                {product.shelfLife?.value || 1} {product.shelfLife?.unit || 'ngày'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;