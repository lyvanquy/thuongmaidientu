'use client';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Trash2, MapPin, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user, isInitialized } = useAuthStore() as any; // Ignore strict typing error for isInitialized if removed earlier
  
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user && mounted) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, mounted, router]);

  if (!mounted || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
  }

  const subTotal = getTotal();
  const shippingFee = subTotal > 1000000 ? 0 : 30000;
  const total = subTotal + shippingFee;

  const handleCheckout = async () => {
    if (items.length === 0) return alert('Giỏ hàng trống!');
    if (!address.trim()) return alert('Vui lòng nhập địa chỉ giao hàng!');

    setLoading(true);
    try {
      // 1. Tạo đơn hàng B2C
      const orderRes = await api.post('/orders/b2c', {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        address,
        note
      });
      const order = orderRes.data;

      // 2. Lấy URL Thanh toán
      const paymentRes = await api.post(`/payments/${order.id}/create-url`, { method: paymentMethod });
      
      clearCart();

      // Nếu là VNPay Sandbox thì Gateway sẽ trả redirectUrl, ta chuyển hướng người dùng
      if (paymentRes.data?.redirectUrl) {
        window.location.href = paymentRes.data.redirectUrl;
      } else {
        alert('Đặt hàng thành công!');
        router.push('/');
      }

    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-4xl">🛒</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-slate-500 mb-6">Hãy thêm một vài sản phẩm vào giỏ nhé.</p>
        <Link href="/products" className="btn-primary">Khám phá Sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b border-slate-200">
        <div className="container-main py-4 flex items-center text-sm font-medium">
          <Link href="/cart" className="text-primary-700">Giỏ hàng</Link>
          <ChevronRight size={16} className="mx-2 text-slate-400" />
          <span className="text-slate-900">Thanh toán an toàn</span>
        </div>
      </div>

      <div className="container-main py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Hoàn tất Đặt hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Địa chỉ Giao Hàng */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="text-primary-600" /> Địa chỉ Giao hàng
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ đầy đủ *</label>
                  <textarea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện..." className="input w-full"
                    value={address} onChange={e => setAddress(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú cho người bán</label>
                  <input type="text" placeholder="Ví dụ: Giao giờ hành chính..." className="input w-full"
                    value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Danh sách Sản phẩm */}
            <div className="card p-6 overflow-hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Sản Phẩm ({items.length})</h2>
              <div className="divide-y divide-slate-100">
                {items.map(item => (
                  <div key={item.productId} className="py-4 flex items-start gap-4">
                    <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-slate-500 mb-2">Cung cấp bởi: {item.companyName || 'TradeMart'}</p>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-primary-700">{item.price.toLocaleString()}đ</div>
                        <div className="flex items-center gap-3">
                          <input type="number" className="input !py-1 w-16 text-center select-none" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))} />
                          <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Tổng tiền */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Tóm tắt Đơn hàng</h2>
              
              <div className="space-y-3 text-sm text-slate-600 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-900">{subTotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-slate-900">{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()}đ`}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary-700">{total.toLocaleString()}đ</span>
                </div>
                <p className="text-xs text-right text-slate-500">(Đã bao gồm VAT nếu có)</p>
              </div>

              <div className="space-y-3 mb-6">
                <label className="block text-sm font-semibold text-slate-700">Phương thức thanh toán</label>
                <div className="space-y-2 text-sm text-slate-700">
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition border-primary-500 bg-primary-50">
                    <input type="radio" value="COD" checked={paymentMethod==='COD'} onChange={()=>setPaymentMethod('COD')} className="accent-primary-600 w-4 h-4" />
                    Thanh toán khi nhận hàng (COD)
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition border-slate-200">
                    <input type="radio" value="VNPAY" checked={paymentMethod==='VNPAY'} onChange={()=>setPaymentMethod('VNPAY')} className="accent-primary-600 w-4 h-4" />
                    Chuyển khoản / Cổng Mock VNPay
                  </label>
                </div>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={loading}
                className="btn-primary w-full !py-3.5 text-lg"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Xác nhận Đặt hàng'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-green-600" />
                <span>Thanh toán bảo mật cực kỳ an toàn</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
