'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Users, Building2, Package, ShoppingBag, FileText, ClipboardList,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Loader2, Shield
} from 'lucide-react';
import { AdminContractDialog } from '@/components/contract/admin-contract-dialog';
import { KybDialog } from '@/components/admin/kyb-dialog';
import Link from 'next/link';

type AdminTab = 'overview' | 'companies' | 'products' | 'users' | 'contracts';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showKybDialog, setShowKybDialog] = useState(false);

  if (user && user.role !== 'ADMIN') {
    router.replace('/');
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data),
    enabled: !!user,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => adminApi.companies({ limit: 20 }).then(r => r.data),
    enabled: tab === 'companies' && !!user,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminApi.products({ status: 'PENDING', limit: 20 }).then(r => r.data),
    enabled: tab === 'products' && !!user,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users({ limit: 20 }).then(r => r.data),
    enabled: tab === 'users' && !!user,
  });

  const { data: contractsData } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: () => adminApi.contracts({ limit: 20 }).then(r => r.data),
    enabled: tab === 'contracts' && !!user,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string, notes?: string }) => adminApi.verifyCompany(id, status, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const authContractMutation = useMutation({
    mutationFn: ({ id, action, terms }: { id: string, action: 'approve' | 'reject', terms?: string }) => 
      action === 'approve' ? adminApi.approveContract(id, { terms }) : adminApi.rejectContract(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contracts'] }),
  });

  const handleContractDecision = async (action: 'approve' | 'reject', terms?: string) => {
    if (!selectedContractId) return;
    await authContractMutation.mutateAsync({ id: selectedContractId, action, terms });
  };

  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Tổng quan', icon: TrendingUp },
    { key: 'companies', label: 'Doanh nghiệp', icon: Building2 },
    { key: 'products', label: 'Duyệt sản phẩm', icon: Package },
    { key: 'users', label: 'Người dùng', icon: Users },
    { key: 'contracts', label: 'Hợp đồng', icon: FileText },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-6">
        <div className="container-main flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black">Admin Control Panel</h1>
            <p className="text-slate-400 text-xs mt-0.5">TradeMart — Quản trị hệ thống</p>
          </div>
        </div>
      </div>

      <div className="container-main py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-52 flex-shrink-0">
            <div className="card p-2 sticky top-24">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                    tab === key
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Thống kê tổng quan</h2>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-600" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[
                        { label: 'Người dùng', value: stats?.users, icon: <Users size={22} />, color: 'bg-blue-500', light: 'bg-blue-50' },
                        { label: 'Doanh nghiệp', value: stats?.companies, icon: <Building2 size={22} />, color: 'bg-purple-500', light: 'bg-purple-50' },
                        { label: 'Sản phẩm', value: stats?.products, icon: <Package size={22} />, color: 'bg-orange-500', light: 'bg-orange-50' },
                        { label: 'Đơn hàng', value: stats?.orders, icon: <ShoppingBag size={22} />, color: 'bg-green-500', light: 'bg-green-50' },
                        { label: 'RFQ', value: stats?.rfqs, icon: <ClipboardList size={22} />, color: 'bg-cyan-500', light: 'bg-cyan-50' },
                        { label: 'Hợp đồng', value: stats?.contracts, icon: <FileText size={22} />, color: 'bg-indigo-500', light: 'bg-indigo-50' },
                        { label: 'Chờ xác minh', value: stats?.pendingCompanies, icon: <AlertTriangle size={22} />, color: 'bg-yellow-500', light: 'bg-yellow-50' },
                        { label: 'SP chờ duyệt', value: stats?.pendingProducts, icon: <AlertTriangle size={22} />, color: 'bg-red-500', light: 'bg-red-50' },
                      ].map(s => (
                        <div key={s.label} className={`card p-4 flex items-center gap-4`}>
                          <div className={`w-12 h-12 ${s.light} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className={`${s.color} text-transparent bg-clip-text`}>{s.icon}</span>
                          </div>
                          <div>
                            <p className="text-2xl font-black text-slate-800">{s.value ?? '—'}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick actions */}
                    <div className="card p-5">
                      <h3 className="font-bold text-slate-800 mb-4">Hành động nhanh</h3>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => setTab('products')} className="btn-primary !py-2 !px-4 text-sm">
                          <Package size={15} /> Duyệt sản phẩm ({stats?.pendingProducts || 0})
                        </button>
                        <button onClick={() => setTab('companies')} className="btn-outline !py-2 !px-4 text-sm">
                          <Building2 size={15} /> Xác minh doanh nghiệp ({stats?.pendingCompanies || 0})
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* COMPANIES */}
            {tab === 'companies' && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Quản lý Doanh Nghiệp</h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Doanh nghiệp</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Loại hình</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Trạng thái</th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(companiesData?.items || []).map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.province}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{c.businessType || '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`badge text-xs ${
                              c.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                              c.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {c.verificationStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {c.verificationStatus === 'PENDING' && (
                              <button
                                onClick={() => {
                                  setSelectedCompanyId(c.id);
                                  setShowKybDialog(true);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition shadow-sm border border-primary-200"
                              >
                                Duyệt hồ sơ
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(companiesData?.items || []).length === 0 && (
                    <p className="text-center text-slate-400 py-10">Không có dữ liệu.</p>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {tab === 'products' && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Duyệt Sản Phẩm Chờ</h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Sản phẩm</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Loại</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Giá</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Nhà cung cấp</th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(productsData?.items || []).map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800 max-w-xs truncate">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.category?.name}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`badge text-xs ${p.type === 'B2B' ? 'badge-b2b' : 'badge-b2c'}`}>{p.type}</span>
                          </td>
                          <td className="px-5 py-3 font-bold text-primary-700">{p.price?.toLocaleString()}đ</td>
                          <td className="px-5 py-3 text-slate-600">{p.company?.name}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => approveMutation.mutate(p.id)}
                                disabled={approveMutation.isPending}
                                className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(p.id)}
                                disabled={rejectMutation.isPending}
                                className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(productsData?.items || []).length === 0 && (
                    <p className="text-center text-slate-400 py-10">Không có sản phẩm nào đang chờ duyệt. 🎉</p>
                  )}
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách Người dùng</h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Người dùng</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Vai trò</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Doanh nghiệp</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Ngày đăng ký</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(usersData?.items || []).map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`badge text-xs ${
                              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'SUPPLIER' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{u.company?.name || '—'}</td>
                          <td className="px-5 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(usersData?.items || []).length === 0 && (
                    <p className="text-center text-slate-400 py-10">Không có dữ liệu.</p>
                  )}
                </div>
              </div>
            )}

            {/* CONTRACTS */}
            {tab === 'contracts' && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Quản lý Hợp Đồng</h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Mã HĐ</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Tiêu đề</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Bên mua</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Bên bán</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Giá trị</th>
                        <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Trạng thái</th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Duyệt HĐ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(contractsData?.items || []).map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono text-xs text-slate-500">
                            <Link href={`/contracts/${c.id}`} className="hover:text-primary-600 underline">#{c.contractNumber?.substring(0, 8)}</Link>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800 max-w-xs truncate">{c.title}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{c.buyer?.name}</td>
                          <td className="px-5 py-3 text-slate-600">{c.supplier?.name}</td>
                          <td className="px-5 py-3 font-bold text-primary-700">{c.value?.toLocaleString()} {c.currency}</td>
                          <td className="px-5 py-3">
                            <span className={`badge text-xs whitespace-nowrap ${
                              c.status === 'SIGNED' || c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              c.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                              c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              c.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {c.status === 'PENDING' ? (
                              <button
                                onClick={() => {
                                  setSelectedContractId(c.id);
                                  setShowContractDialog(true);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition shadow-sm border border-primary-200"
                              >
                                Xem & Duyệt
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedContractId(c.id);
                                  setShowContractDialog(true);
                                }}
                                className="text-xs text-slate-500 hover:text-primary-600 underline font-medium"
                              >
                                Xem văn bản
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(contractsData?.items || []).length === 0 && (
                    <p className="text-center text-slate-400 py-10">Chưa có hợp đồng nào.</p>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      <AdminContractDialog
        isOpen={showContractDialog}
        onClose={() => setShowContractDialog(false)}
        contractId={selectedContractId}
        onDecide={handleContractDecision}
      />
      <KybDialog
        isOpen={showKybDialog}
        onClose={() => setShowKybDialog(false)}
        companyId={selectedCompanyId}
        onDecide={(status: string, notes: string) => verifyMutation.mutate({ id: selectedCompanyId as string, status, notes })}
      />
    </div>
  );
}
