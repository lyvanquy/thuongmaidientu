'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { companyApi, rfqApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  ShieldCheck, MapPin, Users, Package, Globe, Phone,
  Mail, Calendar, Building2, MessageCircle, Star, ArrowLeft,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { RfqModal } from '@/components/rfq/rfq-modal';

function ProductMiniCard({ product }: { product: any }) {
  const img = product.images?.[0]?.url;
  return (
    <Link href={`/products/${product.id}`} className="card overflow-hidden group hover:border-primary-200 transition-all">
      <div className="aspect-square bg-slate-100 overflow-hidden">
        {img
          ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        }
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-primary-700 font-bold text-sm mt-1">
          {product.price?.toLocaleString('vi-VN')}đ
        </p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.type === 'B2B' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {product.type}
        </span>
      </div>
    </Link>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [rfqOpen, setRfqOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyApi.get(id).then(r => r.data),
    enabled: !!id,
  });

  const handleContact = () => {
    if (!user) { router.push('/auth/login'); return; }
    // Create an RFQ/chat directly
    setRfqOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="h-48 skeleton w-full" />
        <div className="container-main -mt-12 relative z-10">
          <div className="w-24 h-24 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!company) return (
    <div className="container-main py-20 text-center text-slate-400">
      <Building2 size={64} className="mx-auto mb-4 text-slate-200" />
      <p className="text-xl font-bold text-slate-500">Không tìm thấy doanh nghiệp</p>
    </div>
  );

  const products = company.products || [];
  const industries = company.industries || [];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Banner */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600">
        {company.banner && (
          <img src={company.banner} alt="banner" className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Back button */}
        <Link href="/companies" className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-white/30 transition-colors">
          <ArrowLeft size={14} /> Danh sách
        </Link>
      </div>

      <div className="container-main">
        {/* Company Header */}
        <div className="relative -mt-12 mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-white flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center -mt-2">
                {company.logo
                  ? <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" />
                  : <Building2 size={36} className="text-slate-300" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-slate-900">{company.name}</h1>
                  {company.verificationStatus === 'VERIFIED' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={12} /> Đã xác minh
                    </span>
                  )}
                  {company.isFeatured && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Star size={12} className="fill-current" /> Nổi bật
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary-600 font-semibold mb-2">{company.businessType || 'Doanh nghiệp'}</p>

                {/* Meta tags */}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                  {company.province && <span className="flex items-center gap-1"><MapPin size={12} />{company.province}</span>}
                  {company.employeeCount && <span className="flex items-center gap-1"><Users size={12} />{company.employeeCount} nhân viên</span>}
                  {company.yearFounded && <span className="flex items-center gap-1"><Calendar size={12} />Thành lập {company.yearFounded}</span>}
                  {company._count?.products !== undefined && <span className="flex items-center gap-1"><Package size={12} />{company._count.products} sản phẩm</span>}
                </div>

                {/* Industry tags */}
                {industries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {industries.map((ind: any) => (
                      <span key={ind.id} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {ind.category?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-auto">
                <button onClick={handleContact} className="btn-primary w-full md:w-auto">
                  <MessageCircle size={16} /> Liên hệ / Báo giá
                </button>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-slate-200 w-full md:w-auto text-center text-sm">
                    <ExternalLink size={14} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              {[
                { label: 'Sản phẩm', value: company._count?.products || 0, icon: <Package size={16} className="text-primary-500" /> },
                { label: 'Năm hoạt động', value: company.yearFounded ? (new Date().getFullYear() - company.yearFounded) + ' năm' : '—', icon: <Calendar size={16} className="text-amber-500" /> },
                { label: 'Nhân sự', value: company.employeeCount || '—', icon: <Users size={16} className="text-green-500" /> },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-lg font-black text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit shadow-sm">
          {(['products', 'about'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
              }`}
            >
              {tab === 'products' ? `📦 Sản phẩm (${products.length})` : '🏢 Giới thiệu'}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          products.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <Package size={48} className="mx-auto mb-3 text-slate-200" />
              <p>Doanh nghiệp này chưa có sản phẩm nào được duyệt.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-8">
              {products.map((p: any) => <ProductMiniCard key={p.id} product={p} />)}
            </div>
          )
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            {/* Description */}
            <div className="lg:col-span-2 card p-6">
              <h2 className="font-bold text-slate-900 text-lg mb-4">Giới thiệu doanh nghiệp</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {company.description || 'Chưa có thông tin mô tả.'}
              </p>
            </div>

            {/* Contact */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-lg mb-2">Thông tin liên hệ</h2>
              {[
                { icon: <Phone size={16} className="text-primary-500" />, label: 'Điện thoại', value: company.phone },
                { icon: <Mail size={16} className="text-primary-500" />, label: 'Email', value: company.email },
                { icon: <Globe size={16} className="text-primary-500" />, label: 'Website', value: company.website, link: true },
                { icon: <MapPin size={16} className="text-primary-500" />, label: 'Địa chỉ', value: company.address || company.province },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{row.label}</p>
                    {row.link
                      ? <a href={row.value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">{row.value} <ExternalLink size={10} /></a>
                      : <p className="text-sm text-slate-800 font-medium">{row.value}</p>
                    }
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-100">
                <button onClick={handleContact} className="w-full btn-primary !py-2">
                  <MessageCircle size={15} /> Gửi Yêu Cầu Báo Giá
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RFQ Modal — mock product object for company-level RFQ */}
      <RfqModal
        isOpen={rfqOpen}
        onClose={() => setRfqOpen(false)}
        product={{
          name: company.name,
          price: 0,
          moq: 1,
          images: company.logo ? [{ url: company.logo }] : [],
          companyId: company.id,
          company: { name: company.name, ownerId: company.users?.[0]?.id },
        }}
      />
    </div>
  );
}
