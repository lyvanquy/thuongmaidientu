'use client';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '@/lib/api';
import { FileText, Loader2, FileSignature, CheckCircle, Clock, Search, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardContractsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: () => contractApi.myList().then(r => r.data),
    enabled: !!user,
  });

  const contracts = data?.items || [];
  
  const filteredContracts = contracts.filter((c: any) => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || 
    c.contractNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: contracts.length,
    signed: contracts.filter((c: any) => c.status === 'SIGNED').length,
    pending: contracts.filter((c: any) => c.status === 'PENDING_SIGNATURE').length,
    draft: contracts.filter((c: any) => c.status === 'DRAFT').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={28} className="text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Hợp đồng B2B</h2>
          <p className="text-sm text-slate-500">Tất cả hợp đồng điện tử đã tạo và yêu cầu ký</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng cộng</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 border-l-4 border-l-indigo-400">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileSignature size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đang soạn thảo</p>
            <p className="text-2xl font-black text-indigo-700">{stats.draft}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 border-l-4 border-l-amber-400">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Chờ hai bên ký</p>
            <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 border-l-4 border-l-green-400">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đã chốt (Signed)</p>
            <p className="text-2xl font-black text-green-700">{stats.signed}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm theo Mã HĐ hoặc Tiêu đề..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
          ) : filteredContracts.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <FileSignature size={48} className="mx-auto mb-3 text-slate-200" />
              <p>Không tìm thấy hợp đồng nào phù hợp.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider">Mã Hợp đồng</th>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider">Tiêu đề - Đối tác</th>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider">Giá trị</th>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider">Cập nhật lúc</th>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider text-center">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold uppercase text-[10px] tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((c: any) => {
                  const isSupplier = user?.companyId === c.supplierId;
                  const partner = isSupplier ? c.buyer : c.supplier;
                  
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">
                        {c.contractNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-primary-700 transition">
                          <Link href={`/contracts/${c.id}`}>{c.title}</Link>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          {isSupplier ? 'Khách mua:' : 'Nhà cung cấp:'} <span className="font-semibold text-slate-700">{partner?.name}</span>
                        </p>
                      </td>
                      <td className="px-5 py-4 font-black text-primary-700">
                        {c.value?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(c.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`badge ${
                          c.status === 'SIGNED' ? 'bg-green-100 text-green-700 border border-green-200' :
                          c.status === 'COMPLETED' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                          c.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border border-red-200' :
                          c.status === 'PENDING_SIGNATURE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}>
                          {c.status === 'SIGNED' && <CheckCircle size={10} className="inline mr-1" />}
                          {c.status === 'PENDING_SIGNATURE' && <Clock size={10} className="inline mr-1" />}
                          {c.status === 'CANCELLED' && <XCircle size={10} className="inline mr-1" />}
                          {c.status === 'DRAFT' && <FileSignature size={10} className="inline mr-1.5" />}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link 
                          href={`/contracts/${c.id}`} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all shadow-sm group-hover:shadow"
                        >
                          Chi tiết <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
