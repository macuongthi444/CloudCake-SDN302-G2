import React, { useState, useEffect } from 'react';
import { Trash2, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import StoreDetail from './StoreDetail';
import ShopService from './services/Shopservice';
import { toast } from 'react-toastify'; // Assuming you use react-toastify for notifications

const StoreList = () => {
    const [showStoreDetail, setShowStoreDetail] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);
    const [storeData, setStoreData] = useState([]);
    const [allStores, setAllStores] = useState([]); // Lưu trữ tất cả stores không lọc
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalShops, setTotalShops] = useState(0);
    const [storeOwners, setStoreOwners] = useState({}); // THÊM DÒNG NÀY
    // Số lượng cho mỗi tab lọc
    const [filterCounts, setFilterCounts] = useState({
        all: 0,
        active: 0,
        locked: 0
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states - Removed pending filter
    const [filter, setFilter] = useState({
        all: true,
        active: false,
        locked: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('');

    // Selected stores for bulk actions
    const [selectedStores, setSelectedStores] = useState([]);

    // Fetch shops on component mount and when filter changes
    useEffect(() => {
        fetchShops();
    }, []);

    // Apply filters, search, sorting when these change
    useEffect(() => {
        applyFiltersAndPagination();
    }, [filter, searchTerm, sortOption, currentPage, itemsPerPage, allStores]);

    // Helper function to check if shop is inactive
    const isInactive = (shop) => {
        return (
            shop.isActive === false ||
            shop.isActive === 0 ||
            shop.isActive === '0' ||
            ['SUSPENDED', 'REJECTED'].includes(shop.status)
        );
    };

    // Fetch shops data from API
    const fetchShops = async () => {
        try {
            setLoading(true);
            const response = await ShopService.getAllShops();

            // Chỉ lấy các cửa hàng đã được duyệt (status = active) hoặc đã bị khóa (is_active = 0)
            if (!Array.isArray(response)) {
                console.error('Response is not array:', response);
                setAllStores([]);
                setLoading(false);
                return;
            }

            const isInactive = (shop) => {
                return shop.isActive === false ||
                    shop.isActive === 0 ||
                    ['SUSPENDED', 'REJECTED'].includes(shop.status);
            };

            const processedShops = response.map(shop => ({
                ...shop,
                isInactive: isInactive(shop)
            }));

            setAllStores(processedShops);

            // Cập nhật filter counts
            setFilterCounts({
                all: processedShops.length,
                active: processedShops.filter(s => !s.isInactive).length,
                locked: processedShops.filter(s => s.isInactive).length
            });
            const ownersData = {};
            for (const shop of processedShops) {
                if (shop.ownerId?._id) {
                    const userId = shop.ownerId._id;
                    try {
                        const userData = await ShopService.getUserById(userId);
                        ownersData[userId] = userData;
                    } catch (err) {
                        console.error(`Lỗi lấy user ${userId}:`, err.message);
                        ownersData[userId] = { firstName: 'Lỗi', lastName: 'tải' };
                    }
                }
            }
            setStoreOwners(ownersData);
        } catch (err) {
            console.error('Error fetching shops:', err);
            setError('Failed to load shops. Please try again later.');
            setLoading(false);
            toast.error('Failed to load shops');
        }
    };
    const getOwnerName = (shop) => {
        if (!shop.ownerId?._id) return 'Không có chủ';
        const userId = shop.ownerId._id;
        const owner = storeOwners[userId];
        if (!owner) return 'Đang tải...';

        if (owner.name) return owner.name;
        return `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Không tên';
    };
    // Apply filters, search, sorting and pagination
    const applyFiltersAndPagination = () => {
        if (!allStores.length) return;

        setLoading(true);

        // Apply filters
        let filteredShops = [...allStores];

        if (filter.active) {
            filteredShops = filteredShops.filter(shop =>
                shop.status === 'active' && !isInactive(shop)
            );
        } else if (filter.locked) {
            filteredShops = filteredShops.filter(shop => isInactive(shop));
            console.log("After locked filter applied:", filteredShops);
        }

        // Apply search if there's a search term
        if (searchTerm) {
            filteredShops = filteredShops.filter(shop =>
                shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (shop.phone && shop.phone.includes(searchTerm))
            );
        }

        // Apply sorting if specified
        if (sortOption === 'name') {
            filteredShops.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === 'date') {
            filteredShops.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Get total count
        setTotalShops(filteredShops.length);

        // Calculate total pages
        setTotalPages(Math.ceil(filteredShops.length / itemsPerPage));

        // Paginate results
        const start = (currentPage - 1) * itemsPerPage;
        const paginatedShops = filteredShops.slice(start, start + itemsPerPage);

        setStoreData(paginatedShops);
        setLoading(false);
    };

    // Get shop statistics
    const fetchShopStatistics = async () => {
        try {
            const stats = await ShopService.getShopStatistics();
            setTotalShops(stats.totalShops);
        } catch (err) {
            console.error('Error fetching shop statistics:', err);
        }
    };

    // Handle delete shop
    const handleDeleteShop = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa cửa hàng này không?')) {
            try {
                await ShopService.deleteShop(id);
                toast.success('Đã xóa cửa hàng thành công');
                fetchShops(); // Refresh the list
            } catch (err) {
                console.error('Error deleting shop:', err);
                toast.error('Không thể xóa cửa hàng');
            }
        }
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    // Handle checkbox selection
    const handleSelectStore = (storeId) => {
        if (selectedStores.includes(storeId)) {
            setSelectedStores(selectedStores.filter(id => id !== storeId));
        } else {
            setSelectedStores([...selectedStores, storeId]);
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedStores.length === storeData.length) {
            setSelectedStores([]);
        } else {
            setSelectedStores(storeData.map(store => store._id));
        }
    };

    // Handle pagination
    const goToPage = (page) => {
        setCurrentPage(page);
    };

    // Handle store selection to view details
    const handleViewStoreDetail = (store) => {
        setSelectedStore(store);
        setShowStoreDetail(true);
    };

    // Handle back from store detail
    const handleBackFromDetail = () => {
        setShowStoreDetail(false);
        setSelectedStore(null);
        fetchShops(); // Refresh the list in case changes were made
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchShops();
        fetchShopStatistics();
    };

    // Xử lý bấm vào các tab
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1); // Reset trang về 1 khi thay đổi filter
    };

    return (
        <div className="flex-1 bg-gray-50">
            {showStoreDetail ? (
                <StoreDetail
                    onBack={handleBackFromDetail}
                    shopId={selectedStore._id}
                    initialShopData={selectedStore} // Pass the full shop object
                />
            ) : (
                <>
                    {/* Tabs - Removed Pending tab */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex space-x-6 text-gray-600">
                            <button
                                className={`${filter.all ? 'text-blue-600' : ''}`}
                                onClick={() => handleFilterChange({ all: true, active: false, locked: false })}
                            >
                                Tất cả ( {filterCounts.all} )
                            </button>
                            <button
                                className={`${filter.active ? 'text-blue-600' : ''}`}
                                onClick={() => handleFilterChange({ all: false, active: true, locked: false })}
                            >
                                Hoạt động ( {filterCounts.active} )
                            </button>
                            <button
                                className={`${filter.locked ? 'text-blue-600' : ''}`}
                                onClick={() => handleFilterChange({ all: false, active: false, locked: true })}
                            >
                                Khóa ( {filterCounts.locked} )
                            </button>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center mr-4 cursor-pointer" onClick={handleRefresh}>
                                <span className="text-gray-500 mr-2">Dữ liệu mới nhất</span>
                                <RefreshCw size={18} className="text-gray-500" />
                            </div>
                            <div className="text-gray-500">{new Date().toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Function bar */}
                    <div className="flex justify-between items-center px-6 py-4">
                        <div className="flex items-center">
                            <div className="text-gray-700 mr-2">Chức năng:</div>
                            {selectedStores.length > 0 && (
                                <button className="text-pink-500" onClick={() => {
                                    // Bulk delete logic would go here
                                    console.log("Bulk delete:", selectedStores);
                                }}>
                                    Thêm vào thùng rác ( {selectedStores.length} )
                                </button>
                            )}
                        </div>

                        <div className="flex items-center">
                            <div className="mr-4">
                                <select
                                    className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option value="">Sắp xếp theo</option>
                                    <option value="name">Tên</option>
                                    <option value="date">Ngày tạo</option>
                                </select>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stores table */}
                    <div className="px-6 pb-6">
                        <div className="bg-white rounded-md shadow-sm">
                            {loading ? (
                                <div className="text-center py-10">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="mt-2">Đang tải...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-10 text-red-500">
                                    {error}
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="py-3 px-4 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={selectedStores.length === storeData.length && storeData.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                Tên cửa hàng
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                Chủ sở hữu
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                Điện thoại
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                Trạng thái
                                            </th>

                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {storeData.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    Không có dữ liệu
                                                </td>
                                            </tr>
                                        ) : (
                                            storeData.map((store) => (
                                                <tr key={store._id} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4"
                                                            checked={selectedStores.includes(store._id)}
                                                            onChange={() => handleSelectStore(store._id)}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center">
                                                            <img
                                                                src={store.logo || 'https://via.placeholder.com/40?text=SHOP'}
                                                                alt={store.name}
                                                                className="h-10 w-10 mr-3 object-cover rounded-full border border-gray-200"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://via.placeholder.com/40?text=NO+IMG';
                                                                }}
                                                            />
                                                            <span
                                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                                                                onClick={() => handleViewStoreDetail(store)}
                                                            >
                                                                {store.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-700">
                                                        {getOwnerName(store)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-700">{store.phone || 'N/A'}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isInactive(store) ? 'bg-red-100 text-red-800' :
                                                            'bg-green-100 text-green-800'
                                                            }`}>
                                                            {isInactive(store) ? 'Khóa' : 'Hoạt động'}
                                                        </span>
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                className="text-gray-500 hover:text-blue-600"
                                                                onClick={() => handleViewStoreDetail(store)}
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <span className="text-gray-300">|</span>
                                                            <button
                                                                className="text-gray-500 hover:text-red-600"
                                                                onClick={() => handleDeleteShop(store._id)}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* Pagination */}
                            {!loading && !error && storeData.length > 0 && (
                                <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <button
                                            className={`p-2 border border-gray-300 rounded-md mr-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => goToPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${page === currentPage ? 'bg-pink-500 text-white' : 'border border-gray-300 text-gray-700'
                                                    }`}
                                                onClick={() => goToPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            className={`p-2 border border-gray-300 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-700">
                                        <span>Trang {currentPage} của {totalPages}</span>
                                        <span className="mx-4">-</span>
                                        <span>Hiển thị</span>
                                        <select
                                            className="mx-2 border border-gray-300 rounded p-1"
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                        >
                                            <option value="5">5</option>
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                        </select>
                                        <span>/</span>
                                        <span className="ml-2">{totalShops}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StoreList;