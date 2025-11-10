import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCcw,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  X,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import ApiService from '../../services/ApiService';
import ShopService from '../store/services/Shopservice'; // Import ShopService để sử dụng getUserById

const StoreRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [storeRequests, setStoreRequests] = useState([]);
  const [storeOwners, setStoreOwners] = useState({}); // Lưu trữ thông tin chủ cửa hàng theo user_id
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9999';
  // Fetch store requests
  const fetchStoreRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get('/shop/list');
      console.log('Raw shops:', response);

      const pendingStores = response.filter(shop => shop.status === 'PENDING');
      setStoreRequests(pendingStores);

      setStats({
        total: response.length,
        pending: pendingStores.length,
        approved: response.filter(shop => shop.status === 'ACTIVE').length,
        rejected: response.filter(shop => shop.status === 'REJECTED').length
      });

      const ownersData = {};
      for (const store of pendingStores) {
        if (store.ownerId) {
          const userId = store.ownerId._id || String(store.ownerId);
          try {
            const userData = await ShopService.getUserById(userId);
            ownersData[userId] = userData;
            console.log('User loaded:', userId, userData);
          } catch (err) {
            console.error('Lỗi lấy user:', userId, err.message);
            ownersData[userId] = { firstName: 'Lỗi', lastName: 'tải' };
          }
        }
      }
      setStoreOwners(ownersData);
      console.log('Final owners:', ownersData);

    } catch (err) {
      console.error('Lỗi tải shop:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  // Initial fetch
  useEffect(() => {
    fetchStoreRequests();
  }, []);

  // Get owner name display
  const getOwnerName = (store) => {
    if (!store.ownerId) return 'Không có chủ';

    const userId = store.ownerId._id || String(store.ownerId);
    const owner = storeOwners[userId];

    if (!owner) return 'Đang tải...';

    if (owner.name) return owner.name;
    return `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Không tên';
  };

  // Handle approve store
  const handleApproveStore = async (storeId) => {
    setProcessingId(storeId);
    try {
      await ApiService.put(`/shop/approve/${storeId}`);

      // Update local state after successful approval
      setStoreRequests(storeRequests.filter(store => store._id !== storeId));
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1
      }));

      // Close detail view if the approved store was being viewed
      if (selectedStore && selectedStore._id === storeId) {
        setSelectedStore(null);
      }
    } catch (err) {
      console.error('Error approving store:', err);
      alert('Không thể duyệt cửa hàng. Vui lòng thử lại sau.');
    } finally {
      setProcessingId(null);
    }
  };

  // Open reject modal
  const openRejectModal = (storeId) => {
    setProcessingId(storeId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Handle reject store
  const handleRejectStore = async () => {
    try {
      if (!processingId) return;

      await ApiService.put(`/shop/reject/${processingId}`, { reason: rejectReason });

      // Update local state after successful rejection
      setStoreRequests(storeRequests.filter(store => store._id !== processingId));
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1
      }));

      // Close detail view if the rejected store was being viewed
      if (selectedStore && selectedStore._id === processingId) {
        setSelectedStore(null);
      }

      setShowRejectModal(false);
    } catch (err) {
      console.error('Error rejecting store:', err);
      alert('Không thể từ chối cửa hàng. Vui lòng thử lại sau.');
    } finally {
      setProcessingId(null);
    }
  };

  // View store details
  const viewStoreDetails = (store) => {
    setSelectedStore(store);
    setShowDetailModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Render stats cards
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Tổng số cửa hàng</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <FileText className="text-blue-500" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Đang chờ duyệt</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <Clock className="text-yellow-500" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Đã duyệt</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="text-green-500" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Đã từ chối</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="text-red-500" size={20} />
          </div>
        </div>
      </div>
    </div>
  );

  // Render store request table
  const renderStoreTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách yêu cầu đăng ký cửa hàng</h2>
        <button
          onClick={fetchStoreRequests}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md flex items-center"
        >
          <RefreshCcw size={16} className="mr-1" />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 flex flex-col items-center">
          <AlertTriangle size={40} className="mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchStoreRequests}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Thử lại
          </button>
        </div>
      ) : storeRequests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
          <p>Không có yêu cầu đăng ký cửa hàng nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên cửa hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ cửa hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storeRequests.map((store) => (
                <tr key={store._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {store.logo ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={store.logo}
                            alt={store.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {store.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getOwnerName(store)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{store.email}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Đang chờ duyệt
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewStoreDetails(store)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleApproveStore(store._id)}
                      disabled={processingId === store._id}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => openRejectModal(store._id)}
                      disabled={processingId === store._id}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  const renderStoreDetails = () => {
    if (!showDetailModal || !selectedStore) return null;

    const ownerData = selectedStore.ownerId
      ? storeOwners[selectedStore.ownerId._id || String(selectedStore.ownerId)]
      : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">Chi tiết: {selectedStore.name}</h2>
            <button onClick={() => { setSelectedStore(null); setShowDetailModal(false); }}>
              <X size={28} className="text-gray-500 hover:text-red-600" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Hình ảnh cửa hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Logo</p>
                {selectedStore.logo ? (
                  <img
                    src={selectedStore.logo}
                    alt="Logo cửa hàng"
                    className="w-full h-40 object-contain bg-gray-50 rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chưa có logo</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Ảnh bìa</p>
                {selectedStore.coverImage ? (
                  <img
                    src={selectedStore.coverImage}
                    alt="Ảnh bìa cửa hàng"
                    className="w-full h-40 object-cover bg-gray-50 rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chưa có ảnh bìa</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin cửa hàng</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Tên:</strong> {selectedStore.name}</p>
                  <p><strong>Email:</strong> {selectedStore.email}</p>
                  <p><strong>SĐT:</strong> {selectedStore.phone || 'Chưa có'}</p>

                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Chủ sở hữu</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  {ownerData ? (
                    <>
                      <p><strong>Họ tên:</strong> {ownerData.name || `${ownerData.firstName} ${ownerData.lastName}`}</p>

                    </>
                  ) : <p className="text-red-500">Không tải được</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button onClick={() => openRejectModal(selectedStore._id)} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                  <XCircle className="mr-2" size={18} /> Từ chối
                </button>
                <button onClick={() => handleApproveStore(selectedStore._id)} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                  <CheckCircle className="mr-2" size={18} /> Duyệt ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Render reject modal

  const renderRejectModal = () => {
    if (!showRejectModal) return null;


    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Từ chối đăng ký cửa hàng</h2>
          </div>

          <div className="p-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Nhập lý do từ chối cửa hàng này..."
              required
            />
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setProcessingId(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Huỷ
            </button>
            <button
              onClick={handleRejectStore}
              disabled={!rejectReason.trim()}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${!rejectReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6">
      <p className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Yêu cầu đăng ký cửa hàng</h1>
        <p className="text-gray-600">Quản lý và phê duyệt các yêu cầu đăng ký cửa hàng mới từ người dùng.</p>
      </p>

      {renderStats()}
      {renderStoreTable()}
      {renderStoreDetails()}
      {renderRejectModal()}
    </div>
  );
};

export default StoreRequestsPage;