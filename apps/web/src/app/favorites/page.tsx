'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { favoriteApi } from '@/lib/api';
import Link from 'next/link';
import { Heart, MessageCircle, Package, ShieldCheck, MapPin, Loader2, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteApi.list().then(r => r.data),
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => favoriteApi.toggle({ productId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const favorites = data?.items || [];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Vui lòng <Link href="/auth/login" className="text-primary-600 underline">đăng nhập</Link> để xem danh sách yêu thích.</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-main">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={24} className="text-red-500 fill-current" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Danh sách Yêu thích</h1>
            <p className="text-slate-500 text-sm">{favorites.length} sản phẩm đã lưu</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
        ) : favorites.length === 0 ? (
          <div className="card p-16 text-center">
            <Heart size={64} className="mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">Danh sách trống</h3>
            <p className="text-slate-400 mb-6">Nhấn vào biểu tượng ❤️ trên sản phẩm để thêm vào đây</p>
            <Link href="/products" className="btn-primary mx-auto">
              <Package size={16} /> Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favorites.map((fav: any) => {
              const product = fav.product;
              if (!product) return null;
              const img = product.images?.[0]?.url;
              return (
                <div key={fav.id} className="card overflow-hidden group hover:border-primary-200 transition-all">
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <Link href={`/products/${product.id}`}>
                      {img
                        ? <img src={img} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-5xl">📦</div>
                      }
                    </Link>
                    <span className={`absolute top-2 left-2 badge ${product.type === 'B2B' ? 'badge-b2b' : 'badge-b2c'}`}>{product.type}</span>
                    <button
                      onClick={() => removeMutation.mutate(product.id)}
                      disabled={removeMutation.isPending}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition group/btn"
                      title="Xóa khỏi yêu thích"
                    >
                      {removeMutation.isPending
                        ? <Loader2 size={14} className="animate-spin text-slate-400" />
                        : <Trash2 size={14} className="text-slate-400 group-hover/btn:text-red-500 transition-colors" />
                      }
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="text-xs text-slate-400 mb-1">{product.category?.name}</p>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-2 hover:text-primary-700 transition-colors leading-snug">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-lg font-black text-primary-700 mb-1">
                      {product.price ? `${product.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      {product.company?.verificationStatus === 'VERIFIED' && <ShieldCheck size={12} className="text-green-500" />}
                      <span className="truncate">{product.company?.name}</span>
                      {product.company?.province && (
                        <>
                          <span>·</span>
                          <MapPin size={10} />
                          <span>{product.company.province}</span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`} className="flex-1 btn-primary text-xs !py-2">
                        Xem chi tiết
                      </Link>
                      <Link href={`/chat`} className="btn-ghost border border-slate-200 !py-2 !px-3">
                        <MessageCircle size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
