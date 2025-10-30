import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react';
import CartService from '../../services/CartService';
import { useAuth } from '../Login/context/AuthContext';
import { useNavigate } from 'react-router-dom';
const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const { currentUser } = useAuth();

  
  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadCart();
    }
  }, [currentUser]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CartService.getCartByUserId(currentUser.id);
      setCart(data);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Không thể tải giỏ hàng');
      // Create empty cart if user doesn't have one
      setCart({
        userId: currentUser.id,
        items: [],
        totalPrice: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      await CartService.updateItemQuantity({
        userId: currentUser.id,
        productId,
        quantity: newQuantity
      });
      await loadCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Không thể cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }

    try {
      await CartService.removeItemFromCart(productId, currentUser.id);
      await loadCart();
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Không thể xóa sản phẩm');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      return;
    }

    try {
      await CartService.clearCart(currentUser.id);
      await loadCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('Không thể xóa giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadCart}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart size={32} />
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-600 mt-2">
            {items.length > 0 ? `${items.length} sản phẩm trong giỏ hàng` : 'Giỏ hàng của bạn đang trống'}
          </p>
        </div>

        {items.length === 0 ? (
          // Empty Cart
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">Chưa có sản phẩm nào trong giỏ hàng của bạn</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Sản phẩm trong giỏ hàng</h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.productId} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ShoppingCart size={32} className="text-gray-400" />
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{item.productName}</h3>
                          <p className="text-lg font-semibold text-blue-600">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-sm text-gray-600">Số lượng:</span>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-3 py-1">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price and Remove */}
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-lg font-bold text-gray-900">
                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="text-gray-900">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-gray-900">Miễn phí</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {totalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition mb-3">
                  Tiến hành thanh toán
                </button>

                <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;


