'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft, Truck, PackageCheck, CheckCircle, Clock, XCircle, Package, Home, MapPin } from 'lucide-react';
import { ShipmentTimeline } from '@/components/shipment/ShipmentTimeline';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Chờ xác nhận', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  CONFIRMED: { label: 'Đã xác nhận',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  PAID:      { label: 'Đã thanh toán',color: 'text-indigo-700', bg: 'bg-indigo-100' },
  SHIPPED:   { label: 'Đang giao',    color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  DELIVERED: { label: 'Đã giao',      color: 'text-teal-700',   bg: 'bg-teal-100' },
  COMPLETED: { label: 'Hoàn thành',   color: 'text-green-700',  bg: 'bg-green-100' },
  CANCELLED: { label: 'Đã hủy',       color: 'text-red-700',    bg: 'bg-red-100' },
};

const SHIPMENT_STATUSES = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const [carrier, setCarrier] = useState('GHTK');
  const [newShipStatus, setNewShipStatus] = useState('IN_TRANSIT');

  const { data: order, isLoading } = useQuery({
    queryKey: ['seller-order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const confirmMut = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/status`, { status: 'CONFIRMED' }),
    onSuccess: () => {
      toast.success('Đã xác nhận đơn hàng!');
      qc.invalidateQueries({ queryKey: ['seller-order', id] });
    },
    onError: () => toast.error('Lỗi xác nhận đơn'),
  });

  const createShipmentMut = useMutation({
    mutationFn: () => api.post(`/shipments/order/${id}`, { provider: carrier }),
    onSuccess: () => {
      toast.success(`Đã tạo vận đơn với ${carrier}!`);
      qc.invalidateQueries({ queryKey: ['seller-order', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Lỗi tạo vận đơn'),
  });

  const updateShipmentMut = useMutation({
    mutationFn: (shipmentId: string) => api.patch(`/shipments/${shipmentId}/status`, { status: newShipStatus }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái vận đơn!');
      qc.invalidateQueries({ queryKey: ['seller-order', id] });
    },
    onError: () => toast.error('Lỗi cập nhật trạng thái'),
  });

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32}/></div>;
  if (!order) return <div className="py-20 text-center text-slate-400">Không tìm thấy đơn hàng</div>;

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ArrowLeft className="text-slate-600" size={20}/>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chi tiết Đơn hàng</h2>
          <p className="text-sm font-mono text-slate-500">#{order.orderNumber?.toUpperCase()}</p>
        </div>
        <span className={`ml-auto text-sm font-bold px-3 py-1.5 rounded-xl ${statusCfg.bg} ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Products */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package size={18} className="text-primary-600"/> Sản phẩm
            </h3>
            <div className="space-y-3">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.product?.name}</p>
                    <p className="text-xs text-slate-500">x{item.quantity} · {item.price?.toLocaleString()}đ/sp</p>
                  </div>
                  <p className="font-bold text-primary-700">{item.total?.toLocaleString()}đ</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500"><span>Tạm tính</span><span>{order.subTotal?.toLocaleString()}đ</span></div>
              <div className="flex justify-between text-slate-500"><span>Phí ship</span><span>{order.shippingFee === 0 ? 'Miễn phí' : `${order.shippingFee?.toLocaleString()}đ`}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{order.discount?.toLocaleString()}đ</span></div>}
              <div className="flex justify-between font-black text-slate-900 text-base border-t border-slate-100 pt-2 mt-2">
                <span>Tổng cộng</span><span className="text-primary-700">{order.total?.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-5 flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ giao hàng</p>
              <p className="text-sm text-slate-800">{order.address || 'Không có thông tin'}</p>
            </div>
          </div>

          {/* Shipment Timeline if exists */}
          {order.shipment && (
            <div className="card overflow-hidden">
              <ShipmentTimeline orderId={order.id} shipment={order.shipment}/>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          
          {/* Confirm Order */}
          {order.status === 'PENDING' && (
            <div className="card p-5 border-l-4 border-yellow-400">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Clock size={16} className="text-yellow-600"/> Xác nhận đơn hàng</h3>
              <p className="text-sm text-slate-500 mb-4">Đơn hàng đang chờ xác nhận của bạn. Hãy kiểm tra và xác nhận.</p>
              <button onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending} className="btn-primary w-full !py-2">
                {confirmMut.isPending ? <Loader2 size={16} className="animate-spin mr-2"/> : <PackageCheck size={16} className="mr-2"/>}
                Xác nhận Đơn hàng
              </button>
            </div>
          )}

          {/* Create Shipment */}
          {(order.status === 'CONFIRMED' || order.status === 'PAID') && !order.shipment && (
            <div className="card p-5 border-l-4 border-cyan-400">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Truck size={16} className="text-cyan-600"/> Tạo vận đơn</h3>
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-600 block mb-1">Đơn vị vận chuyển</label>
                <select className="input border-slate-300" value={carrier} onChange={e => setCarrier(e.target.value)}>
                  <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                  <option value="VNPOST">Vietnam Post</option>
                  <option value="VIETTEL">Viettel Post</option>
                  <option value="NINJA_VAN">Ninja Van</option>
                  <option value="NoiBo">Nội Bộ / Tự giao</option>
                </select>
              </div>
              <button onClick={() => createShipmentMut.mutate()} disabled={createShipmentMut.isPending} className="btn-primary w-full !py-2 bg-cyan-600 hover:bg-cyan-700 border-cyan-700">
                {createShipmentMut.isPending ? <Loader2 size={16} className="animate-spin mr-2"/> : <Truck size={16} className="mr-2"/>}
                Tạo vận đơn
              </button>
            </div>
          )}

          {/* Update Shipment Status */}
          {order.shipment && order.shipment.status !== 'DELIVERED' && (
            <div className="card p-5 border-l-4 border-blue-400">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><MapPin size={16} className="text-blue-600"/> Cập nhật hành trình</h3>
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-600 block mb-1">Trạng thái mới</label>
                <select className="input border-slate-300" value={newShipStatus} onChange={e => setNewShipStatus(e.target.value)}>
                  <option value="PENDING">Chờ lấy hàng (PENDING)</option>
                  <option value="PICKED_UP">Đã lấy hàng (PICKED_UP)</option>
                  <option value="IN_TRANSIT">Đang vận chuyển (IN_TRANSIT)</option>
                  <option value="DELIVERED">Đã giao hàng (DELIVERED)</option>
                </select>
              </div>
              <button onClick={() => updateShipmentMut.mutate(order.shipment.id)} disabled={updateShipmentMut.isPending} className="btn-primary w-full !py-2">
                {updateShipmentMut.isPending ? <Loader2 size={16} className="animate-spin mr-2"/> : <CheckCircle size={16} className="mr-2"/>}
                Cập nhật trạng thái
              </button>
              <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                Mã vận đơn: <span className="font-bold text-slate-700">{order.shipment.trackingCode}</span>
              </div>
            </div>
          )}

          {/* Delivered success */}
          {order.status === 'DELIVERED' && (
            <div className="card p-5 bg-green-50 border-green-200 text-center">
              <CheckCircle size={32} className="text-green-600 mx-auto mb-2"/>
              <h3 className="font-bold text-green-800">Đã giao hàng thành công!</h3>
              <p className="text-sm text-green-600 mt-1">Đơn hàng này đã được giao tới khách hàng.</p>
            </div>
          )}

          {/* Cancelled */}
          {order.status === 'CANCELLED' && (
            <div className="card p-5 bg-red-50 border-red-200 text-center">
              <XCircle size={32} className="text-red-500 mx-auto mb-2"/>
              <h3 className="font-bold text-red-700">Đơn hàng đã bị hủy</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
