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
import ModalPortal from "../../components/ModalPortal";
import { useAuth } from "../../pages/Login/context/AuthContext";
import { toastSuccess, toastError, toastWarning } from "../../utils/toast";

const ProductList = () => {
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
    const [existingImages, setExistingImages] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
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
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5,
        total: 0,
        pages: 0,
    });

    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            loadCategories();
            loadMyShop();
        }
    }, [isLoggedIn]);


    useEffect(() => {
        if (myShop) {
            loadProducts();
        }
    }, [myShop, pagination.page]);

    const loadProducts = async () => {
        if (!myShop?._id) {
            setProducts([]);
            setPagination({ page: 1, limit: 5, total: 0, pages: 0 });
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                shopId: myShop?._id,
            };
            const data = await ProductService.getProducts(params);
            setProducts(data.products || []);
            if (data.pagination) setPagination(data.pagination);
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

    const loadMyShop = async () => {
        try {
            const shop = await ShopService.getMyShop();
            console.log("My Shop:", shop); // XEM TRẠNG THÁI
            setMyShop(shop);
        } catch (error) {
            console.error("Error loading shop:", error);
            setMyShop(null);
        }
    };

    const handleCreateClick = () => {
        if (!myShop) {
            toastWarning("Bạn cần tạo cửa hàng trước khi thêm sản phẩm!");
            return;
        }
        if (!myShop.isActive) {
            toastWarning("Cửa hàng của bạn chưa được kích hoạt! Vui lòng chờ duyệt.");
            return;
        }
        setFormData({
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

            const full = await ProductService.getProductById(product._id);
            const fullProduct = full?.product || full;

            setFormData({
                name: fullProduct.name || "",
                description: fullProduct.description || "",
                shortDescription: fullProduct.shortDescription || "",
                categoryId: fullProduct.categoryId?._id || "",
                basePrice: fullProduct.basePrice || "",
                discountedPrice: fullProduct.discountedPrice || "",
                sku: fullProduct.sku || "",
                tags: fullProduct.tags ? fullProduct.tags.join(", ") : "",
                ingredients: fullProduct.ingredients ? fullProduct.ingredients.join(", ") : "",
                allergens: fullProduct.allergens ? fullProduct.allergens.join(", ") : "",
                weight: fullProduct.weight || { value: "", unit: "g" },
                shelfLife: fullProduct.shelfLife || { value: "", unit: "days" },
            });

            setImageFiles([]);
            const existing = fullProduct.images || [];
            setExistingImages(existing);
            setImagePreviews(existing.map((img) => img.url || img));
        } catch (e) {
            console.error("Error loading product detail:", e);
            toastError("Không thể tải chi tiết sản phẩm");
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
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeImagePreview = (index) => {
        const numExisting = existingImages.length;

        if (index < numExisting) {
            const newExisting = existingImages.filter((_, idx) => idx !== index);
            setExistingImages(newExisting);
            const newPreviews = imagePreviews.filter((_, idx) => idx !== index);
            setImagePreviews(newPreviews);
        } else {
            const fileIndex = index - numExisting;
            if (fileIndex >= 0 && fileIndex < imageFiles.length) {
                const previewToRemove = imagePreviews[index];
                if (previewToRemove.startsWith("blob:")) {
                    URL.revokeObjectURL(previewToRemove);
                }
                const newFiles = imageFiles.filter((_, idx) => idx !== fileIndex);
                setImageFiles(newFiles);
                const existingPreviews = existingImages.map((img) => img.url || img);
                const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
                setImagePreviews([...existingPreviews, ...newPreviews]);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!myShop) {
            toastWarning("Bạn cần tạo cửa hàng trước khi thêm sản phẩm!");
            return;
        }

        const productData = {
            ...formData,
            shopId: myShop._id, // Gán tự động
            basePrice: parseFloat(formData.basePrice),
            discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
            tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
            ingredients: formData.ingredients ? formData.ingredients.split(",").map((i) => i.trim()) : [],
            allergens: formData.allergens ? formData.allergens.split(",").map((a) => a.trim()) : [],
            weight: { value: parseFloat(formData.weight.value) || 0, unit: formData.weight.unit },
            shelfLife: { value: parseFloat(formData.shelfLife.value) || 1, unit: formData.shelfLife.unit },

        };

        try {
            let updatedProduct;

            if (isEditing) {
                updatedProduct = await ProductService.updateProduct(
                    selectedProduct._id,
                    { ...productData, existingImages },
                    imageFiles
                );
                setProducts((prev) =>
                    prev.map((p) => (p._id === selectedProduct._id ? { ...p, ...updatedProduct } : p))
                );
            } else {
                updatedProduct = await ProductService.createProduct(productData, imageFiles);
                setProducts((prev) => [updatedProduct, ...prev]);
                setPagination((prev) => ({
                    ...prev,
                    total: prev.total + 1,
                    pages: Math.ceil((prev.total + 1) / prev.limit),
                }));
            }

            // Cleanup blob URLs
            imagePreviews.forEach((src) => {
                if (src.startsWith("blob:")) URL.revokeObjectURL(src);
            });

            setShowModal(false);
            setImageFiles([]);
            setImagePreviews([]);
            setExistingImages([]);
            toastSuccess(isEditing ? "Cập nhật thành công!" : "Tạo sản phẩm thành công!");
        } catch (error) {
            toastError("Lưu sản phẩm thất bại: " + (error.message || "Lỗi mạng"));
        }
    };

    const handleDelete = async () => {
        const id = selectedProduct?._id;
        if (!id) return;

        const snapshotProducts = products;
        const snapshotPagination = pagination;

        setProducts((prev) => prev.filter((p) => p._id !== id));
        setPagination((prev) => {
            const newTotal = Math.max(prev.total - 1, 0);
            const newPages = Math.ceil(newTotal / prev.limit);
            const newPage = Math.min(prev.page, newPages);
            return { ...prev, total: newTotal, pages: newPages, page: newPage };
        });
        setShowDeleteModal(false);
        setSelectedProduct(null);

        try {
            await ProductService.deleteProduct(id);
            toastSuccess("Xóa thành công!");
            loadProducts(); // Đồng bộ lại
        } catch (error) {
            setProducts(snapshotProducts);
            setPagination(snapshotPagination);
            toastError("Xóa thất bại: " + (error.message || "Lỗi không xác định"));
        }
    };

    const filteredProducts = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return term
            ? products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(term) ||
                    p.sku?.toLowerCase().includes(term)
            )
            : products;
    }, [products, searchTerm]);

    if (loading) {
        return (
            <div className="p-3 sm:p-4 lg:p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                            Quản lý các sản phẩm bánh của cửa hàng bạn
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

            {/* Products Table - Desktop */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.images?.length > 0 ? (
                                                <img
                                                    src={product.images.find((img) => img.isPrimary)?.url || product.images[0].url}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Package size={24} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">
                                                    {product.shortDescription || product.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{product.sku || "-"}</td>
                                    <td className="px-6 py-4 text-gray-700">{product.categoryId?.name || "-"}</td>
                                    <td className="px-6 py-4">
                                        {product.discountedPrice ? (
                                            <>
                                                <span className="text-lg font-semibold text-blue-600">
                                                    {product.discountedPrice.toLocaleString("vi-VN")} ₫
                                                </span>
                                                <span className="text-sm text-gray-400 line-through ml-2">
                                                    {product.basePrice.toLocaleString("vi-VN")} ₫
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-lg font-semibold text-gray-900">
                                                {product.basePrice.toLocaleString("vi-VN")} ₫
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${product.status === "ACTIVE"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {product.status === "ACTIVE" ? "Đang bán" : "Nháp"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(product)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setShowVariantModal(true);
                                                }}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                                title="Biến thể"
                                            >
                                                <Layers size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(product)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                        <div key={product._id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1">
                                    {product.images?.length > 0 ? (
                                        <img
                                            src={product.images.find((img) => img.isPrimary)?.url || product.images[0].url}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <Package size={24} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-1">
                                            {product.shortDescription || product.description}
                                        </p>
                                        <p className="text-xs text-gray-500">SKU: {product.sku || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditClick(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setShowVariantModal(true);
                                        }}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                    >
                                        <Layers size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteClick(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Danh mục</p>
                                    <p className="font-medium">{product.categoryId?.name || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Giá</p>
                                    {product.discountedPrice ? (
                                        <div>
                                            <div className="font-semibold text-blue-600">
                                                {product.discountedPrice.toLocaleString("vi-VN")} ₫
                                            </div>
                                            <div className="text-xs text-gray-400 line-through">
                                                {product.basePrice.toLocaleString("vi-VN")} ₫
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="font-semibold text-gray-900">
                                            {product.basePrice.toLocaleString("vi-VN")} ₫
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {product.status === "ACTIVE" ? "Đang bán" : "Nháp"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Chưa có sản phẩm nào</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Trước
                    </button>
                    <span className="px-4 py-2">
                        Trang {pagination.page} / {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page >= pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{isEditing ? "Chỉnh sửa" : "Thêm sản phẩm"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {modalLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                                    <input
                                        type="text"
                                        value={formData.shortDescription}
                                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                                        <select
                                            required
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (₫) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.discountedPrice}
                                            onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (cách nhau bởi dấu phẩy)</label>
                                    <input
                                        type="text"
                                        placeholder="sinh nhật, chocolate"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                                    <div className="flex flex-wrap gap-3">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative">
                                                <img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImagePreview(i)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400">
                                            <ImageIcon size={24} className="text-gray-400" />
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
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
                        )}
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-3">Xác nhận xóa</h3>
                        <p className="text-gray-700 mb-6">
                            Xóa sản phẩm "<strong>{selectedProduct?.name}</strong>"? Không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
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
                </ModalPortal>
            )}

            {/* Variant Modal */}
            {showVariantModal && selectedProduct && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">Biến thể - {selectedProduct.name}</h3>
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
                        <div className="flex-1 overflow-y-auto">
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
                </ModalPortal>
            )}
        </div>
    );
};

export default ProductList;