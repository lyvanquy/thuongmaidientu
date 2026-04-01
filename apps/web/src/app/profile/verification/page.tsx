'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, ShieldCheck, Upload, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function VerificationPage() {
  const { user } = useAuthStore() as any;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!user || user.role !== 'SUPPLIER') {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  const companyId = user.companyId;

  // 1. Load Company Info for overall status
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => api.get(`/companies/${companyId}`).then(r => r.data),
    enabled: !!companyId,
  });

  // 2. Load latest verification submission
  const { data: verification, isLoading: loadingVer } = useQuery({
    queryKey: ['verification', companyId],
    queryFn: () => api.get(`/companies/${companyId}/verification`).then(r => r.data),
    enabled: !!companyId,
    meta: {
      onSuccess: (data: any) => {
        if (data && data.documents) {
          setDocuments(data.documents);
        }
      }
    }
  });

  const submitMut = useMutation({
    mutationFn: (data: any) => api.post(`/companies/${companyId}/verify/upload`, data),
    onSuccess: () => {
      toast.success('Gửi yêu cầu thành công! Vui lòng chờ phản hồi từ Admin.');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['verification', companyId] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi nộp hồ sơ'),
  });

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData);
      setDocuments(prev => [...prev, data.url]);
      toast.success('Tải tệp lên thành công');
    } catch (error) {
       toast.error('Lỗi tải tệp!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (documents.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 tài liệu (Giấy phép kinh doanh / CMND)');
      return;
    }
    submitMut.mutate({ documents, notes });
  };

  if (loadingCompany || loadingVer) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32}/></div>;

  const status = company?.verificationStatus || 'PENDING';
  
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="text-slate-600" size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Xác thực doanh nghiệp (KYB)</h1>
            <p className="text-sm text-slate-500">Giúp tăng độ tin cậy và ưu tiên hiển thị trên thị trường</p>
          </div>
        </div>

        <div className="card p-8">
          {/* Status Display */}
          <div className="mb-8 p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 justify-between
            ${status === 'VERIFIED' ? 'bg-green-50 border-green-200' : status === 'PENDING' && verification ? 'bg-yellow-50 border-yellow-200' : status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}
          ">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                {status === 'VERIFIED' && <ShieldCheck size={32} className="text-green-600" />}
                {status === 'PENDING' && <Loader2 size={32} className="text-yellow-600 animate-spin" />}
                {status === 'REJECTED' && <AlertTriangle size={32} className="text-red-600" />}
                {!verification && status !== 'VERIFIED' && <FileText size={32} className="text-blue-600" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {status === 'VERIFIED' ? 'Đã xác minh minh bạch' : status === 'PENDING' && verification ? 'Đang chờ Admin phê duyệt' : status === 'REJECTED' ? 'Hồ sơ bị từ chối' : 'Chưa được xác minh'}
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-sm">
                  {status === 'VERIFIED' 
                     ? 'Doanh nghiệp của bạn đã có Badge Tích xanh và được ưu tiên khi Khách hàng tìm kiếm.' 
                     : status === 'REJECTED' && verification?.notes
                       ? `Lý do: ${verification.notes}`
                       : 'Vui lòng nộp Giấy ĐKKD hoặc MST để gia nhập nhóm Cửa hàng Uy tín.'}
                </p>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          {(status === 'REJECTED' || !verification || status === 'PENDING') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Tài liệu tải lên</label>
                <div className="text-sm text-slate-500 mb-4">Các định dạng hỗ trợ: JPG, PNG, PDF. (Tối đa 5MB)</div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="aspect-square bg-slate-100 rounded-xl relative overflow-hidden group border border-slate-200">
                      {doc.endsWith('.pdf') ? (
                         <div className="w-full h-full flex items-center justify-center flex-col text-indigo-500 bg-indigo-50"><FileText size={40}/><span className="text-xs font-bold mt-2">Bản PDF</span></div>
                      ) : (
                         <img src={doc} className="w-full h-full object-cover" />
                      )}
                      {status !== 'PENDING' && (
                        <button type="button" onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-white/80 rounded block p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 text-slate-600">Xóa</button>
                      )}
                    </div>
                  ))}
                  
                  {status !== 'PENDING' && (
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                      {uploading ? <Loader2 size={24} className="animate-spin text-slate-400" /> : <Upload size={24} className="text-slate-400 mb-2" />}
                      <span className="text-xs font-semibold text-slate-500">{uploading ? 'Đang tải...' : 'Tải tài liệu lên'}</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Ghi chú cho Admin (Không bắt buộc)</label>
                <textarea 
                  disabled={status === 'PENDING'}
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="w-full input border-slate-300 bg-slate-50 focus:bg-white" 
                  rows={4} 
                  placeholder="Giải trình thêm hoặc ghi chú về giấy tờ..."
                />
              </div>

              {status !== 'PENDING' && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button type="submit" disabled={submitMut.isPending || uploading || documents.length === 0} className="btn-primary !px-8">
                    {submitMut.isPending ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                    Nộp hồ sơ xét duyệt
                  </button>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
