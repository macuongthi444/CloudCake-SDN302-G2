import React, { useState, useEffect } from 'react';
import { ChevronLeft, Truck, CreditCard, User, MapPin, Package, ShoppingBag, Store, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import ApiService from '../../services/ApiService';
import ShopOwner from '../../assets/avatar.png'; // Fallback image

const OrderDetail = ({ orderId, onBack }) => {
  const [orderData, setOrderData] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // State for enhanced data
  const [customerData, setCustomerData] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [shopData, setShopData] = useState({}); // New state for shop data

  // State for variant data
  const [variantDetails, setVariantDetails] = useState({});

  const [currentOrderStatus, setCurrentOrderStatus] = useState('');
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('');

  const [isCodPayment, setIsCodPayment] = useState(false);
  
  // State for refund processing
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const [refundError, setRefundError] = useState(null);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await ApiService.get(`/order/find/${orderId}`);

        // Kiểm tra xem có phải thanh toán COD hay không
        if (response.order.payment_id && response.order.payment_id.name) {
          const paymentMethod = response.order.payment_id.name.toLowerCase();
          setIsCodPayment(paymentMethod.includes('cod') || paymentMethod.includes('tiền mặt') || paymentMethod.includes('cash'));
        }

        setOrderData(response.order);
        setOrderDetails(response.orderDetails || []);
        setCurrentOrderStatus(response.order.order_status);
        setCurrentPaymentStatus(response.order.status_id);

      } catch (error) {
        console.error("Error fetching order data:", error);
        setError('Lỗi khi tải dữ liệu đơn hàng: ' + error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // Extract customer ID more robustly from orderData
  useEffect(() => {
    if (orderData && orderData.customer_id) {
      fetchCustomerData(orderData.customer_id);
    }
  }, [orderData]);

  // New effect to fetch address data when user_address_id is available
  useEffect(() => {
    if (orderData && orderData.user_address_id) {
      fetchAddressData(orderData.user_address_id);
    }
  }, [orderData]);

  // Separate useEffect for loading product details
  useEffect(() => {
    if (orderDetails && orderDetails.length > 0) {
      fetchProductDetails(orderDetails);
      // Add new function call to fetch variant details
      fetchVariantDetails(orderDetails);
      // Add new function call to fetch shop details
      fetchShopDetails(orderDetails);
    }
  }, [orderDetails]); // Only re-run when orderDetails changes

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get(`/order/find/${orderId}`);

      setOrderData(response.order);
      setOrderDetails(response.orderDetails || []);
      setCurrentStatus(response.order.order_status);

    } catch (error) {
      console.error("Error fetching order data:", error);
      setError('Lỗi khi tải dữ liệu đơn hàng: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer data
  const fetchCustomerData = async (customerId) => {
    try {
      // Make sure we have a valid ID string, not an object
      const userId = typeof customerId === 'object' ? customerId._id : customerId;

      if (!userId) {
        console.error("Invalid customer ID:", customerId);
        return;
      }

      // The correct endpoint based on user.routes.js is /user/:id
      const response = await ApiService.get(`/user/${userId}`);
      setCustomerData(response);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  };

  // New function to fetch address data
  const fetchAddressData = async (addressId) => {
    try {
      const id = typeof addressId === 'object' ? addressId._id : addressId;

      if (!id) {
        console.error("Invalid address ID:", addressId);
        return;
      }

      const response = await ApiService.get(`/address/find/${id}`);
      setAddressData(response);
    } catch (error) {
      console.error("Error fetching address data:", error);
    }
  };

  // Fetch product details including images
  const fetchProductDetails = async (orderDetails) => {
    try {
      const productIds = orderDetails.map(item => {
        // Handle different structures of product_id
        if (typeof item.product_id === 'object' && item.product_id !== null) {
          return item.product_id._id;
        }
        return item.product_id;
      }).filter(id => id); // Filter out any undefined or null IDs

      if (productIds.length === 0) {
        console.warn("No valid product IDs found in order details");
        return;
      }

      const productDetailsPromises = productIds.map(productId =>
        ApiService.get(`/product/${productId}`)
      );

      const productDetailsResults = await Promise.allSettled(productDetailsPromises);

      const productImagesMap = {};

      productDetailsResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const productData = result.value;
          productImagesMap[productIds[index]] = productData.thumbnail;
        } else {
          console.error(`Failed to fetch product ${productIds[index]}:`, result.reason);
        }
      });
      setProductImages(productImagesMap);
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  // New function: Fetch shop details for products
  const fetchShopDetails = async (orderDetails) => {
    try {
      const shopIds = [];
      
      // First, collect all unique shop IDs from the products
      orderDetails.forEach(item => {
        if (item.product_id && item.product_id.shop_id) {
          // Handle shop_id whether it's an object or string
          const shopId = typeof item.product_id.shop_id === 'object' 
            ? item.product_id.shop_id._id 
            : item.product_id.shop_id;
          
          if (shopId && !shopIds.includes(shopId)) {
            shopIds.push(shopId);
          }
        }
      });

      // Get shop information for each unique shop ID
      const newShopData = {};
      
      await Promise.all(shopIds.map(async (shopId) => {
        try {
          const shopInfo = await ApiService.get(`/shops/public/${shopId}`, false);
          if (shopInfo) {
            newShopData[shopId] = shopInfo;
          }
        } catch (error) {
          console.error(`Error fetching shop data for shop ${shopId}:`, error);
        }
      }));
      
      setShopData(newShopData);
    } catch (error) {
      console.error("Error fetching shop details:", error);
    }
  };

  // New function: Get shop name for a product
  const getShopName = (productItem) => {
    if (!productItem || !productItem.shop_id) {
      return "Không xác định";
    }
    
    const shopId = typeof productItem.shop_id === 'object' 
      ? productItem.shop_id._id 
      : productItem.shop_id;
    
    if (shopData[shopId]) {
      return shopData[shopId].name;
    }
    
    // Fallback to product's shop_id.name if available
    if (typeof productItem.shop_id === 'object' && productItem.shop_id.name) {
      return productItem.shop_id.name;
    }
    
    return "Không xác định";
  };

  // New function: Fetch variant details
  const fetchVariantDetails = async (orderDetails) => {
    try {
      // Filter items that have variant_id
      const itemsWithVariants = orderDetails.filter(item => item.variant_id);

      if (itemsWithVariants.length === 0) {
        return;
      }

      // Process each order item with variant_id
      const variantDetailsMap = {};

      for (const item of itemsWithVariants) {
        // Skip if variant_id is already a populated object with attributes
        if (typeof item.variant_id === 'object' &&
          item.variant_id !== null &&
          (item.variant_id.attributes || item.variant_id.name)) {
          variantDetailsMap[item._id] = item.variant_id;
          continue;
        }

        // Extract variant ID and product ID
        const variantId = typeof item.variant_id === 'object'
          ? (item.variant_id._id || item.variant_id.id)
          : item.variant_id;

        const productId = typeof item.product_id === 'object'
          ? (item.product_id._id || item.product_id.id)
          : item.product_id;

        if (!variantId || !productId) {
          continue;
        }


        try {
          // First try to fetch directly by variant ID
          let variantData = null;

          try {
            variantData = await ApiService.get(`/product-variant/${variantId}`);
          } catch (variantError) {

            // If direct fetch fails, try to get all variants for the product and find the right one
            const productVariants = await ApiService.get(`/product-variant/product/${productId}`);

            if (Array.isArray(productVariants)) {
              variantData = productVariants.find(v => v._id === variantId);
            }
          }

          if (variantData) {
            variantDetailsMap[item._id] = variantData;
          }
        } catch (error) {
          console.error(`Error fetching variant for item ${item._id}:`, error);
        }
      }

      setVariantDetails(variantDetailsMap);

    } catch (error) {
      console.error("Error in fetchVariantDetails:", error);
    }
  };

  // Handle status update
  const handleStatusUpdate = (e) => {
    setCurrentStatus(e.target.value);
  };

  // Handle update button click using ApiService with PUT method
  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Chỉ gửi cập nhật trạng thái đơn hàng
      const payload = {
        order_status: currentOrderStatus
      };

      console.log("Sending update request:", payload);

      const response = await ApiService.put(`/order/status/${orderId}`, payload);
      console.log("Update response:", response);

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);

      setTimeout(() => {
        fetchOrderData(); // Refresh data
      }, 500);

    } catch (error) {
      console.error("Update error details:", error);
      setUpdateError(`Lỗi khi cập nhật trạng thái: ${error.message || error}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Xử lý đánh dấu đã hoàn tiền
  const handleMarkAsRefunded = async () => {
    if (window.confirm('Xác nhận đã hoàn tiền cho đơn hàng này?')) {
      try {
        setIsRefunding(true);
        setRefundError(null);
        
        const response = await ApiService.put(`/order/refund/${orderId}`, {});
        
        console.log('Mark as refunded response:', response);
        setRefundSuccess(true);
        
        // Refresh data after a short delay
        setTimeout(() => {
          fetchOrderData();
        }, 1000);
        
        // Hide success message after a few seconds
        setTimeout(() => {
          setRefundSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error marking as refunded:', error);
        setRefundError(`Lỗi khi đánh dấu hoàn tiền: ${error.message || error}`);
      } finally {
        setIsRefunding(false);
      }
    }
  };

  // Chuyển đổi trạng thái đơn hàng (order_status) sang tiếng Việt
  const getOrderStatusText = (orderStatus) => {
    switch (orderStatus) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đã xác nhận';
      case 'shipped':
        return 'Đang vận chuyển';
      case 'delivered':
        return 'Giao hàng thành công';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return orderStatus || 'Không xác định';
    }
  };

  // Lấy class CSS cho trạng thái đơn hàng (order_status)
  const getStatusClass = (orderStatus) => {
    switch (orderStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Lấy class CSS cho trạng thái thanh toán (status_id)
  const getPaymentStatusClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm handle order status update
  const handleOrderStatusUpdate = (e) => {
    setCurrentOrderStatus(e.target.value);
  };

  // Hàm handle payment status update
  const handlePaymentStatusUpdate = (e) => {
    setCurrentPaymentStatus(e.target.value);
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      try {
        setIsUpdating(true);

        // Use PUT method instead of PATCH for cancelling order as well
        const response = await ApiService.put(`/order/cancel/${orderId}`, {});

        fetchOrderData(); // Refresh data
      } catch (error) {
        console.error("Cancel order error:", error);
        setUpdateError('Lỗi khi hủy đơn hàng: ' + error.message || error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Convert backend status to Vietnamese
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đã xác nhận';
      case 'shipped':
        return 'Đang vận chuyển';
      case 'delivered':
        return 'Giao hàng thành công';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Địa chỉ không có sẵn';

    const parts = [];
    if (address.address_line1) parts.push(address.address_line1);
    if (address.address_line2) parts.push(address.address_line2);
    if (address.city) parts.push(address.city);
    if (address.country) parts.push(address.country);

    return parts.join(', ');
  };

  // Render variant attributes
  const renderVariantAttributes = (variant) => {
    if (!variant || !variant.attributes) return null;

    // Handle different attribute formats
    const attributes = variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes;

    if (!attributes || Object.keys(attributes).length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(attributes).map(([key, value]) => (
          <span key={key} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
            <span className="capitalize">{key}</span>: <strong>{value}</strong>
          </span>
        ))}
      </div>
    );
  };

  // Get image for an order item, considering variants
  const getItemImage = (item) => {
    // Check if there's a variant with image
    if (item._id && variantDetails[item._id] &&
      variantDetails[item._id].images &&
      variantDetails[item._id].images.length > 0) {
      return variantDetails[item._id].images[0];
    }

    // Fall back to the product image from our product details fetch
    const productId = typeof item.product_id === 'object' ? item.product_id._id : item.product_id;
    if (productId && productImages[productId]) {
      return productImages[productId];
    }

    // Last fallback to product image in the item data or default image
    return item.product_id?.image || ShopOwner;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!orderData) {
    return <div className="text-red-500 p-4">Không tìm thấy thông tin đơn hàng</div>;
  }

  // Tính toán tổng tiền sản phẩm
  const subtotal = orderDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Phí vận chuyển
  const shippingCost = orderData.shipping_cost || (orderData.shipping_id?.price || 0);

  // Giảm giá (nếu có)
  const discountAmount = orderData.discount_amount || 0;
  const couponAmount = orderData.coupon_amount || 0;

  // Tổng thanh toán - sử dụng giá trị từ API hoặc tính toán nếu cần
  const total = orderData.total_price || (subtotal + shippingCost - discountAmount - couponAmount);

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${orderData.need_pay_back ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <button
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            onClick={onBack}
          >
            <ChevronLeft size={18} className="mr-1" />
            <span>Quay lại</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Đơn hàng #{orderData.id}</h1>

          {/* Trạng thái đơn hàng */}
          <span className={`ml-3 mr-3 px-3 py-1 text-xs font-medium rounded ${getStatusClass(orderData.order_status)}`}>
            {getOrderStatusText(orderData.order_status)}
          </span>

          {!isCodPayment && (
            <p className="flex items-center text-sm ml-3 mr-3 px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              <span className={orderData.status_id === 'paid' ? 'text-green-500' : 'text-yellow-500'}>
                {orderData.status_id === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </p>
          )}
          
          {/* Hiển thị cờ cần hoàn tiền */}
          {orderData.need_pay_back && (
            <div className="flex items-center ml-3 px-3 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
              <AlertTriangle size={14} className="mr-1" />
              <span>Cần hoàn tiền</span>
            </div>
          )}

        </div>

        <div className="flex items-center space-x-3">
          {/* Status update controls for non-cancelled orders */}
          {orderData.order_status !== 'cancelled' && (
            <>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div>
                  <label htmlFor="order-status" className="text-sm text-gray-600 mr-2">Trạng thái đơn hàng:</label>
                  <select
                    id="order-status"
                    className="border border-gray-300 rounded-md px-4 py-2"
                    value={currentOrderStatus}
                    onChange={handleOrderStatusUpdate}
                    disabled={isUpdating}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đã xác nhận</option>
                    <option value="shipped">Đang vận chuyển</option>
                    <option value="delivered">Giao hàng thành công</option>
                  </select>
                </div>
              </div>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleUpdate}
                disabled={isUpdating || currentOrderStatus === orderData.order_status}
              >
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>

              {/* Cancel order button (only for pending/processing) */}
              {(orderData.order_status === 'pending' || orderData.order_status === 'processing') && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                >
                  Hủy đơn
                </button>
              )}
              
              {/* Thêm nút đánh dấu đã hoàn tiền nếu cần hoàn tiền */}
              {orderData.need_pay_back && (
                <button
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
                  onClick={handleMarkAsRefunded}
                  disabled={isRefunding}
                >
                  <RefreshCcw size={16} className="mr-2" />
                  {isRefunding ? 'Đang xử lý...' : 'Đánh dấu đã hoàn tiền'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {updateSuccess && (
        <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Cập nhật trạng thái thành công!
        </div>
      )}

      {updateError && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {updateError}
        </div>
      )}
      
      {/* Thông báo hoàn tiền */}
      {refundSuccess && (
        <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
          <CheckCircle size={18} className="mr-2" />
          Đã đánh dấu hoàn tiền thành công!
        </div>
      )}

      {refundError && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertTriangle size={18} className="mr-2" />
          {refundError}
        </div>
      )}
      
      {/* Hiển thị cảnh báo cần hoàn tiền ngay đầu trang nếu cần */}
      {orderData.need_pay_back && (
        <div className="mx-6 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle size={24} className="text-orange-500 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-700 text-lg">Đơn hàng cần được hoàn tiền</h3>
              <p className="text-orange-600 mt-1">
                Đơn hàng này đã được hủy sau khi khách hàng đã thanh toán. Vui lòng kiểm tra thông tin thanh toán 
                trong hệ thống và thực hiện hoàn tiền cho khách hàng.
              </p>
              {orderData.payment_details && orderData.payment_details.amount && (
                <p className="font-medium text-orange-700 mt-2">
                  Số tiền cần hoàn: {formatPrice(orderData.payment_details.amount)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div>
            Thời gian đặt hàng: {formatDate(orderData.created_at)}
          </div>
          {orderData.order_delivered_at && (
            <div>
              Thời gian giao hàng: {formatDate(orderData.order_delivered_at)}
            </div>
          )}
        </div>

        {/* Order timeline */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Trạng thái đơn hàng</h2>
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderData.order_status !== 'cancelled' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`flex-1 h-1 ${orderData.order_status === 'pending' || orderData.order_status === 'processing' || orderData.order_status === 'shipped' || orderData.order_status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderData.order_status === 'processing' || orderData.order_status === 'shipped' || orderData.order_status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`flex-1 h-1 ${orderData.order_status === 'shipped' || orderData.order_status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderData.order_status === 'shipped' || orderData.order_status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>3</div>
              <div className={`flex-1 h-1 ${orderData.order_status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderData.order_status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>4</div>
            </div>

            <div className="flex justify-between mt-2 text-sm">
              <div className="text-center">
                <p>Chờ xử lý</p>
              </div>
              <div className="text-center">
                <p>Đã xác nhận</p>
              </div>
              <div className="text-center">
                <p>Đang vận chuyển</p>
              </div>
              <div className="text-center">
                <p>Giao hàng Thành công</p>
              </div>
            </div>

            {orderData.order_status === 'cancelled' && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-center">
                Đơn hàng đã bị hủy
                {orderData.need_pay_back && (
                  <div className="text-orange-600 font-medium mt-2">
                    Cần hoàn tiền cho khách hàng
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products section - UPDATED to show shop information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShoppingBag size={20} className="mr-2" />
            Sản phẩm
          </h2>
          <div className="bg-white rounded-md border border-gray-200 p-4">
            {orderDetails.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {orderDetails.map((item) => (
                  <div key={item._id} className="py-4 flex">
                    <div className="w-16 h-16 rounded-md overflow-hidden">
                      <img 
                        src={getItemImage(item)} 
                        alt={item.product_id?.name || "Product"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{item.product_id?.name || "Sản phẩm"}</h3>
                      
                      {/* Hiển thị thông tin shop */}
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Store size={14} className="mr-1 text-blue-600" />
                        <span>Cửa hàng: {getShopName(item.product_id)}</span>
                      </div>
                      
                      {/* Hiển thị thuộc tính biến thể */}
                      {item._id && variantDetails[item._id] && renderVariantAttributes(variantDetails[item._id])}
                      
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-600">
                          <span>Số lượng: {item.quantity}</span>
                          <span className="mx-2">|</span>
                          <span>Đơn giá: {formatPrice(item.price)}</span>
                        </div>
                        <div className="font-medium text-blue-600">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Không có dữ liệu chi tiết sản phẩm</p>
            )}
          </div>
        </div>

        {/* Products section - Updated to show variant information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard size={20} className="mr-2" />
            Thanh toán
          </h2>
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <div className="flex items-start mb-4">
              <div className="bg-gray-100 p-2 rounded-md mr-3">
                <CreditCard size={20} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{orderData.payment_id?.name || 'Phương thức thanh toán'}</h3>
                {!isCodPayment && (
                  <p className="flex items-center text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${orderData.status_id === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span className={orderData.status_id === 'paid' ? 'text-green-500' : 'text-yellow-500'}>
                      {orderData.status_id === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </p>
                )}

                {orderData.order_payment_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mã thanh toán: {orderData.order_payment_id}
                  </p>
                )}
                
                {/* Hiển thị trạng thái hoàn tiền */}
                {orderData.status_id === 'paid' && orderData.order_status === 'cancelled' && (
                  <div className="mt-2">
                    <p className={`flex items-center text-sm ${orderData.need_pay_back ? 'text-orange-600' : 'text-green-600'}`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${orderData.need_pay_back ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                      {orderData.need_pay_back ? 'Cần hoàn tiền' : 'Đã hoàn tiền'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hiển thị chi tiết thanh toán nếu có */}
            {orderData.payment_details && Object.keys(orderData.payment_details).length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Chi tiết thanh toán</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {orderData.payment_details.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-medium text-gray-800">{formatPrice(orderData.payment_details.amount)}</span>
                    </div>
                  )}
                  {orderData.payment_details.description && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600">Mô tả:</span>
                      <span className="font-medium text-gray-800">{orderData.payment_details.description}</span>
                    </div>
                  )}
                  {orderData.payment_details.orderCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-medium text-gray-800">{orderData.payment_details.orderCode}</span>
                    </div>
                  )}
                  {orderData.payment_details.accountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên tài khoản:</span>
                      <span className="font-medium text-gray-800">{orderData.payment_details.accountName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Left column */}
          <div>
            {/* Order summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                Chi tiết đơn hàng
              </h2>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tổng giá sản phẩm</span>
                  <span className="font-medium">{formatPrice(orderData.original_price || subtotal)}</span>
                </div>

                {/* Display both discount and coupon if available */}
                {discountAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-medium">
                      {formatPrice(discountAmount)}
                      {orderData.discount_id && (
                        <span className="text-sm ml-1 text-gray-500">
                          ({orderData.discount_id.code})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {couponAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mã giảm giá</span>
                    <span className="font-medium">
                      {formatPrice(couponAmount)}
                      {orderData.coupon_id && (
                        <span className="text-sm ml-1 text-gray-500">
                          ({orderData.coupon_id.code})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Hiển thị chi tiết giảm giá nếu có */}
                {orderData.discount_id && (
                  <div className="py-2 border-b border-gray-100">
                    <div className="text-gray-600 text-sm">
                      <div><span className="font-medium">Tên:</span> {orderData.discount_id.name}</div>
                      <div><span className="font-medium">Mã:</span> {orderData.discount_id.code}</div>
                      {orderData.discount_id.description && (
                        <div><span className="font-medium">Mô tả:</span> {orderData.discount_id.description}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hiển thị chi tiết coupon nếu có */}
                {orderData.coupon_id && (
                  <div className="py-2 border-b border-gray-100">
                    <div className="text-gray-600 text-sm">
                      <div><span className="font-medium">Tên coupon:</span> {orderData.coupon_id.name}</div>
                      <div><span className="font-medium">Mã coupon:</span> {orderData.coupon_id.code}</div>
                      {orderData.coupon_id.description && (
                        <div><span className="font-medium">Mô tả:</span> {orderData.coupon_id.description}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between py-3 mt-1">
                  <span className="text-gray-800 font-semibold">Tổng thanh toán</span>
                  <span className="font-bold text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Truck size={20} className="mr-2" />
                Vận chuyển
              </h2>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <div className="flex items-start mb-4">
                  <div className="bg-red-100 p-2 rounded-md mr-3">
                    <Truck size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{orderData.shipping_id?.name || 'Giao hàng tiêu chuẩn'}</h3>
                    <p className="text-gray-600 text-sm">Dự kiến 1-3 ngày</p>
                  </div>
                  <div className="ml-auto font-semibold">{formatPrice(shippingCost)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Customer information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Khách hàng
              </h2>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <div className="flex items-start mb-4">
                  <div className="mr-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(customerData?.firstName || orderData.customer_id?.firstName || 'A').charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {customerData?.firstName || orderData.customer_id?.firstName || ''} {customerData?.lastName || orderData.customer_id?.lastName || ''}
                    </h3>
                    <p className="text-gray-500 text-sm">ID: {orderData.customer_id?._id?.substring(0, 8) || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-gray-600">{customerData?.email || orderData.customer_id?.email || 'Email không có sẵn'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span className="text-gray-600">{customerData?.phone || orderData.customer_id?.phone || 'Số điện thoại không có sẵn'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Địa chỉ nhận hàng
              </h2>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <p className="text-gray-700">
                  {addressData ? formatAddress(addressData) : (
                    orderData.user_address_id ? `Đang tải địa chỉ...` : 'Địa chỉ giao hàng không có sẵn'
                  )}
                </p>
                {addressData && addressData.phone && (
                  <p className="text-gray-500 text-sm mt-2">
                    Số điện thoại: {addressData.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;