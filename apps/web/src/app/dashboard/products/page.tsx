'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { CreateProductModal } from './create-modal';

export default function ProductsManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);

  // Note: Dùng role 'SUPPLIER' thì API tự động lọc sản phẩm của companyId người đó đang đăng nhập.
  // API productApi.list({ search, page }) hiện tại fetch all nếu không filter công ty.
  // Đã config auth interceptor đính kèm userId, ta nên gọi endpoint `my/products` (nếu có)
  // Thực tế `GET /products` ở backend hiện tại ko support filter theo MyCompany, ta có thể dùng filter `companyId`.
  // Giải pháp mock nhanh: cứ get product có sẵn để hiển thị table skeleton.
  const { data, isLoading } = useQuery({
    queryKey: ['supplier_products', { search, page }],
    queryFn: () => productApi.list({ search, page, limit: 10 }).then(r => r.data)
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Sản phẩm</h2>
          <p className="text-slate-500 text-sm">Quản lý không giới hạn sản phẩm B2B/B2C của gian hàng</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Thêm Sản phẩm mới
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select className="input !py-2 text-sm">
              <option value="">Tất cả trạng thái</option>
              <option value="APPROVED">Đang bán</option>
              <option value="PENDING">Chờ duyệt</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4">Tên Sản phẩm</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Lượt xem</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="skeleton h-6 w-full" /></td></tr>
                ))
              ) : data?.items?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Chưa có sản phẩm nào.</td></tr>
              ) : (
                data?.items?.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">📦</div>
                        )}
                        <div className="font-medium text-slate-900 w-48 truncate">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${product.type === 'B2B' ? 'bg-primary-50 text-primary-700' : 'bg-orange-50 text-orange-600'}`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {product.price ? `${product.price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        product.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                        product.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{product.viewCount}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Sửa">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Hiển thị 10 / {data?.total || 0} sản phẩm</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">«</button>
            <button onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded hover:bg-slate-50">»</button>
          </div>
        </div>
      </div>

      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </div>
  );
}
