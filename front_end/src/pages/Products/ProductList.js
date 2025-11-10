import React, { useState, useEffect } from 'react';
import { Search, Star, Filter, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductService from '../../services/ProductService';
import CategoryService from '../../services/CategoryService';
import useDebounce from '../../hooks/useDebounce';

// --- COMPONENT LỌC (ĐÃ XÓA KHOẢNG GIÁ) ---
const FilterSidebar = ({
  categories,
  filters,
  searchTerm,
  setSearchTerm,
  handleSearchSubmit
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hàm helper để tạo URL mới
  const updateUrlParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    // Cập nhật params
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        params.set(key, newParams[key]);
      } else {
        params.delete(key); // Xóa nếu giá trị rỗng
      }
    });
    // Luôn reset về trang 1 khi lọc
    params.set('page', '1');
    navigate(`/products?${params.toString()}`);
  };

  // Xử lý khi thay đổi sắp xếp
  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('_');
    updateUrlParams({ sortBy, sortOrder });
  };

  // Xử lý khi bấm vào danh mục
  const handleCategoryClick = (categoryId) => {
    updateUrlParams({ categoryId: categoryId, search: '' }); // Reset search khi chọn category
  };
  
  // Tính toán giá trị cho select box
  const sortValue = `${filters.sortBy}_${filters.sortOrder}`;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6 sticky top-8">
      {/* 1. Bộ lọc tìm kiếm */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </form>

      {/* 2. Bộ lọc sắp xếp */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Sắp xếp theo</h3>
        <select
          onChange={handleSortChange}
          value={sortValue}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="createdAt_-1">Mới nhất</option>
          <option value="basePrice_1">Giá: Thấp đến Cao</option>
          <option value="basePrice_-1">Giá: Cao đến Thấp</option>
        </select>
      </div>

      {/* 3. Bộ lọc danh mục (Đã xóa mục 3. Khoảng giá) */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Danh mục</h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat._id}>
              <button
                onClick={() => handleCategoryClick(cat._id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  filters.categoryId === cat._id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
          {filters.categoryId && (
            <li>
              <button
                onClick={() => handleCategoryClick('')} // Bấm để xóa filter
                className="w-full text-left px-3 py-2 rounded-lg transition text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <X size={16} /> Bỏ chọn
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
// --- KẾT THÚC COMPONENT LỌC ---


// --- COMPONENT CHÍNH (ĐÃ CẬP NHẬT) ---
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: -1,
    page: 1
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Đọc query params từ URL và cập nhật state filters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    
    setSearchTerm(urlSearch || ''); 

    setFilters({
      categoryId: searchParams.get('categoryId') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') ? parseInt(searchParams.get('sortOrder'), 10) : -1,
      page: searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 1
    });
  }, [searchParams]);

  const debouncedSearch = useDebounce(searchTerm, 450);

  // Load danh mục (chỉ 1 lần)
  useEffect(() => {
    loadCategories();
  }, []);

  // Load sản phẩm bất cứ khi nào 'filters' hoặc 'debouncedSearch' thay đổi
  useEffect(() => {
    loadProducts();
  }, [filters, debouncedSearch]); 

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(true);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: filters.page, 
        limit: pagination.limit,
        search: debouncedSearch || undefined, 
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        isActive: 'true'
      };
      
      setCategoryName('');
      if (params.categoryId) {
        try {
          const foundCat = categories.find(c => c._id === params.categoryId);
          if (foundCat) {
            setCategoryName(foundCat.name);
          } else if (categories.length > 0) { 
            const categoryData = await CategoryService.getCategoryById(params.categoryId);
            if (categoryData && categoryData.name) {
              setCategoryName(categoryData.name);
            }
          }
        } catch (catError) {
          console.error('Error fetching category name:', catError);
        }
      }

      const data = await ProductService.getProducts(params);
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination(p => ({ ...p, ...data.pagination, page: filters.page }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set('search', searchTerm.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    navigate(`/products?${newParams.toString()}`);
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    navigate(`/products?${newParams.toString()}`);
  };


  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
<<<<<<< HEAD
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Danh sách Sản phẩm</h1>
          <p className="text-sm sm:text-base text-gray-600">Khám phá các loại bánh ngon tại CloudCake</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} className="sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                        className="w-full h-40 sm:h-48 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-40 sm:h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-sm text-gray-400">No Image</span>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <span className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-semibold">
                        -{discountPercent}%
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-yellow-400 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold">
                        Nổi bật
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}
                    
                    {/* Rating */}
                    {product.rating && product.rating.average > 0 && (
                      <div className="flex items-center gap-1 mb-2 sm:mb-3">
                        <Star size={14} className="sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                        <span className="text-xs sm:text-sm font-medium">{product.rating.average.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.rating.count})</span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        {product.discountedPrice ? (
                          <>
                            <div className="text-base sm:text-lg font-bold text-blue-600">
                              {product.discountedPrice.toLocaleString('vi-VN')} ₫
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 line-through">
                              {product.basePrice.toLocaleString('vi-VN')} ₫
                            </div>
                          </>
                        ) : (
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {product.basePrice.toLocaleString('vi-VN')} ₫
=======
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryName ? `Danh sách sản phẩm của ${categoryName}` : 'Danh sách Sản phẩm'}
          </h1>
          <p className="text-gray-600">Khám phá các loại bánh ngon tại CloudCake</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Cột Filter (Trái) */}
          <div className="lg:col-span-1">
            <FilterSidebar 
              categories={categories}
              filters={filters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearchSubmit={handleSearchSubmit}
            />
          </div>

          {/* Cột Sản phẩm (Phải) */}
          <div className="lg:col-span-3">
            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden flex flex-col"
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
>>>>>>> dec8a84a75c4e1e6e559d6a6ec177a17481a6960
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

                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-14">
                          {product.name}
                        </h3>
                        
                        {product.rating && product.rating.average > 0 ? (
                          <div className="flex items-center gap-1 mb-3">
                            <Star size={16} className="text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{product.rating.average.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({product.rating.count})</span>
                          </div>
                        ) : (
                          <div className="h-[28px] mb-3"></div>
                        )}

                        <div className="flex items-center justify-between mt-auto">
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
<<<<<<< HEAD
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow">
            <p className="text-sm sm:text-base text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              disabled={pagination.page === 1}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm sm:text-base"
            >
              Trước
            </button>
            <span className="px-2 sm:px-4 py-2 flex items-center text-sm sm:text-base">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              disabled={pagination.page >= pagination.pages}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm sm:text-base"
            >
              Sau
            </button>
=======
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Không tìm thấy sản phẩm nào khớp với bộ lọc</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 flex items-center">
                  Trang {filters.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
>>>>>>> dec8a84a75c4e1e6e559d6a6ec177a17481a6960
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;