import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Image as ImageIcon,
  Package,
  Layers,
} from "lucide-react";
import ProductService from "../../services/ProductService";
import CategoryService from "../../services/CategoryService";
import ShopService from "../../services/ShopService";
import VariantManagement from "./VariantManagement";
import { useAuth } from "../../pages/Login/context/AuthContext";
import { toastSuccess, toastError, toastWarning } from "../../utils/toast";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Images from DB when editing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    basePrice: "",
    discountedPrice: "",
    sku: "",
    tags: "",
    ingredients: "",
    allergens: "",
    weight: { value: "", unit: "g" },
    shelfLife: { value: "", unit: "days" },
  });
  const [categories, setCategories] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const { isLoggedIn, hasRole, userRoles } = useAuth();
  const isAdmin = userRoles?.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN');

  useEffect(() => {
    if (isLoggedIn) {
      loadProducts();
      loadCategories();
      loadShop();
    }
  }, [isLoggedIn, pagination.page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        isActive: 'true'
      });
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      } catch (error) {
        console.error('Error loading products:', error);
        toastError('Không thể tải danh sách sản phẩm');
      } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadShop = async () => {
    try {
      if (!isAdmin) {
        // Seller - get their own shop
        const shop = await ShopService.getMyShop();
        setMyShop(shop);
      } else {
        // Admin - get all active shops
        const data = await ShopService.getShops({ isActive: true });
        setShops(data);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      shopId: "",
      basePrice: "",
      discountedPrice: "",
      sku: "",
      tags: "",
      ingredients: "",
      allergens: "",
      weight: { value: "", unit: "g" },
      shelfLife: { value: "", unit: "days" },
    });
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setIsEditing(false);
      setShowModal(true);
  };

  const handleEditClick = async (product) => {
    try {
      setModalLoading(true);
      setShowModal(true);
      setIsEditing(true);
      setSelectedProduct(product);

      // Fetch fresh, full product detail for the form (faster than relying on list data)
      const full = await ProductService.getProductById(product._id);
      const fullProduct = full?.product || full; // API returns { product, variants } in some cases

      setFormData({
        name: fullProduct.name || "",
        description: fullProduct.description || "",
        shortDescription: fullProduct.shortDescription || "",
        categoryId: fullProduct.categoryId?._id || fullProduct.categoryId || "",
        shopId: fullProduct.shopId?._id || fullProduct.shopId || "",
        basePrice: fullProduct.basePrice || "",
        discountedPrice: fullProduct.discountedPrice || "",
        sku: fullProduct.sku || "",
        tags: fullProduct.tags ? fullProduct.tags.join(", ") : "",
        ingredients: fullProduct.ingredients ? fullProduct.ingredients.join(", ") : "",
        allergens: fullProduct.allergens ? fullProduct.allergens.join(", ") : "",
        weight: fullProduct.weight || { value: "", unit: "g" },
        shelfLife: fullProduct.shelfLife || { value: "", unit: "days" },
        status: fullProduct.status || "DRAFT",
      });

      setImageFiles([]);
      const existing = fullProduct.images || [];
      setExistingImages(existing);
      setImagePreviews(existing.map((img) => img.url || img));
    } catch (e) {
      console.error("Error loading product detail:", e);
      toastError("Không thể tải chi tiết sản phẩm để chỉnh sửa");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews for new files only
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImagePreview = (index) => {
    // Determine if this is an existing image or a new file
    const numExisting = existingImages.length;
    
    if (index < numExisting) {
      // Removing an existing image from DB
      const newExisting = existingImages.filter((_, idx) => idx !== index);
      setExistingImages(newExisting);
      // Update previews - remove the corresponding preview
      const newPreviews = imagePreviews.filter((_, idx) => idx !== index);
      setImagePreviews(newPreviews);
    } else {
      // Removing a new file that hasn't been uploaded yet
      const fileIndex = index - numExisting;
      if (fileIndex >= 0 && fileIndex < imageFiles.length) {
        const newFiles = imageFiles.filter((_, idx) => idx !== fileIndex);
        setImageFiles(newFiles);
        
        // Update previews - need to rebuild: existing + new previews
        const existingPreviews = existingImages.map(img => img.url || img);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews([...existingPreviews, ...newPreviews]);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Check if seller has shop
      if (!isAdmin && !myShop) {
        toastWarning('Bạn cần tạo cửa hàng trước khi thêm sản phẩm!');
        return;
      }

      // Prepare data
      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : [],
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : [],
        weight: {
          value: parseFloat(formData.weight.value) || 0,
          unit: formData.weight.unit
        },
        shelfLife: {
          value: parseFloat(formData.shelfLife.value) || 1,
          unit: formData.shelfLife.unit
        }
      };

      if (isAdmin && !productData.shopId) {
        toastWarning('Vui lòng chọn cửa hàng');
        return;
      }

      if (isEditing) {
        // Send remaining existing images and new images
        await ProductService.updateProduct(
          selectedProduct._id, 
          {
            ...productData,
            // Include remaining existing images - backend will merge with new ones
            existingImages: existingImages // Send remaining existing images
          }, 
          imageFiles
        );
      } else {
        await ProductService.createProduct(productData, imageFiles);
      }

      await loadProducts();
      setShowModal(false);
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      toastSuccess('Lưu thành công!');
    } catch (error) {
      console.error("Error saving product:", error);
      toastError("Không thể lưu sản phẩm: " + (error.message || "Lỗi mạng"));
    }
  };

  const handleDelete = async () => {
    try {
      await ProductService.deleteProduct(selectedProduct._id);
      await loadProducts();
      setShowDeleteModal(false);
      setSelectedProduct(null);
      toastSuccess('Xóa thành công!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toastError('Không thể xóa sản phẩm: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
            <p className="text-gray-600">Quản lý các sản phẩm bánh của cửa hàng</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Thêm sản phẩm
          </button>
        </div>

        {/* Search */}
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
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Danh mục
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={
                            product.images.find((img) => img.isPrimary)?.url ||
                            product.images[0]?.url
                          }
                          alt={product.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          {product.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                          {product.shortDescription || product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-gray-700 text-sm">
                    {product.sku || "-"}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-gray-700 text-sm">
                    {product.categoryId?.name || "-"}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex flex-col">
                      {product.discountedPrice ? (
                        <>
                          <span className="text-base sm:text-lg font-semibold text-blue-600">
                            {product.discountedPrice.toLocaleString("vi-VN")} ₫
                          </span>
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            {product.basePrice.toLocaleString("vi-VN")} ₫
                          </span>
                        </>
                      ) : (
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                          {product.basePrice.toLocaleString("vi-VN")} ₫
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        product.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : product.status === "DRAFT"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status === "ACTIVE"
                        ? "Đang bán"
                        : product.status === "DRAFT"
                        ? "Nháp"
                        : product.status === "OUT_OF_STOCK"
                        ? "Hết hàng"
                        : "Ngừng bán"}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowVariantModal(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Quản lý biến thể"
                      >
                        <Layers size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
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
            {filteredProducts.map((product) => (
              <div key={product._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={
                          product.images.find((img) => img.isPrimary)?.url ||
                          product.images[0]?.url
                        }
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                        {product.shortDescription || product.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowVariantModal(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Quản lý biến thể"
                    >
                      <Layers size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Danh mục</p>
                    <p className="text-sm text-gray-700">
                      {product.categoryId?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Giá</p>
                    <div>
                      {product.discountedPrice ? (
                        <>
                          <div className="text-base font-semibold text-blue-600">
                            {product.discountedPrice.toLocaleString("vi-VN")} ₫
                          </div>
                          <div className="text-xs text-gray-400 line-through">
                            {product.basePrice.toLocaleString("vi-VN")} ₫
                          </div>
                        </>
                      ) : (
                        <div className="text-base font-semibold text-gray-900">
                          {product.basePrice.toLocaleString("vi-VN")} ₫
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : product.status === "DRAFT"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status === "ACTIVE"
                      ? "Đang bán"
                      : product.status === "DRAFT"
                      ? "Nháp"
                      : product.status === "OUT_OF_STOCK"
                      ? "Hết hàng"
                      : "Ngừng bán"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Không có sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPagination({...pagination, page: pagination.page - 1})}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({...pagination, page: pagination.page + 1})}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cửa hàng *
                    </label>
                    <select
                      value={formData.shopId || ''}
                      onChange={(e) => setFormData({...formData, shopId: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Chọn cửa hàng</option>
                      {shops.map(shop => (
                        <option key={shop._id} value={shop._id}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá gốc (₫) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="sinh nhật, chocolate, cao cấp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>
                <div className="flex gap-4 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={typeof preview === 'string' ? preview : preview.url || preview}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400">
                    <ImageIcon size={24} className="text-gray-400" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xóa</h2>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Quản lý Biến thể - {selectedProduct.name}
              </h2>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <VariantManagement
                productId={selectedProduct._id}
                onClose={() => {
                  setShowVariantModal(false);
                  setSelectedProduct(null);
                  loadProducts();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

