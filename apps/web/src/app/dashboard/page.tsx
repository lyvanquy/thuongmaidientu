'use client';
import { useQuery } from '@tanstack/react-query';
import { api, companyApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { DollarSign, Package, ShoppingCart, Target, ArrowUpRight, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  
  // Real stats from our new endpoint
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => companyApi.getDashboardStats().then(r => r.data),
    enabled: !!user?.companyId,
  });

  const cards = [
    { title: 'Tổng doanh thu', value: `${stats?.revenue?.toLocaleString('vi-VN') || 0} đ`, icon: DollarSign, trend: '+12%', color: 'from-blue-500 to-cyan-400' },
    { title: 'Tổng Đơn hàng', value: stats?.totalOrders || 0, icon: ShoppingCart, trend: '+5%', color: 'from-emerald-500 to-teal-400' },
    { title: 'Cơ hội RFQ Mới', value: stats?.activeRfqs || 0, icon: Target, trend: '+18%', color: 'from-purple-500 to-indigo-400' },
    { title: 'Sản phẩm đang bán', value: stats?.productsCount || 0, icon: Package, trend: '+2%', color: 'from-orange-500 to-amber-400' },
  ];

  // Mock revenue chart data
  const revenueData = [
    { month: 'T10', value: 45 },
    { month: 'T11', value: 52 },
    { month: 'T12', value: 38 },
    { month: 'T01', value: 65 },
    { month: 'T02', value: 48 },
    { month: 'T03', value: 72 }, // Current
  ];
  const maxRev = Math.max(...revenueData.map(d => d.value));

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan Giao dịch B2B/B2C</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Cập nhật lần cuối: <span className="font-semibold text-primary-700">Ngay lúc này</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => (
          <div key={i} className="card p-6 border-0 shadow-sm relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 group-hover:scale-[2] transition-transform duration-700 ease-out`} />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} text-white shadow-md flex-shrink-0`}>
                <stat.icon size={24} />
              </div>
            </div>

            <div className="mt-4 flex items-center text-sm relative z-10">
              <span className={`font-semibold flex items-center ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowUpRight size={16} className="mr-1 rotate-90" />}
                {stat.trend}
              </span>
              <span className="text-slate-500 ml-2">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Biểu đồ Doanh thu (CSS-based Bar Chart) */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Phân tích Doanh thu</h3>
              <p className="text-sm text-slate-500">6 tháng gần nhất (Đơn vị: Triệu VNĐ)</p>
            </div>
            <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <TrendingUp size={14} /> Tăng trưởng ổn định
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 sm:gap-6 pt-4 border-b border-slate-100">
            {revenueData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div 
                  className="w-full bg-primary-100 rounded-t-lg group-hover:bg-primary-200 transition-colors relative"
                  style={{ height: `${(d.value / maxRev) * 100}%` }}
                >
                  <div className="absolute inset-x-0 bottom-0 bg-primary-500 rounded-t-lg transition-all duration-1000 ease-out" 
                       style={{ height: `${(d.value / maxRev) * 100}%` }} />
                       
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded shadow-lg whitespace-nowrap transition-opacity point-events-none">
                    {d.value} Triệu
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-2">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cảnh báo / Nhắc nhở */}
        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 mb-6">Trạng thái Khẩn cấp</h3>
          <div className="flex-1 flex flex-col gap-4">
            
            {stats?.newOrders > 0 ? (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-orange-800">Đơn hàng mới ({stats.newOrders})</h4>
                  <p className="text-xs text-orange-600 mt-1 mb-2">Bạn có đơn B2C/B2B đang chờ xác nhận.</p>
                  <Link href="/dashboard/orders" className="text-xs font-bold text-orange-700 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-shadow">
                    Xử lý ngay →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
                <CheckCircleIcon />
                <p className="text-sm font-semibold text-slate-600">Tuyệt vời! Không có đơn nào bị tồn.</p>
              </div>
            )}

            {stats?.activeRfqs > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 text-indigo-500/10 -m-4">
                  <Target size={64} />
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 z-10">
                  <Target size={20} />
                </div>
                <div className="z-10">
                  <h4 className="font-bold text-indigo-800">Thị trường RFQ: Sôi động</h4>
                  <p className="text-xs text-indigo-600 mt-1 mb-2">Khách hàng đang đăng {stats.activeRfqs} yêu cầu báo giá.</p>
                  <Link href="/dashboard/quotations" className="text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-shadow inline-block">
                    Tìm kiếm Cơ hội →
                  </Link>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}

const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
