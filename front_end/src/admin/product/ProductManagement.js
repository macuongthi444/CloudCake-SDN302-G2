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
  CheckCircle,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
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
    status: "DRAFT",
    isActive: false,
  });
  const [categories, setCategories] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { isLoggedIn, hasRole, userRoles } = useAuth();
  const isAdmin = userRoles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

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
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      // Chỉ lọc isActive=true cho seller; Admin xem tất cả
      if (!isAdmin) {
        params.isActive = "true";
      }
      const data = await ProductService.getProducts(params);
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toastError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
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
      console.error("Error loading shop:", error);
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
      status: "DRAFT",
      isActive: false,
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
        isActive: fullProduct.isActive !== undefined ? fullProduct.isActive : false,
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
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews for new files only
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
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
        // Revoke blob URL
        const previewToRemove = imagePreviews[index];
        if (typeof previewToRemove === "string" && previewToRemove.startsWith("blob:")) {
          try { URL.revokeObjectURL(previewToRemove); } catch {}
        }
        const newFiles = imageFiles.filter((_, idx) => idx !== fileIndex);
        setImageFiles(newFiles);

        // Update previews - need to rebuild: existing + new previews
        const existingPreviews = existingImages.map((img) => img.url || img);
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
        setImagePreviews([...existingPreviews, ...newPreviews]);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!isAdmin && !myShop) {
        toastWarning("Bạn cần tạo cửa hàng trước khi thêm sản phẩm!");
        return;
      }

      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        discountedPrice: formData.discountedPrice
          ? parseFloat(formData.discountedPrice)
          : null,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        ingredients: formData.ingredients
          ? formData.ingredients.split(",").map((i) => i.trim())
          : [],
        allergens: formData.allergens
          ? formData.allergens.split(",").map((a) => a.trim())
          : [],
        weight: {
          value: parseFloat(formData.weight.value) || 0,
          unit: formData.weight.unit,
        },
        shelfLife: {
          value: parseFloat(formData.shelfLife.value) || 1,
          unit: formData.shelfLife.unit,
        },
      };

      // Remove status and isActive from productData if user is not admin
      // Seller cannot change these fields - only admin can activate products
      if (!isAdmin) {
        delete productData.status;
        delete productData.isActive;
      }

      if (isAdmin && !productData.shopId) {
        toastWarning("Vui lòng chọn cửa hàng");
        return;
      }

      let updatedProduct;

      if (isEditing) {
        updatedProduct = await ProductService.updateProduct(
          selectedProduct._id,
          {
            ...productData,
            existingImages: existingImages,
          },
          imageFiles
        );

        // CẬP NHẬT NGAY TRONG STATE BẰNG KẾT QUẢ TỪ API (bao gồm images mới)
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === selectedProduct._id
              ? { ...p, ...updatedProduct }
              : p
          )
        );
        setSelectedProduct(updatedProduct);
      } else {
        updatedProduct = await ProductService.createProduct(
          productData,
          imageFiles
        );

        // Thêm vào đầu danh sách
        setProducts((prev) => [updatedProduct, ...prev]);
        // Cập nhật pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
          pages: Math.ceil((prev.total + 1) / prev.limit),
        }));
      }

      // Reset form
      // Revoke all created blob URLs when closing modal to avoid memory leaks
      imagePreviews.forEach((src) => {
        if (typeof src === "string" && src.startsWith("blob:")) {
          try { URL.revokeObjectURL(src); } catch {}
        }
      });
      setShowModal(false);
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);

      toastSuccess(
        isEditing ? "Cập nhật thành công!" : "Tạo sản phẩm thành công!"
      );

      // Chỉ reload nếu cần (ví dụ: search, filter thay đổi)
      // Hoặc có thể bỏ qua hoàn toàn vì đã cập nhật state rồi
    } catch (error) {
      console.error("Error saving product:", error);
      toastError("Không thể lưu sản phẩm: " + (error.message || "Lỗi mạng"));
    }
  };

  const handleApproveProduct = async (product) => {
    try {
      const updatedProduct = await ProductService.updateProduct(
        product._id,
        {
          status: "ACTIVE",
          isActive: true,
        },
        []
      );

      // Cập nhật trong state
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, ...updatedProduct } : p
        )
      );

      toastSuccess("Sản phẩm đã được kích hoạt thành công!");
    } catch (error) {
      console.error("Error approving product:", error);
      toastError("Không thể kích hoạt sản phẩm: " + (error.message || "Lỗi không xác định"));
    }
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
      await ProductService.deleteProduct(id);
      toastSuccess("Xóa thành công!");
      // Re-fetch nền để đồng bộ tuyệt đối với server
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (!isAdmin) params.isActive = "true";
      const data = await ProductService.getProducts(params);
      setProducts(data.products || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      // Rollback nếu lỗi
      setProducts(snapshotProducts);
      setPagination(snapshotPagination);
      console.error("Error deleting product:", error);
      toastError(
        "Không thể xóa sản phẩm: " + (error.message || "Lỗi không xác định")
      );
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Quản lý Sản phẩm
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Quản lý các sản phẩm bánh của cửa hàng
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Thêm sản phẩm</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
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
                      {isAdmin && product.status === "DRAFT" && (
                        <button
                          onClick={() => handleApproveProduct(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Kích hoạt sản phẩm"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
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
                    {isAdmin && product.status === "DRAFT" && (
                      <button
                        onClick={() => handleApproveProduct(product)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Kích hoạt sản phẩm"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
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
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-2 sm:px-4 py-2 text-sm sm:text-base">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page >= pagination.pages}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm Mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div
                className={`grid gap-4 grid-cols-1 ${
                  isAdmin ? "sm:grid-cols-2" : "sm:grid-cols-3"
                }`}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
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
                      value={formData.shopId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, shopId: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Chọn cửa hàng</option>
                      {shops.map((shop) => (
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
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountedPrice: e.target.value,
                      })
                    }
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
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="sinh nhật, chocolate, cao cấp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Status and Active Fields - Only for Admin */}
              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="DRAFT">Nháp</option>
                      <option value="ACTIVE">Đang bán</option>
                      <option value="OUT_OF_STOCK">Hết hàng</option>
                      <option value="DISCONTINUED">Ngừng bán</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Kích hoạt sản phẩm
                      </span>
                    </label>
                    <span className="ml-2 text-xs text-gray-500">
                      (Sản phẩm sẽ hiển thị cho khách hàng)
                    </span>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>
                <div className="flex gap-4 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={
                          typeof preview === "string"
                            ? preview
                            : preview.url || preview
                        }
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
                  {isEditing ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Xác nhận xóa
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? Hành
              động này không thể hoàn tác.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
