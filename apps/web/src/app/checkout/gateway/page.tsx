'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentGatewaySimulation() {
  const params = useSearchParams();
  const transactionId = params.get('transactionId');
  const amount = params.get('amount');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState<'CARD' | 'QR'>('CARD');

  // Thẻ Test Nội Địa (Mẫu VNPAY)
  const [cardNumber, setCardNumber] = useState('9704198526191432198');
  const [cardName, setCardName] = useState('NGUYEN VAN A');
  const [issueDate, setIssueDate] = useState('07/15');

  // Hàm giả lập Thanh Toán Tự Động
  const handlePay = () => {
    setLoading(true);
    // Giả lập thời gian network delay cúa ngân hàng (2 giây)
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      // Chờ thêm 1.5s để người dùng kịp nhìn thấy dấu tích xanh, rồi bắn Webhook
      setTimeout(() => {
        // Redirect qua Webhook của API, API sẽ xử lý DB (PAID) sau đó redirect ngược lại /orders
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        window.location.href = `${apiUrl}/payments/webhook?transactionId=${transactionId}&vnp_ResponseCode=00`;
      }, 1500);
    }, 2000);
  };

  if (!transactionId || !amount) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="card p-8 max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Giao dịch không hợp lệ</h2>
          <p className="text-slate-500 text-sm mb-6">Thiếu mã giao dịch hoặc số tiền. Vui lòng quay lại giỏ hàng.</p>
          <Link href="/cart" className="btn-primary w-full">Quay lại Giỏ Hàng</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-slate-800">
      
      {/* Header Giả Lập Ngân Hàng */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black italic text-xl">
              V
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Cổng Thanh Toán Nội Địa</h1>
              <p className="text-xs text-slate-500 font-medium">Môi trường kiểm thử (Sandbox)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Tổng thanh toán</p>
            <p className="text-xl font-black text-blue-700">{Number(amount).toLocaleString('vi-VN')} VND</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {success ? (
          // Màn hình thành công (Tạm thời nửa giây trước khi bắn sang Webhook)
          <div className="card max-w-md mx-auto p-10 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="animate-in fade-in zoom-in duration-500 delay-150" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-slate-500 mb-6 font-medium">Đang chuyển hướng về trang Thương Mại Điện Tử...</p>
            <Loader2 className="animate-spin text-green-600 mx-auto" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cột trái: Thông tin đơn vị chấp nhận thẻ */}
            <div className="md:col-span-1 space-y-6">
              <div className="card p-5 bg-white border-none shadow-sm h-full">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Thông tin giao dịch</h3>
                <div className="space-y-4 text-sm font-medium">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Mã tham chiếu (Txn)</p>
                    <p className="text-slate-900 font-mono bg-slate-50 p-2 rounded-lg break-all">{transactionId}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Đơn vị cung cấp</p>
                    <p className="text-slate-900">TradeMart B2B E-Commerce</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Lý do thanh toán</p>
                    <p className="text-slate-900">Thanh toán đơn hàng tự động</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                  <ShieldCheck size={18} /> Giao dịch được bảo vệ an toàn tuyệt đối
                </div>
              </div>
            </div>

            {/* Cột phải: Form nhập thẻ */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Tabs chọn hình thức */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setMethod('CARD')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${method === 'CARD' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  <CreditCard size={18} /> Thẻ ATM Nội địa
                </button>
                <button 
                  onClick={() => setMethod('QR')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${method === 'QR' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  <Smartphone size={18} /> Quét mã QR Pay
                </button>
              </div>

              {method === 'CARD' && (
                <div className="card p-8 shadow-sm border-none bg-white min-h-[400px]">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Nhập thông tin thẻ Test</h2>
                  
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm mb-6 flex gap-3">
                    <div className="mt-0.5"><ShieldCheck size={16} /></div>
                    <div>
                      Đây là cổng Sandbox. Sử dụng thẻ <strong className="font-mono">9704198526191432198</strong>, Tên <strong className="font-mono">NGUYEN VAN A</strong>, Ngày phát hành <strong className="font-mono">07/15</strong> để mô phỏng gạch nợ thành công.
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Số thẻ / Card Number</label>
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-lg font-bold tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Tên in trên thẻ</label>
                        <input 
                          type="text" 
                          value={cardName}
                          onChange={e => setCardName(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Ngày phát hành (MM/YY)</label>
                        <input 
                          type="text" 
                          value={issueDate}
                          onChange={e => setIssueDate(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="my-8 border-slate-100" />

                  <button
                    onClick={handlePay}
                    disabled={loading || !cardNumber || !cardName || !issueDate}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Đang xử lý giao dịch...</span>
                    ) : (
                      <span className="flex items-baseline gap-2">XÁC NHẬN THANH TOÁN TỰ ĐỘNG <span className="opacity-70 text-sm italic font-normal">({Number(amount).toLocaleString('vi-VN')} VND)</span></span>
                    )}
                  </button>
                </div>
              )}

              {method === 'QR' && (
                <div className="card p-8 shadow-sm border-none bg-white min-h-[400px] flex flex-col items-center justify-center text-center">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Quét mã QR để thanh toán</h2>
                  <p className="text-sm text-slate-500 mb-8">Sử dụng ứng dụng Mobile Banking gắn mã test để quét QR.</p>
                  
                  <div className="p-4 bg-white border-4 border-blue-100 rounded-3xl inline-block mb-6 relative">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_VNPAY_QR_DATA" alt="QR Code" className="w-[200px] h-[200px]" />
                    {/* Fake scan line animation */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-blue-500/50 blur-sm animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>

                  <p className="text-lg font-black text-blue-700 mb-6">{Number(amount).toLocaleString('vi-VN')} VND</p>

                  <button
                    onClick={handlePay}
                    disabled={loading}
                    className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Mô phỏng: Đã quét trên điện thoại'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
