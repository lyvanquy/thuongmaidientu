import { useState } from 'react';
import { X, Upload, Loader2, Save } from 'lucide-react';
import { productApi } from '@/lib/api';

export function CreateProductModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '', type: 'B2B', price: '', priceMax: '', moq: '', description: '', categoryId: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productApi.create({
        ...formData,
        price: parseFloat(formData.price),
        priceMax: formData.priceMax ? parseFloat(formData.priceMax) : undefined,
        moq: formData.moq ? parseInt(formData.moq, 10) : undefined,
        // Cần nhập UUID Category hợp lệ hoặc API sẽ lỗi. Cho MVP ta chọn category mặc định hoặc có sẵn (mock).
        // Tạm mock dữ liệu cứng category.
        categoryId: 'seed-category-id-1', // Thực tế cần fetch danh sách category để chọn
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert('Thất bại khi thêm sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Thêm Sản phẩm Mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
            <input type="text" required placeholder="Nhập tên sản phẩm..." className="input w-full"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Loại Nhập Sỉ/Lẻ</label>
              <select className="input w-full" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="B2B">Bán sỉ (B2B)</option>
                <option value="B2C">Bán lẻ (B2C)</option>
                <option value="BOTH">Hỗ trợ cả hai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng tối thiểu (MOQ)</label>
              <input type="number" placeholder="Dành cho B2B..." className="input w-full"
                value={formData.moq} onChange={e => setFormData({...formData, moq: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giá bán cơ bản (đ) *</label>
              <input type="number" required placeholder="VD: 50000" className="input w-full"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giá trần thương lượng (đ)</label>
              <input type="number" placeholder="Optional..." className="input w-full"
                value={formData.priceMax} onChange={e => setFormData({...formData, priceMax: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hình ảnh sản phẩm</label>
            <div className="border border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-primary-400 transition cursor-pointer">
              <Upload size={24} className="mb-2 text-slate-400" />
              <p className="text-sm font-medium">Nhấn để tải lên hoặc kéo thả vào đây</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ ảnh JPG, PNG (Tối đa 5MB)</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
            <textarea rows={3} placeholder="Mô tả công năng..." className="input w-full"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg font-medium transition">
            Hủy bỏ
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Đăng Sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
