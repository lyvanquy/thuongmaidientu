'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Eye, PackageCheck, Search, Truck } from 'lucide-react';
import Link from 'next/link';

export default function SupplierOrdersPage() {
  const [tab, setTab] = useState<'b2c' | 'b2b'>('b2c');
  const [page, setPage] = useState(1);

  // In real app, api.get('/orders/my') returns orders.
  // The backend OrderService handles returning orders based on Role=SUPPLIER.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['supplier_orders', { page, tab }],
    queryFn: () => api.get(`/orders/my?page=${page}&type=${tab}`).then(res => res.data)
  });

  const updateStatus = async (id: string, status: string) => {
    if (!confirm(`Xác nhận chuyển đơn sang trạng thái ${status}?`)) return;
    try {
      if (status === 'SHIPPED') {
        // Gọi Shipment API tạo tracking mới
        await api.post(`/shipments/order/${id}`, { provider: 'GHTK' });
      } else {
        await api.patch(`/orders/${id}/status`, { status });
      }
      refetch();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đơn hàng</h2>
          <p className="text-slate-500 text-sm">Xử lý đơn đặt hàng từ khách hàng và hợp đồng</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setTab('b2c')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab==='b2c' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Đơn hàng bán lẻ (B2C)
          </button>
          <button 
            onClick={() => setTab('b2b')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab==='b2b' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Đơn từ Hợp đồng (B2B)
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm theo mã đơn..." className="input pl-10 w-full" />
          </div>
          <div className="flex gap-2">
            <select className="input !py-2 text-sm">
              <option value="">Trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="SHIPPED">Đang giao</option>
              <option value="DELIVERED">Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4">Mã Đơn</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="skeleton h-6 w-full" /></td></tr>
                ))
              ) : data?.items?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Không có đơn hàng nào.</td></tr>
              ) : (
                data?.items?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">#{order.orderNumber.substring(0, 8)}</td>
                    <td className="px-6 py-4">
                      {order.items?.length > 0 
                        ? <div className="truncate w-48">{order.items[0].product?.name} {order.items.length > 1 && `(+${order.items.length - 1})`}</div>
                        : 'Đơn hàng Hợp đồng'}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary-700">
                      {order.total.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'PENDING' && (
                          <button onClick={() => updateStatus(order.id, 'CONFIRMED')} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Xác nhận đơn">
                            <PackageCheck size={16} />
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Giao hàng">
                            <Truck size={16} />
                          </button>
                        )}
                        <Link href={`/dashboard/orders/${order.id}`} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Chi tiết">
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Hiển thị theo giới hạn</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">«</button>
            <button onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded hover:bg-slate-50">»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
