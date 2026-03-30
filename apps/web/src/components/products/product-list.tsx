'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { ShieldCheck, MapPin, Heart, PackageSearch } from 'lucide-react';

export function ProductList() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, type, sort, page }],
    queryFn: () => productApi.list({ search, category, type, sort, page, limit: 12 }).then(r => r.data),
    staleTime: 1000 * 60,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card p-0 overflow-hidden text-left">
          <div className="skeleton h-48 w-full" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (isError) return <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-2xl">Đã xảy ra lỗi khi tải sản phẩm. Vui lòng thử lại.</div>;

  const items = data?.items || [];
  const totalTags = [search, category && `Ngành: ${category}`, type].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Active filters summary */}
      <div className="flex items-center justify-between text-sm text-slate-500 border-b border-slate-200 pb-4">
        <div>
          Tìm thấy <span className="font-bold text-slate-900">{data?.total || 0}</span> sản phẩm 
          {totalTags.length > 0 && <span> cho: <strong className="text-primary-700">{totalTags.join(' • ')}</strong></span>}
        </div>
        <div>
          Trang {data?.page} / {Math.ceil((data?.total || 0) / (data?.limit || 12)) || 1}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 card border-dashed bg-transparent text-slate-400">
          <PackageSearch size={64} className="mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy sản phẩm</h3>
          <p>Thử loại bỏ các bộ lọc hoặc thay đổi từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((product: any) => (
            <Link key={product.id} href={`/products/${product.id}`} className="product-card block group">
              <div className="relative overflow-hidden bg-slate-100">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} className="product-img aspect-square object-cover" />
                ) : (
                  <div className="product-img aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-5xl opacity-50">📦</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className={`badge ${product.type === 'B2B' ? 'badge-b2b' : 'badge-b2c'} shadow-sm`}>{product.type}</span>
                  {product.moq && <span className="badge bg-slate-800/80 backdrop-blur-sm text-white text-[10px] shadow-sm">MOQ: {product.moq}</span>}
                </div>

                <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex flex-col items-center justify-center hover:bg-white hover:scale-110 shadow-sm transition-all text-slate-400 hover:text-red-500 z-10">
                  <Heart size={15} className="mt-0.5" />
                </button>
              </div>

              <div className="p-4 bg-white">
                <p className="text-xs text-slate-400 mb-1">{product.category?.name}</p>
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-primary-700 leading-snug h-10">{product.name}</h3>
                
                <div className="mb-3">
                  <p className="text-lg font-bold text-primary-700">
                    {product.price ? `${product.price.toLocaleString('vi-VN')} đ` : 'Liên hệ báo giá'}
                  </p>
                  {product.priceMax && product.priceMax > product.price && (
                    <p className="text-xs text-slate-400">~ {product.priceMax.toLocaleString('vi-VN')} đ</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {product.company?.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck size={14} className="text-green-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-slate-600 truncate font-medium">{product.company?.name}</span>
                  </div>
                  {product.company?.province && (
                    <div className="flex items-center gap-1 flex-shrink-0 text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">
                      <MapPin size={10} />
                      <span className="truncate max-w-[60px]">{product.company.province}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Basic Pagination (Can be extracted to a separate component later) */}
      {data?.total > (data?.limit || 12) && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: Math.ceil(data.total / (data.limit || 12)) }).map((_, idx) => {
            const p = idx + 1;
            const pm = new URLSearchParams(searchParams.toString());
            pm.set('page', p.toString());
            return (
              <Link 
                key={p} 
                href={`/products?${pm.toString()}`}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                  page === p ? 'bg-primary-700 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary-700'
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
