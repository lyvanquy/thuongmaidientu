'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentType = searchParams.get('type') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.tree().then(r => r.data),
  });

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <label className="filter-label">Ngành hàng</label>
        <div className="space-y-2">
          <label className="filter-option hover:text-primary-700">
            <input type="radio" name="category" checked={!currentCategory}
              onChange={() => updateFilter('category', '')} className="text-primary-600 focus:ring-primary-500" />
            Tất cả ngành hàng
          </label>
          {categories?.map((cat: any) => (
            <label key={cat.id} className="filter-option hover:text-primary-700">
              <input type="radio" name="category" value={cat.slug} checked={currentCategory === cat.slug}
                onChange={() => updateFilter('category', cat.slug)} className="text-primary-600 focus:ring-primary-500" />
              {cat.icon} {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div>
        <label className="filter-label">Loại giao dịch</label>
        <div className="space-y-2">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'B2B', label: 'Bán sỉ (B2B)' },
            { value: 'B2C', label: 'Bán lẻ (B2C)' },
          ].map(t => (
            <label key={t.value} className="filter-option hover:text-primary-700">
              <input type="radio" name="type" value={t.value} checked={currentType === t.value}
                onChange={() => updateFilter('type', t.value)} className="text-primary-600 focus:ring-primary-500" />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="filter-label">Sắp xếp</label>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="input !py-2 text-sm text-slate-700"
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="popular">Phổ biến</option>
        </select>
      </div>

      <button
        onClick={() => router.push('/products')}
        className="w-full btn-ghost border border-slate-200 text-sm mt-4 hover:bg-slate-50"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
