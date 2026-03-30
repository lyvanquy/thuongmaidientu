'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AdminContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string | null;
  onDecide: (action: 'approve' | 'reject', terms?: string) => Promise<void>;
}

export function AdminContractDialog({ isOpen, onClose, contractId, onDecide }: AdminContractDialogProps) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState('');

  useEffect(() => {
    if (isOpen && contractId) {
      setLoading(true);
      api.get(`/contracts/${contractId}`).then(res => {
        setContract(res.data);
        setTerms(res.data.terms || '');
      }).finally(() => setLoading(false));
    } else {
      setContract(null);
    }
  }, [isOpen, contractId]);

  const handleApprove = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      await onDecide('approve', terms);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!contract) return;
    if (!confirm('Bạn chắc chắn TỪ CHỐI hợp đồng này? Thao tác không thể hoàn tác.')) return;
    setSaving(true);
    try {
      await onDecide('reject');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 shrink-0 bg-white px-6 pt-6 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-primary-600" /> Trạm Duyệt Hợp Đồng điện tử
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hãy đọc kỹ các điều khoản trước khi cung cấp con dấu nền tảng phân quyền ký kết cho 2 bên.
            </p>
          </div>
          {contract && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              contract.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
              contract.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
              'bg-slate-100 text-slate-600'
            }`}>
              {contract.status === 'PENDING' ? 'CHỜ DUYỆT' : contract.status}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
          ) : contract ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-sm relative">
              <div className="p-8 space-y-6 relative z-10">
                <div className="text-center mb-8 border-b border-dashed border-slate-300 pb-6">
                  <h2 className="text-xl font-black uppercase tracking-wide text-slate-800">{contract.title}</h2>
                  <p className="font-mono text-slate-500 mt-2">Mã HĐ: #{contract.contractNumber}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 text-slate-700">
                  <div>
                    <h3 className="font-bold text-indigo-700 mb-2 border-b border-indigo-100 pb-1">BÊN BÁN (BÊN A)</h3>
                    <p><strong>Công ty:</strong> {contract.supplier?.name}</p>
                    <p><strong>Ngày thực hiện:</strong> {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-700 mb-2 border-b border-teal-100 pb-1">BÊN MUA (BÊN B)</h3>
                    <p><strong>Công ty:</strong> {contract.buyer?.name}</p>
                    <p><strong>Giá trị:</strong> <span className="text-lg font-black text-primary-700">{contract.value?.toLocaleString()} {contract.currency}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" /> Điều khoản Thỏa thuận
                  </h3>
                  {contract.status === 'PENDING' ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Admin có thể sửa lại điều khoản tại đây trước khi duyệt:</label>
                      <textarea 
                        className="w-full h-40 p-3 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none resize-y"
                        value={terms}
                        onChange={e => setTerms(e.target.value)}
                        placeholder="Nội dung điều khoản..."
                      />
                      <p className="text-[10px] text-amber-600 mt-1 italic">* Bất kỳ chỉnh sửa nào của Admin sẽ lưu đè lên bản thảo trước khi duyệt.</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg whitespace-pre-wrap">
                      {contract.terms || 'Không có điều khoản cụ thể.'}
                    </div>
                  )}
                </div>

              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                <strong className="text-6xl transform -rotate-45 whitespace-nowrap">TRADEMART REVIEW</strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500">Không tìm thấy dữ liệu hợp đồng</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 shrink-0 bg-white px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Mã HĐ: {contract?.contractNumber}
          </div>
          <div className="flex gap-3">
            {contract?.status === 'PENDING' && (
              <>
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-2 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
                  Từ chối
                </button>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-xl hover:opacity-90 transition shadow-md shadow-emerald-200 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                  Phê Duyệt Hợp Đồng
                </button>
              </>
            )}
            {contract?.status !== 'PENDING' && (
               <button onClick={onClose} className="px-6 py-2 bg-slate-100 font-semibold rounded-xl hover:bg-slate-200 text-slate-700">Đóng lại</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
