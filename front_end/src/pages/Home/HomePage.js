import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowRight, ChefHat, Sparkles, TrendingUp, Package } from 'lucide-react';
import ProductService from '../../services/ProductService';
import CategoryService from '../../services/CategoryService';
import CartService from '../../services/CartService';
import { useAuth } from '../Login/context/AuthContext';
import { toastSuccess, toastError, toastWarning } from '../../utils/toast';
import logo from '../../assets/Logo.jpg';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load featured products
      const productsData = await ProductService.getProducts({
        isActive: 'true',
        limit: 8,
        sortBy: 'isFeatured',
        sortOrder: -1
      });

      // Load categories
      const categoriesData = await CategoryService.getCategories(true);
      
      setFeaturedProducts(productsData.products || []);
      setCategories(categoriesData.slice(0, 6) || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddToCart = async (product, defaultVariant) => {
    if (!currentUser || !currentUser.id) {
      navigate('/login');
      return;
    }

    if (!defaultVariant) {
      navigate(`/products/${product._id}`);
      return;
    }

    try {
      await CartService.addItemToCart({
        userId: currentUser.id,
        productId: product._id,
        variantId: defaultVariant._id,
        productName: product.name,
        variantName: defaultVariant.name,
        quantity: 1,
        price: defaultVariant.discountedPrice || defaultVariant.price,
        image: defaultVariant.image || (product.images && product.images[0]?.url)
      });
      toastSuccess('Đã thêm vào giỏ hàng!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toastError('Không thể thêm vào giỏ hàng. Chuyển đến trang chi tiết...');
      navigate(`/products/${product._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="CloudCake" className="h-16" />
                <h1 className="text-5xl font-bold">CloudCake</h1>
              </div>
              <p className="text-2xl mb-4 font-semibold">Bánh Ngọt Tươi Ngon Mỗi Ngày</p>
              <p className="text-lg mb-8 text-white/90">
                Khám phá thế giới bánh ngọt với đa dạng hương vị, từ bánh sinh nhật cao cấp đến bánh kem tươi mát.
                Đặt hàng ngay để nhận được những chiếc bánh tươi ngon nhất!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/products')}
                  className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  <ShoppingCart size={20} />
                  Khám phá sản phẩm
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Xem tất cả
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 text-center">
                  <ChefHat size={120} className="mx-auto mb-4" />
                  <p className="text-2xl font-bold">100% Tươi Ngon</p>
                  <p className="text-lg mt-2">Đặt làm hàng ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh mục Sản phẩm</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => navigate(`/products?categoryId=${category._id}`)}
                  className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 text-center transition group"
                >
                  <div className="text-4xl mb-3">{category.icon || '🍰'}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {category.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-yellow-500" size={24} />
                <h2 className="text-3xl font-bold text-gray-900">Sản phẩm Nổi bật</h2>
              </div>
              <p className="text-gray-600">Những chiếc bánh được yêu thích nhất</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Xem tất cả
              <ArrowRight size={20} />
            </button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const displayPrice = product.discountedPrice || product.basePrice;
                const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden group"
                  >
                    {/* Product Image */}
                    <div
                      className="relative"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Sparkles size={12} />
                          Nổi bật
                        </span>
                      )}
                      {product.discountedPrice && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                          -{Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      
                      {product.rating && product.rating.average > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star size={14} className="text-yellow-400 fill-current" />
                          <span className="text-xs font-medium">{product.rating.average.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({product.rating.count})</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.discountedPrice ? (
                            <>
                              <div className="text-lg font-bold text-blue-600">
                                {product.discountedPrice.toLocaleString('vi-VN')} ₫
                              </div>
                              <div className="text-sm text-gray-400 line-through">
                                {product.basePrice.toLocaleString('vi-VN')} ₫
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-bold text-gray-900">
                              {product.basePrice.toLocaleString('vi-VN')} ₫
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Button */}
                      <button
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        <ShoppingCart size={18} />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Chưa có sản phẩm nổi bật</p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Tại sao chọn CloudCake?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-pink-600" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Tươi Ngon</h3>
              <p className="text-gray-600">Bánh được làm tươi hàng ngày, không sử dụng chất bảo quản</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-purple-600" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Đặt làm Theo Yêu Cầu</h3>
              <p className="text-gray-600">Customize bánh theo sở thích của bạn với nhiều tùy chọn</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="text-blue-600" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thợ Làm Bánh Chuyên Nghiệp</h3>
              <p className="text-gray-600">Đội ngũ đầu bếp giàu kinh nghiệm, tạo ra những chiếc bánh tuyệt vời</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng đặt bánh?</h2>
          <p className="text-xl mb-8 text-white/90">
            Khám phá bộ sưu tập bánh ngọt đa dạng của chúng tôi và tìm chiếc bánh hoàn hảo cho bạn
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            Xem Sản phẩm Ngay
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

