'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import Link from 'next/link';
import { ShieldCheck, MapPin, Users, Package, Search, Building2, Filter, Star } from 'lucide-react';

const businessTypes = ['Tất cả', 'Manufacturer', 'Trader', 'Agent'];
const provinces = ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Hải Phòng'];

function CompanyCard({ company }: { company: any }) {
  return (
    <Link href={`/companies/${company.id}`} className="card p-5 flex gap-4 hover:border-primary-200 transition-all group">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
        {company.logo
          ? <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-1" />
          : <Building2 size={28} className="text-slate-300" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors truncate">{company.name}</h3>
              {company.verificationStatus === 'VERIFIED' && (
                <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />
              )}
              {company.isFeatured && (
                <Star size={14} className="text-amber-400 fill-current flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-primary-600 font-medium">{company.businessType || 'Doanh nghiệp'}</p>
          </div>
          <span className={`flex-shrink-0 badge text-[10px] ${
            company.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
            company.verificationStatus === 'FEATURED' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {company.verificationStatus}
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{company.description || 'Chưa có mô tả.'}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
          {company.province && (
            <span className="flex items-center gap-1"><MapPin size={11} /> {company.province}</span>
          )}
          {company.employeeCount && (
            <span className="flex items-center gap-1"><Users size={11} /> {company.employeeCount} nhân viên</span>
          )}
          {company._count?.products !== undefined && (
            <span className="flex items-center gap-1"><Package size={11} /> {company._count.products} sản phẩm</span>
          )}
          {company.yearFounded && (
            <span>Thành lập {company.yearFounded}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('Tất cả');
  const [province, setProvince] = useState('Tất cả');

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, businessType, province }],
    queryFn: () => companyApi.list({
      search: search || undefined,
      businessType: businessType === 'Tất cả' ? undefined : businessType,
      province: province === 'Tất cả' ? undefined : province,
      limit: 20,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const companies = data?.items || [];

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-main">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-primary-700" size={26} />
            Danh Mục Doanh Nghiệp &amp; Nhà Cung Cấp
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tìm nhà cung cấp uy tín, đáng tin cậy, đã được xác minh</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Filters sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Filter size={16} className="text-slate-500" />
                <h2 className="font-bold text-slate-800">Bộ lọc</h2>
              </div>

              <div className="space-y-5">
                {/* Search */}
                <div>
                  <label className="filter-label">Tên doanh nghiệp</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên..."
                      className="input pl-8 !py-2 text-sm"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label className="filter-label">Loại hình</label>
                  <div className="space-y-1">
                    {businessTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => setBusinessType(t)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          businessType === t
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="filter-label">Tỉnh / Thành phố</label>
                  <select
                    className="input !py-2 text-sm"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                  >
                    {provinces.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-4 text-sm text-slate-500">
              <span>Tìm thấy <strong className="text-slate-900">{data?.total || 0}</strong> doanh nghiệp</span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 flex gap-4">
                    <div className="skeleton w-16 h-16 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-2/3" />
                      <div className="skeleton h-3 w-1/4" />
                      <div className="skeleton h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="card p-16 text-center text-slate-400">
                <Building2 size={56} className="mx-auto mb-4 text-slate-200" />
                <p className="text-lg font-semibold text-slate-500">Không tìm thấy doanh nghiệp nào</p>
                <p className="text-sm mt-1">Hãy thử thay đổi bộ lọc tìm kiếm</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map((c: any) => <CompanyCard key={c.id} company={c} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
