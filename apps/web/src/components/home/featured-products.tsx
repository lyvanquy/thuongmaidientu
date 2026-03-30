'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { Heart, ShieldCheck, MapPin } from 'lucide-react';

function ProductCard({ product }: { product: any }) {
  const img = product.images?.[0]?.url;
  return (
    <Link href={`/products/${product.id}`} className="product-card block">
      <div className="relative overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="product-img" />
        ) : (
          <div className="product-img bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-5xl">📦</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 badge ${product.type === 'B2B' ? 'badge-b2b' : 'badge-b2c'}`}>
          {product.type}
        </span>
        <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-all">
          <Heart size={15} className="text-slate-400 hover:text-red-500" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-1">{product.category?.name}</p>
        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-primary-700">{product.name}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary-700">{product.price?.toLocaleString('vi-VN')}đ</p>
            {product.moq && <p className="text-xs text-slate-400">MOQ: {product.moq}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 min-w-0">
            {product.company?.verificationStatus === 'VERIFIED' && (
              <ShieldCheck size={12} className="text-green-500 flex-shrink-0" />
            )}
            <span className="text-xs text-slate-600 truncate">{product.company?.name}</span>
          </div>
          {product.company?.province && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <MapPin size={11} className="text-slate-400" />
              <span className="text-xs text-slate-400">{product.company.province}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productApi.list({ featured: true, limit: 8 }).then(r => r.data),
  });

  return (
    <section className="section bg-slate-50">
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sản Phẩm Nổi Bật</h2>
            <p className="text-slate-500 text-sm mt-1">Được tin dùng bởi hàng nghìn doanh nghiệp</p>
          </div>
          <Link href="/products" className="text-sm text-primary-700 font-semibold hover:underline">Xem tất cả →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : (data?.items || []).map((p: any) => <ProductCard key={p.id} product={p} />)
          }
          {!isLoading && !data?.items?.length && (
            <div className="col-span-4 text-center py-16 text-slate-400">
              <p className="text-5xl mb-3">📦</p>
              <p>Chưa có sản phẩm nổi bật. Hãy <Link href="/auth/register?role=SUPPLIER" className="text-primary-700 underline">đăng ký Supplier</Link> và thêm sản phẩm!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
