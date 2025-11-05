import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Star, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductService from '../../services/ProductService';
import useDebounce from '../../hooks/useDebounce';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: -1
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read query params from URL on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategoryId = searchParams.get('categoryId');
    
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
    if (urlCategoryId) {
      setFilters(prev => ({ ...prev, categoryId: urlCategoryId }));
    }
  }, [searchParams]);

  const debouncedSearch = useDebounce(searchTerm, 450);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters, debouncedSearch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: searchTerm || undefined
      };
      const data = await ProductService.getProducts(params);
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Update to first page and rely on debouncedSearch effect to load products
    setPagination({ ...pagination, page: 1 });
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách Sản phẩm</h1>
          <p className="text-gray-600">Khám phá các loại bánh ngon tại CloudCake</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const displayPrice = product.discountedPrice || product.basePrice;
              const discountPercent = product.discountedPrice 
                ? Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)
                : 0;
              const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;

              return (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{discountPercent}%
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-semibold">
                        Nổi bật
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}
                    
                    {/* Rating */}
                    {product.rating && product.rating.average > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{product.rating.average.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.rating.count})</span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="px-4 py-2 flex items-center">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              disabled={pagination.page >= pagination.pages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;


