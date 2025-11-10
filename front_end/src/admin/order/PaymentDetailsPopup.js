import React from 'react';
import { X, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

const PaymentDetailsPopup = ({ paymentDetails, onClose, orderStatusId, need_pay_back }) => {
  if (!paymentDetails) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Kiểm tra trạng thái thanh toán từ status_id của đơn hàng
  const isPaymentPaid = (statusId) => {
    return statusId === 'paid';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Chi tiết thanh toán</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Thêm thông báo cần hoàn tiền */}
        {need_pay_back && (
          <div className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle size={20} className="text-orange-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-700">Đơn hàng cần hoàn tiền</h3>
                <p className="text-orange-600 mt-1 text-sm">
                  Đơn hàng này đã bị hủy sau khi khách hàng đã thanh toán. Vui lòng sử dụng thông tin thanh toán 
                  này để thực hiện hoàn tiền cho khách hàng.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6 grid grid-cols-1 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="text-lg font-semibold text-blue-800 mb-2">Thông tin thanh toán</div>
            <p className="text-blue-600">{paymentDetails.description || 'Không có mô tả'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Mã giao dịch</p>
              <p className="font-medium">{paymentDetails.orderCode || paymentDetails.order_payment_id || '-'}</p>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Số tiền</p>
              <p className="font-medium text-green-600">{formatPrice(paymentDetails.amount)}</p>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Thời gian giao dịch</p>
              <p className="font-medium">{formatDate(paymentDetails.transactionTime)}</p>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Người thanh toán</p>
              <p className="font-medium">{paymentDetails.payerName || paymentDetails.accountName || '-'}</p>
            </div>
            {paymentDetails.accountNumber && (
              <div className="border p-3 rounded-md">
                <p className="text-sm text-gray-600">Số tài khoản</p>
                <p className="font-medium">{paymentDetails.accountNumber}</p>
              </div>
            )}
            
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Mã ngân hàng (BIN)</p>
              <p className="font-medium">{paymentDetails.bin || "MB Bank"}</p>
            </div>
     
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Loại tiền tệ</p>
              <p className="font-medium">{paymentDetails.currency || 'VND'}</p>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Mã tham chiếu</p>
              <p className="font-medium">{paymentDetails.paymentReference || '-'}</p>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Trạng thái</p>
              <div className="flex items-center">
                <p className={`font-medium ${isPaymentPaid(orderStatusId) ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isPaymentPaid(orderStatusId) ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
                {need_pay_back && (
                  <span className="inline-flex items-center ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                    <RefreshCcw size={12} className="mr-1" />
                    Cần hoàn tiền
                  </span>
                )}
              </div>
            </div>
            <div className="border p-3 rounded-md">
              <p className="text-sm text-gray-600">Payment Link ID</p>
              <p className="font-medium text-xs truncate">{paymentDetails.paymentLinkId || '-'}</p>
            </div>
          </div>

          {paymentDetails.qrCode && (
            <div className="mt-4 border p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">Mã QR thanh toán</p>
              <div className="flex justify-center">
                <img src={paymentDetails.qrCode} alt="Mã QR thanh toán" className="max-w-full h-auto max-h-60" />
              </div>
            </div>
          )}
          
          {/* Thêm hướng dẫn hoàn tiền nếu cần */}
          {need_pay_back && (
            <div className="mt-4 bg-gray-50 p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <RefreshCcw size={16} className="mr-2 text-orange-600" />
                Hướng dẫn hoàn tiền
              </h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Đăng nhập vào cổng thanh toán PayOS hoặc Ngân hàng tương ứng.</li>
                <li>Tìm đến giao dịch với mã <span className="font-medium">{paymentDetails.orderCode || paymentDetails.order_payment_id}</span></li>
                <li>Thực hiện thao tác hoàn tiền theo quy trình của cổng thanh toán.</li>
                <li>Sau khi hoàn tiền thành công, đánh dấu đã hoàn tiền trong hệ thống.</li>
                <li>Liên hệ khách hàng để thông báo về việc hoàn tiền.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPopup;