'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { productApi } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { Loader2, Plus, Minus, ShoppingCart, MessageSquare, ShieldCheck, MapPin, Building2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { RfqModal } from '@/components/rfq/rfq-modal';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [quantity, setQuantity] = useState(1);
  const [isRfqOpen, setIsRfqOpen] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id as string).then(res => res.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
  }

  if (!product) {
    return <div className="min-h-[50vh] flex items-center justify-center text-slate-500">Sản phẩm không tồn tại.</div>;
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price || 0,
      quantity,
      image: product.images?.[0]?.url,
      companyName: product.company?.name
    });
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleRequestQuote = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setIsRfqOpen(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center text-sm text-slate-500">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <ChevronRight size={16} className="mx-2" />
          <Link href="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-slate-900 font-medium truncate w-64 sm:w-auto">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái: Chi tiết & Hình ảnh (Chiếm 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 flex flex-col md:flex-row gap-8">
              {/* Hình ảnh */}
              <div className="w-full md:w-1/2 space-y-4">
                <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  {product.images?.[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                  )}
                </div>
                {/* Thumbnails */}
                {product.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((img: any, i: number) => (
                      <button key={i} className="w-20 h-20 flex-shrink-0 rounded-xl border border-slate-200 overflow-hidden hover:border-primary-500">
                        <img src={img.url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin chính */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="mb-2">
                  <span className={`badge ${product.type === 'B2B' ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'}`}>
                    {product.type === 'B2B' ? 'Bán Sỉ (B2B)' : product.type === 'B2C' ? 'Bán Lẻ (B2C)' : 'Sỉ & Lẻ'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
                  {product.name}
                </h1>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  {product.type !== 'B2C' ? (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Giá thương lượng do số lượng lớn</p>
                      <div className="text-3xl font-bold text-primary-700">
                        {product.price ? `${product.price.toLocaleString()}đ` : 'Liên hệ'} 
                        {product.priceMax && ` - ${product.priceMax.toLocaleString()}đ`}
                      </div>
                      {product.moq && (
                        <p className="text-sm font-medium text-slate-600 mt-2">
                          Số lượng Tối thiểu (MOQ): <span className="text-slate-900">{product.moq} {product.unit || 'sản phẩm'}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Giá bán lẻ niêm yết</p>
                      <div className="text-3xl font-bold text-primary-700">
                        {product.price ? `${product.price.toLocaleString()}đ` : 'Liên hệ'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm text-slate-600 mb-4 line-clamp-4">
                    {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                  </div>
                </div>

                {/* Form Số lượng */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-semibold text-slate-700 text-sm">Số lượng:</span>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white w-32">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition">
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center font-semibold text-slate-900 py-2 border-x border-slate-300 focus:outline-none"
                      />
                      <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Hành động B2B/B2C */}
                  {product.type !== 'B2C' ? (
                    <div className="flex gap-3">
                      <button onClick={handleRequestQuote} className="btn-primary flex-1 !py-3">
                        Yêu cầu Báo giá (RFQ)
                      </button>
                      <button onClick={handleRequestQuote} className="btn-outline !py-3 aspect-square px-0 w-12 sm:w-auto sm:px-5">
                        <MessageSquare size={20} /> <span className="hidden sm:inline">Thương lượng</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={handleAddToCart} className="btn-outline flex-1 !py-3 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-400">
                        <ShoppingCart size={20} className="mr-2" />
                        Thêm vào giỏ
                      </button>
                      <button onClick={handleBuyNow} className="btn-primary flex-1 !py-3 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 border-0 shadow-accent-200/50">
                        Mua ngay
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Chi tiết thêm */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Chi tiết sản phẩm</h2>
              <div className="prose prose-slate max-w-none text-sm whitespace-pre-line">
                {product.description || 'Chưa cập nhật chi tiết'}
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin Nhà cung cấp */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 block">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {product.company?.logo ? (
                    <img src={product.company.logo} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                    {product.company?.name || 'Nhà cung cấp ẩn danh'}
                  </h3>
                  <div className="flex items-center text-sm text-slate-500 gap-1 mb-1">
                    <MapPin size={14} /> 
                    {product.company?.province || product.province || 'Việt Nam'}
                  </div>
                  {product.company?.verificationStatus === 'VERIFIED' && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase">
                      <ShieldCheck size={12} /> Đã xác thực
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-6 text-center">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Đánh giá</div>
                  <div className="font-bold text-slate-900">4.9 / 5</div>
                </div>
                <div className="border-l border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Tỉ lệ phản hồi</div>
                  <div className="font-bold text-slate-900">98%</div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href={`/companies/${product.company?.id || ''}`} className="btn-outline w-full justify-center">
                  Xem gian hàng
                </Link>
                {product.type === 'B2B' && (
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 rounded-xl transition">
                    <MessageSquare size={18} /> Nhắn tin cho xưởng
                  </button>
                )}
              </div>
            </div>

            {/* Banner bảo vệ người mua */}
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-white border-primary-100">
              <div className="flex items-center gap-3 mb-2 font-bold text-primary-800">
                <ShieldCheck size={24} className="text-primary-600" />
                TradeMart Protection
              </div>
              <p className="text-sm text-slate-600 mb-4">Mọi giao dịch trên hệ thống đều được giám sát. Hoàn tiền 100% nếu sản phẩm lỗi hoặc không đúng như mô tả hợp đồng.</p>
              <Link href="/help/protection" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Tìm hiểu thêm &rarr;</Link>
            </div>
          </div>

        </div>
      </div>
      
      <RfqModal 
        isOpen={isRfqOpen} 
        onClose={() => setIsRfqOpen(false)} 
        product={product} 
      />
    </div>
  );
}
