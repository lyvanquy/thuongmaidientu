'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2, Package, Truck, CheckCircle, XCircle, Clock, ChevronRight, Home } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:   { label: 'Chờ xác nhận', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: CheckCircle },
  PAID:      { label: 'Đã thanh toán',color: 'text-indigo-700', bg: 'bg-indigo-100', icon: CheckCircle },
  SHIPPED:   { label: 'Đang giao',    color: 'text-cyan-700',   bg: 'bg-cyan-100',   icon: Truck },
  DELIVERED: { label: 'Đã giao hàng',  color: 'text-teal-700',  bg: 'bg-teal-100',   icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành',   color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',       color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment_status');
  const paymentCod = searchParams.get('payment');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (paymentStatus === 'success' || paymentCod === 'cod_success') {
      const t = setTimeout(() => setShowBanner(false), 6000);
      return () => clearTimeout(t);
    }
  }, [paymentStatus, paymentCod]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
    enabled: !!user,
  });

  if (!user) {
    router.push('/auth/login?redirect=/orders');
    return null;
  }

  const orders = data?.items || [];

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-main">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag size={24} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lịch sử Đơn hàng</h1>
            <p className="text-slate-500 text-sm">Theo dõi trạng thái tất cả đơn hàng của bạn</p>
          </div>
        </div>

        {/* Thanh toán thành công */}
        {showBanner && (paymentStatus === 'success' || paymentCod === 'cod_success') && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4 text-green-800 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">
              🎉
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-base">Thanh toán tự động thành công!</p>
              <p className="text-sm text-green-700 opacity-90">Hệ thống đã ghi nhận. Kiểm tra trạng thái đơn hàng mới nhất bên dưới nhé.</p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-green-500 hover:text-green-700 font-bold text-xl leading-none">×</button>
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-800">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">
              ⚠️
            </div>
            <div>
              <p className="font-extrabold text-base">Thanh toán thất bại!</p>
              <p className="text-sm text-red-700 opacity-90">Giao dịch bị từ chối. Vui lòng kiểm tra và thử lại.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
        ) : orders.length === 0 ? (
          <div className="card p-16 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">Bạn chưa có đơn hàng nào</h3>
            <p className="text-slate-400 mb-6">Hãy khám phá sản phẩm và đặt hàng đầu tiên!</p>
            <Link href="/products" className="btn-primary mx-auto">
              <Package size={16} /> Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Order List */}
            <div className="lg:w-80 flex-shrink-0 space-y-3">
              {orders.map((order: any) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`card p-4 cursor-pointer hover:border-primary-200 transition-all ${selectedOrder?.id === order.id ? 'border-primary-400 shadow-md ring-1 ring-primary-200' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">#{order.orderNumber?.substring(0, 12).toUpperCase()}</p>
                        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-primary-700">{order.total?.toLocaleString('vi-VN')}đ</p>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>

                    {/* Mini product list */}
                    <div className="flex gap-1.5 mt-2">
                      {(order.items || []).slice(0, 3).map((item: any) => (
                        <div key={item.id} className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0]?.url
                            ? <img src={item.product.images[0].url} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          }
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Detail */}
            <div className="flex-1">
              {selectedOrder ? (
                <OrderDetail order={selectedOrder} />
              ) : (
                <div className="card p-16 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                  <ShoppingBag size={48} className="mb-3 text-slate-200" />
                  <p>Chọn một đơn hàng để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order }: { order: any }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const currentStep = TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">#{order.orderNumber?.toUpperCase()}</h2>
          <p className="text-sm text-slate-500">Đặt {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${cfg.bg} ${cfg.color}`}>
          <Icon size={15} /> {cfg.label}
        </span>
      </div>

      {/* Tracking Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Lộ trình đơn hàng</h3>
          <div className="flex items-center gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const stepCfg = STATUS_CONFIG[step]!;
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done ? 'bg-primary-600 border-primary-600 text-white' :
                      'bg-white border-slate-200 text-slate-300'
                    } ${active ? 'ring-4 ring-primary-100 scale-110' : ''}`}>
                      {done ? <CheckCircle size={16} /> : <span className="text-[10px]">{i + 1}</span>}
                    </div>
                    <p className={`text-[9px] font-semibold mt-1 text-center w-14 leading-tight ${done ? 'text-primary-700' : 'text-slate-400'}`}>
                      {stepCfg.label}
                    </p>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${done && i < currentStep ? 'bg-primary-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipment info */}
      {order.shipment && (
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-cyan-50">
          <Truck size={18} className="text-cyan-600" />
          <div className="text-sm">
            <span className="font-semibold text-slate-800">Mã vận đơn: </span>
            <span className="font-mono text-cyan-700 font-bold">{order.shipment.trackingNumber || '—'}</span>
            {order.shipment.carrier && <span className="text-slate-500"> · {order.shipment.carrier}</span>}
          </div>
        </div>
      )}

      {/* Delivery address */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-start gap-3">
        <Home size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-slate-500">Địa chỉ giao hàng</p>
          <p className="text-sm text-slate-800">{order.address || 'Không có thông tin'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Sản phẩm đặt hàng</h3>
        <div className="space-y-3">
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                {item.product?.images?.[0]?.url
                  ? <img src={item.product.images[0].url} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.product?.name}</p>
                <p className="text-xs text-slate-500">x{item.quantity} · {item.price?.toLocaleString('vi-VN')}đ/sp</p>
              </div>
              <p className="text-sm font-bold text-primary-700 flex-shrink-0">{item.total?.toLocaleString('vi-VN')}đ</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-5 bg-slate-50">
        <div className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-slate-600">
            <span>Tạm tính</span>
            <span>{order.subTotal?.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Phí vận chuyển</span>
            <span className={order.shippingFee === 0 ? 'text-green-600 font-semibold' : ''}>
              {order.shippingFee === 0 ? 'Miễn phí' : `${order.shippingFee?.toLocaleString('vi-VN')}đ`}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Giảm giá</span>
              <span>-{order.discount?.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base text-slate-900 border-t border-slate-200 pt-2">
            <span>Tổng cộng</span>
            <span className="text-primary-700">{order.total?.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {order.contract && (
          <Link href={`/contracts/${order.contract.id}`} className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:underline">
            <Package size={14} /> Xem hợp đồng liên quan →
          </Link>
        )}
      </div>
    </div>
  );
}
