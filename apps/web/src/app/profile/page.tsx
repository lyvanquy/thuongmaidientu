'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  User, Mail, Phone, ShieldCheck, Package, FileText,
  ShoppingBag, Edit3, Save, Loader2, Building2, MessageCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore() as any;
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/profile');
      return;
    }
    setFormData({ name: user.name || '', phone: user.phone || '' });
  }, [user, router]);

  // Load my orders
  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
    enabled: !!user,
  });

  // Load my contracts
  const { data: contractsData } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: () => api.get('/contracts/my').then(r => r.data),
    enabled: !!user,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/me', formData);
      if (setUser) setUser(res.data);
      setEditing(false);
    } catch (e) {
      alert('Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-primary-600" size={32} />
    </div>
  );

  const orders = ordersData?.items || [];
  const contracts = contractsData?.items || [];

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-cyan-100 text-cyan-700',
    DELIVERED: 'bg-teal-100 text-teal-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    SIGNED: 'bg-green-100 text-green-700',
    APPROVED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Profile Card */}
          <div className="lg:col-span-1 space-y-6">

            {/* Avatar & Info */}
            <div className="card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg shadow-primary-200">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
              <span className={`mt-2 inline-block badge text-xs ${
                user.role === 'SUPPLIER' ? 'bg-blue-100 text-blue-700' :
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {user.role}
              </span>

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 w-full btn-ghost border border-slate-200 text-sm"
                >
                  <Edit3 size={15} /> Chỉnh sửa hồ sơ
                </button>
              ) : (
                <div className="mt-4 space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên</label>
                    <input
                      className="input text-sm"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại</label>
                    <input
                      className="input text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditing(false)} className="flex-1 btn-ghost border border-slate-200 text-sm !py-2">Hủy</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm !py-2">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Lưu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3 px-1">Truy cập nhanh</h3>
              <div className="space-y-1">
                <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm text-slate-700 transition-colors">
                  <MessageCircle size={16} className="text-slate-400" /> Đàm phán B2B
                </Link>
                <Link href="/contracts" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm text-slate-700 transition-colors">
                  <FileText size={16} className="text-slate-400" /> Hợp đồng của tôi
                </Link>
                <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm text-slate-700 transition-colors">
                  <Package size={16} className="text-slate-400" /> Khám phá sản phẩm
                </Link>
                {user.role === 'SUPPLIER' && (
                  <>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm text-slate-700 transition-colors">
                      <Building2 size={16} className="text-slate-400" /> Supplier Dashboard
                    </Link>
                    <Link href="/profile/verification" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm text-slate-700 transition-colors">
                      <ShieldCheck size={16} className="text-slate-400" /> Xác thực Doanh nghiệp
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <ShoppingBag size={20} className="text-blue-500" />, label: 'Đơn hàng', value: orders.length, color: 'bg-blue-50' },
                { icon: <FileText size={20} className="text-green-500" />, label: 'Hợp đồng', value: contracts.length, color: 'bg-green-50' },
                { icon: <ShieldCheck size={20} className="text-purple-500" />, label: 'Tài khoản', value: 'Hoạt động', color: 'bg-purple-50' },
              ].map((stat, i) => (
                <div key={i} className="card p-4 text-center">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                    {stat.icon}
                  </div>
                  <p className="text-xl font-black text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Orders History */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary-600" /> Lịch sử Đơn hàng
                </h3>
                <Link href="/orders" className="text-xs text-primary-600 font-semibold hover:underline">Xem tất cả →</Link>
              </div>
              {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShoppingBag size={36} className="mx-auto mb-2 text-slate-200" />
                  <p>Bạn chưa có đơn hàng nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">#{order.orderNumber?.substring(0, 10)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary-700">{order.total?.toLocaleString()}đ</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contracts */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" /> Hợp Đồng Gần Đây
                </h3>
                <Link href="/contracts" className="text-xs text-primary-600 font-semibold hover:underline">Xem tất cả →</Link>
              </div>
              {contracts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileText size={36} className="mx-auto mb-2 text-slate-200" />
                  <p>Bạn chưa có hợp đồng nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {contracts.slice(0, 4).map((c: any) => (
                    <Link key={c.id} href={`/contracts/${c.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(c.updatedAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[c.status] || 'bg-slate-100 text-slate-600'}`}>
                        {c.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
