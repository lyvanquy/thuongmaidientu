'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, X, Check, FileText } from 'lucide-react';

export function KybDialog({ isOpen, onClose, companyId, onDecide }: any) {
  const [notes, setNotes] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['verification', companyId],
    queryFn: () => api.get(`/companies/${companyId}/verification`).then(r => r.data),
    enabled: isOpen && !!companyId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Duyệt hồ sơ KYB</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary-600"/></div> : (
             <div>
                <p className="font-semibold text-slate-800 mb-2">Tài liệu đính kèm:</p>
                {data?.documents?.length ? (
                  <div className="flex gap-4 overflow-x-auto mb-6">
                    {data.documents.map((doc: string, i: number) => (
                      doc.endsWith('.pdf') ? 
                        <a key={i} href={doc} target="_blank" rel="noreferrer" className="w-24 h-24 bg-indigo-50 flex flex-col justify-center items-center rounded-xl text-indigo-600 hover:bg-indigo-100 transition"><FileText size={24}/><span className="text-[10px] mt-1">PDF</span></a> :
                        <a key={i} href={doc} target="_blank" rel="noreferrer"><img src={doc} className="w-24 h-24 object-cover rounded-xl border" /></a>
                    ))}
                  </div>
                ) : <p className="text-slate-500 text-sm mb-6">Không có tài liệu nào.</p>}
                
                <p className="font-semibold text-slate-800 mb-2">Ghi chú từ DN:</p>
                <div className="p-3 bg-slate-50 rounded-xl mb-6 text-sm text-slate-700 whitespace-pre-line">{data?.notes || 'Không có ghi chú.'}</div>
                
                <p className="font-semibold text-slate-800 mb-2">Ghi chú (dành cho Từ chối/Duyệt):</p>
                <textarea 
                  className="w-full input border-slate-300" 
                  rows={3} 
                  placeholder="Lý do từ chối hoặc lời nhắn..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={() => { onDecide('REJECTED', notes); onClose(); }} className="btn-outline !py-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center"><X className="mr-1" size={16}/> Từ chối</button>
          <button onClick={() => { onDecide('VERIFIED', notes); onClose(); }} className="btn-primary !py-2 bg-green-600 hover:bg-green-700 border-green-700 flex items-center shadow-green-200"><Check className="mr-1" size={16}/> Phê duyệt</button>
        </div>
      </div>
    </div>
  );
}
