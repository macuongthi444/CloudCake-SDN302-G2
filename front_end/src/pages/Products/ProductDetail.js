import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Plus, Minus, Package, Heart } from 'lucide-react';
import ProductService from '../../services/ProductService';
import CartService from '../../services/CartService';
import { useAuth } from '../../pages/Login/context/AuthContext';
import { useCart } from '../Login/context/CartContext';
import { toastSuccess, toastError, toastWarning } from '../../utils/toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { setCart } = useCart();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProductById(id);
      setProduct(data.product);
      setVariants(data.variants || []);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
      if (!currentUser || !currentUser.id) {
        toastWarning('Vui lòng đăng nhập để thêm vào giỏ hàng');
        navigate('/login');
        return;
      }

      if (!selectedVariant) {
        toastWarning('Vui lòng chọn biến thể sản phẩm');
        return;
      }

      if (selectedVariant.inventory && 
          (selectedVariant.inventory.quantity === 0 || selectedVariant.inventory.quantity < quantity)) {
        toastError('Sản phẩm không đủ số lượng trong kho');
        return;
      }

    try {
      setAddingToCart(true);
      const resp = await CartService.addItemToCart({
        userId: currentUser.id,
        productId: product._id,
        variantId: selectedVariant._id,
        productName: product.name,
        variantName: selectedVariant.name,
        quantity: quantity,
        price: selectedVariant.discountedPrice || selectedVariant.price,
        image: selectedVariant.image || (product.images && product.images[0]?.url)
      });

      // Update global cart if available to avoid an extra GET when opening cart page
      if (resp) {
        // Backend returns the updated cart object
        try { setCart(resp); } catch (e) { /* ignore if context not available */ }
      }

      toastSuccess('Đã thêm vào giỏ hàng!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toastError('Không thể thêm vào giỏ hàng: ' + (error.message || error));
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (selectedVariant && selectedVariant.inventory.quantity) {
      const maxQuantity = selectedVariant.inventory.quantity;
      setQuantity(prev => Math.min(prev + 1, maxQuantity));
    } else {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Không tìm thấy sản phẩm</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = selectedVariant
    ? (selectedVariant.discountedPrice || selectedVariant.price)
    : (product.discountedPrice || product.basePrice);
  
  const basePrice = selectedVariant
    ? selectedVariant.price
    : product.basePrice;

  const images = product.images || [];
  const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div>
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package size={64} className="text-gray-400" />
                </div>
              )}
              
              {/* Additional Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {images.slice(1, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img.url}
                      alt={`${product.name} - ${index + 2}`}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Rating */}
              {product.rating && product.rating.average > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.floor(product.rating.average) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating.average.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({product.rating.count} đánh giá)</span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                {selectedVariant && selectedVariant.discountedPrice ? (
                  <>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {(selectedVariant.discountedPrice * quantity).toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-xl text-gray-400 line-through">
                      {(selectedVariant.price * quantity).toLocaleString('vi-VN')} ₫
                    </div>
                  </>
                ) : displayPrice !== basePrice ? (
                  <>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {(displayPrice * quantity).toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-xl text-gray-400 line-through">
                      {(basePrice * quantity).toLocaleString('vi-VN')} ₫
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-bold text-gray-900">
                    {(displayPrice * quantity).toLocaleString('vi-VN')} ₫
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h2>
                  <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Chọn biến thể</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        className={`p-3 border-2 rounded-lg text-left transition ${
                          selectedVariant?._id === variant._id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-sm text-gray-600">
                          {variant.price.toLocaleString('vi-VN')} ₫
                        </div>
                        {variant.inventory.quantity <= variant.inventory.lowStockThreshold && (
                          <div className="text-xs text-orange-600 mt-1">
                            Sắp hết hàng ({variant.inventory.quantity} sản phẩm)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Số lượng</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decreaseQuantity}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (selectedVariant && selectedVariant.inventory.quantity) {
                          setQuantity(Math.min(Math.max(1, val), selectedVariant.inventory.quantity));
                        } else {
                          setQuantity(Math.max(1, val));
                        }
                      }}
                      min="1"
                      max={selectedVariant?.inventory?.quantity || undefined}
                      className="w-16 text-center border-0 focus:outline-none"
                    />
                    <button
                      onClick={increaseQuantity}
                      className="p-2 hover:bg-gray-100"
                      disabled={selectedVariant && selectedVariant.inventory && quantity >= selectedVariant.inventory.quantity}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {selectedVariant?.inventory && (
                    <span className={`text-sm ${
                      selectedVariant.inventory.quantity === 0 ? 'text-red-600 font-semibold' :
                      selectedVariant.inventory.quantity <= selectedVariant.inventory.lowStockThreshold ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {selectedVariant.inventory.quantity === 0 
                        ? 'Hết hàng' 
                        : `Còn ${selectedVariant.inventory.quantity} sản phẩm`}
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || (selectedVariant && selectedVariant.inventory && selectedVariant.inventory.quantity === 0)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <ShoppingCart size={20} />
                {addingToCart ? 'Đang thêm...' : 
                 (selectedVariant && selectedVariant.inventory && selectedVariant.inventory.quantity === 0) 
                   ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </button>

              {/* Product Details */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Thông tin sản phẩm</h3>
                <div className="space-y-2 text-sm">
                  {product.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trọng lượng:</span>
                      <span className="font-medium">{product.weight.value} {product.weight.unit}</span>
                    </div>
                  )}
                  {product.shelfLife && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hạn sử dụng:</span>
                      <span className="font-medium">{product.shelfLife.value} {product.shelfLife.unit}</span>
                    </div>
                  )}
                  {product.ingredients && product.ingredients.length > 0 && (
                    <div>
                      <span className="text-gray-600">Thành phần:</span>
                      <p className="font-medium">{product.ingredients.join(', ')}</p>
                    </div>
                  )}
                  {product.allergens && product.allergens.length > 0 && (
                    <div>
                      <span className="text-gray-600">Chất gây dị ứng:</span>
                      <p className="font-medium text-orange-600">{product.allergens.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;


