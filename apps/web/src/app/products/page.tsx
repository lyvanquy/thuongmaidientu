import { Suspense } from 'react';
import { ProductList } from '@/components/products/product-list';
import { ProductFilters } from '@/components/products/product-filters';
import { Filter, Search } from 'lucide-react';

export const metadata = {
  title: 'Tìm kiếm Sản phẩm | TradeMart',
  description: 'Tìm kiếm và lọc hàng nghìn sản phẩm, trang thiết bị, vật liệu từ các nhà cung cấp uy tín.',
};

export default function ProductsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-main">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="text-primary-700" size={24} />
            Tìm kiếm Sản phẩm
          </h1>
          <p className="text-slate-500 text-sm mt-1">Khám phá hàng nghìn sản phẩm B2B/B2C chất lượng cao</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <Filter size={18} className="text-slate-600" />
                <h2 className="font-bold text-slate-900">Bộ lọc tìm kiếm</h2>
              </div>
              <Suspense fallback={<div className="animate-pulse h-40 bg-slate-100 rounded-lg"></div>}>
                <ProductFilters />
              </Suspense>
            </div>
          </aside>

          {/* Main Product List */}
          <main className="flex-1">
            <Suspense fallback={
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card p-4 space-y-3">
                    <div className="skeleton h-40 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                ))}
              </div>
            }>
              <ProductList />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
