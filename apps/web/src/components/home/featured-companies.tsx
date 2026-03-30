'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { ShieldCheck, Star, Package } from 'lucide-react';

function CompanyCard({ company }: { company: any }) {
  return (
    <Link href={`/companies/${company.id}`} className="card card-dark p-5 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 overflow-hidden border border-slate-200">
        {company.logo
          ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
          : <span className="text-3xl">🏢</span>
        }
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors line-clamp-1">{company.name}</h3>
        {company.verificationStatus === 'VERIFIED' && <ShieldCheck size={14} className="text-green-500 flex-shrink-0" />}
        {company.isFeatured && <Star size={14} className="text-yellow-500 flex-shrink-0 fill-yellow-500" />}
      </div>
      <p className="text-xs text-slate-500 mb-3">{company.province || 'Việt Nam'}</p>
      <div className="flex items-center gap-1 text-xs text-slate-600">
        <Package size={12} />
        <span>{company._count?.products || 0} sản phẩm</span>
      </div>
      <div className="mt-3 w-full">
        <span className={`badge w-full justify-center ${
          company.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'
        }`}>
          {company.verificationStatus === 'VERIFIED' ? '✓ Đã xác thực' : 'Chờ xác thực'}
        </span>
      </div>
    </Link>
  );
}

export function FeaturedCompanies() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-companies'],
    queryFn: () => companyApi.list({ verified: true, limit: 8 }).then(r => r.data),
  });

  return (
    <section className="section bg-slate-50">
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Doanh Nghiệp Uy Tín</h2>
            <p className="text-slate-500 text-sm mt-1">Đã được xác thực và kiểm duyệt bởi TradeMart</p>
          </div>
          <Link href="/companies" className="text-sm text-primary-700 font-semibold hover:underline">Xem tất cả →</Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="card p-5 flex flex-col items-center gap-3">
                <div className="skeleton w-20 h-20 rounded-2xl" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(data?.items || []).map((c: any) => <CompanyCard key={c.id} company={c} />)}
            {!data?.items?.length && (
              <div className="col-span-4 text-center py-12 text-slate-400">
                <p className="text-5xl mb-3">🏢</p>
                <p>Chưa có doanh nghiệp. <Link href="/auth/register?role=SUPPLIER" className="text-primary-700 underline">Đăng ký ngay!</Link></p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
