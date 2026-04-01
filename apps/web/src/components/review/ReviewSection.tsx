'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface ReviewProps {
  productId?: string;
  companyId?: string;
  type: 'product' | 'company';
}

export function ReviewSection({ productId, companyId, type }: ReviewProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const targetId = type === 'product' ? productId : companyId;
  const endpoint = type === 'product' ? `/review/product/${targetId}` : `/review/company/${targetId}`;

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', type, targetId, page],
    queryFn: () => api.get(`${endpoint}?page=${page}&limit=5`).then(res => res.data),
    enabled: !!targetId,
  });

  const postReview = useMutation({
    mutationFn: (data: any) => api.post('/review', data).then(res => res.data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá thành công!');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', type, targetId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi tin');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }
    postReview.mutate({
      productId: type === 'product' ? productId : undefined,
      companyId: type === 'company' ? companyId : undefined,
      rating,
      comment
    });
  };

  const renderStars = (count: number, interactive = false, currentRating = 0, onClick?: (r: number) => void) => {
    return (
      <div className="flex gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 24 : 16}
            className={`${
              (interactive ? star <= currentRating : star <= Math.round(count))
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            } transition`}
            onClick={() => interactive && onClick && onClick(star)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="card p-6 mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        <MessageSquare size={20} className="text-primary-600" /> 
        Đánh giá & Nhận xét
      </h2>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="text-center md:w-48 flex-shrink-0 bg-slate-50 rounded-xl p-6">
          <div className="text-5xl font-black text-slate-900 mb-2">{data?.averageRating || 0}</div>
          <div className="flex justify-center mb-1">{renderStars(data?.averageRating || 0)}</div>
          <div className="text-sm text-slate-500">{data?.total || 0} bài đánh giá</div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Gửi nhận xét của bạn</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="text-sm text-slate-600 block mb-2">Chấm điểm</label>
              {renderStars(0, true, rating, setRating)}
            </div>
            <textarea
              className="w-full input border-slate-300 bg-slate-50 focus:bg-white mb-3"
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn (chỉ áp dụng nếu đã giao dịch thành công)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={postReview.isPending}
              className="btn-primary !py-2 px-6 ml-auto flex"
            >
              {postReview.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Gửi đánh giá
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        {data?.items?.length > 0 ? (
          data.items.map((review: any) => (
            <div key={review.id} className="flex gap-4 border-b border-slate-100 pb-6 last:border-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {review.user?.avatar ? (
                  <img src={review.user.avatar} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{review.user?.name || 'Ẩn danh'}</span>
                  <span className="text-xs text-slate-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mb-2">{renderStars(review.rating)}</div>
                <p className="text-slate-700 text-sm whitespace-pre-line">{review.comment}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {review.images.map((img: string, i: number) => (
                      <img key={i} src={img} className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">Chưa có đánh giá nào.</div>
        )}
      </div>
      
      {data?.total > (data?.limit || 5) && (
        <div className="mt-8 flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page-1)} className="btn-outline !py-1 px-3">Trước</button>
          <span className="px-3 py-1 bg-slate-100 rounded text-sm text-slate-600">Trang {page}</span>
          <button disabled={page * (data?.limit || 5) >= data?.total} onClick={() => setPage(page+1)} className="btn-outline !py-1 px-3">Tiếp</button>
        </div>
      )}
    </div>
  );
}
