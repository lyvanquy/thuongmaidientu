import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface RfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function RfqModal({ isOpen, onClose, product }: RfqModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    quantity: product?.moq || 100,
    targetPrice: product?.price || 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gửi yêu cầu báo giá
      const res = await api.post('/rfqs', {
        title: `Yêu cầu báo giá cho sản phẩm ${product.name}`,
        description: `Giá mong muốn: ${formData.targetPrice}đ. Ghi chú thêm: ${formData.notes}`,
        targetCompanyId: product.companyId,
        items: [{
          productName: product.name,
          quantity: Number(formData.quantity),
          unit: product.unit || 'sản phẩm',
          notes: formData.notes
        }]
      });

      // Tạo logic phụ: Nếu có tuỳ chọn chat ngay, ở MVP ta điều hướng thẳng vào chatroom tự động
      // Vì RFQ Controller chỉ lưu dữ liệu RFQ, bước kết nối chat có thể do Buyer chủ động từ RFQ Detail,
      // Nhưng để luồng nhanh: Chuyển hướng về trang danh sách RFQ hoặc Chat
      alert('Đã gửi Yêu cầu Báo giá thành công! Bạn có thể trao đổi tiếp thông qua trung tâm Chat.');
      onClose();
      // Ta mở trang Chat (vì backend chưa tự auto-create chat từ rfq bằng API riêng ở frontend, 
      // ta có thể gọi tiếp api /chat để tạo room kết nối người mua và người bán).
      // Giả lập tạo phòng Chat
      const chatRes = await api.post('/chat/room', {
        participantIds: [product.company?.ownerId], // ID của Supplier (có thể thiếu thông tin trong product, ta mock)
      }).catch(e => null); 

      router.push('/chat');

    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo giá.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Yêu cầu Báo giá (RFQ)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <img src={product.images?.[0]?.url || 'https://via.placeholder.com/60'} className="w-12 h-12 rounded object-cover" />
            <div>
              <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
              <div className="text-xs text-slate-500">Cung cấp bởi: {product.company?.name || 'Gian hàng nội bộ'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng dự kiến *</label>
              <input type="number" required min={product.moq || 1} className="input w-full"
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
              <div className="text-[10px] text-slate-500 mt-1">MOQ: {product.moq}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mức giá mục tiêu (đ) *</label>
              <input type="number" required className="input w-full"
                value={formData.targetPrice} onChange={e => setFormData({...formData, targetPrice: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Yêu cầu thêm / Ghi chú cho xưởng</label>
            <textarea rows={3} placeholder="Ví dụ: Cần tuỳ chỉnh bao bì đóng gói logo riêng..." className="input w-full"
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Hủy bỏ
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Gửi Yêu cầu & Chat
          </button>
        </div>
      </div>
    </div>
  );
}
