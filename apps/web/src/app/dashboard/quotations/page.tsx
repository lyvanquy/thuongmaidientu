'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rfqApi, quotationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Search, FileText, Send, Clock, CheckCircle, XCircle, Loader2, Sparkles, Building2 } from 'lucide-react';

type Tab = 'market' | 'my-quotes';

export default function SupplierQuotationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('market');
  const [quoteRfq, setQuoteRfq] = useState<any>(null); // State for Quote Modal
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const { data: openData, isLoading: loadingOpen } = useQuery({
    queryKey: ['rfq-open'],
    queryFn: () => rfqApi.open().then(r => r.data),
    enabled: tab === 'market' && !!user,
  });

  const { data: myQuotesData, isLoading: loadingMy } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: () => quotationApi.myList().then(r => r.data),
    enabled: tab === 'my-quotes' && !!user,
  });

  const submitQuote = useMutation({
    mutationFn: (d: any) => quotationApi.create(d),
    onSuccess: () => {
      alert('Đã gửi Báo giá thành công!');
      setQuoteRfq(null);
      setPrice('');
      setMessage('');
      setTab('my-quotes');
      qc.invalidateQueries({ queryKey: ['my-quotations'] });
    },
    onError: () => alert('Lỗi! Vui lòng thử lại. Đảm bảo bạn đã điền đủ thông tin.'),
  });

  const handleQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    submitQuote.mutate({
      rfqId: quoteRfq.id,
      price: Number(price),
      message,
    });
  };

  const openRfqs = openData?.items || [];
  const myQuotes = myQuotesData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles size={28} className="text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Thị trường Cơ hội & Báo giá</h2>
          <p className="text-sm text-slate-500">Tìm kiếm khách hàng B2B và gửi báo giá cạnh tranh</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('market')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'market' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔍 RFQ Đang Mở 
          <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{openRfqs.length || 0}</span>
        </button>
        <button
          onClick={() => setTab('my-quotes')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'my-quotes' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Lịch sử Báo giá của tôi
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {/* TAB 1: MARKET */}
        {tab === 'market' && (
          <div>
            {loadingOpen ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
            ) : openRfqs.length === 0 ? (
              <div className="card p-16 text-center text-slate-400">
                <Search size={48} className="mx-auto mb-3 text-slate-200" />
                <p>Không có yêu cầu báo giá công khai nào lúc này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {openRfqs.map((rfq: any) => (
                  <div key={rfq.id} className="card p-5 hover:border-primary-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug">{rfq.title}</h3>
                        <span className="badge bg-green-100 text-green-700 text-[10px] whitespace-nowrap">Đang mở</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Building2 size={12} /> {rfq.buyer?.name} 
                        <span>·</span>
                        <Clock size={12} /> {new Date(rfq.createdAt).toLocaleDateString()}
                      </div>
                      
                      {rfq.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                          "{rfq.description}"
                        </p>
                      )}

                      <div className="space-y-2 mb-5">
                        <p className="text-xs font-bold text-slate-700 uppercase">Hàng hóa yêu cầu:</p>
                        {rfq.items.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm py-1 border-b border-dashed border-slate-200">
                            <span className="text-slate-800">{item.productName}</span>
                            <span className="font-semibold">{item.quantity} {item.unit || 'Cái'}</span>
                          </div>
                        ))}
                        {rfq.items.length > 3 && (
                          <p className="text-xs text-slate-400">+ {rfq.items.length - 3} mặt hàng khác</p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setQuoteRfq(rfq)}
                      className="w-full btn-primary !py-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                    >
                      <Send size={16} /> Gửi Ý Kiến Báo Giá
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY QUOTES */}
        {tab === 'my-quotes' && (
          <div>
            {loadingMy ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
            ) : myQuotes.length === 0 ? (
              <div className="card p-16 text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-3 text-slate-200" />
                <p>Bạn chưa gửi báo giá nào.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Khách hàng / RFQ</th>
                      <th className="px-5 py-4 font-semibold">Giá đề xuất</th>
                      <th className="px-5 py-4 font-semibold">Thông điệp</th>
                      <th className="px-5 py-4 font-semibold">Ngày gửi</th>
                      <th className="px-5 py-4 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myQuotes.map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 line-clamp-1">{q.rfq?.title || '—'}</p>
                          <p className="text-xs text-slate-500">{q.rfq?.buyer?.name || '—'}</p>
                        </td>
                        <td className="px-5 py-4 font-black text-primary-700">
                          {q.price?.toLocaleString()}đ
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-600 line-clamp-1 max-w-[200px]">{q.message || <span className="text-slate-300 italic">Không có</span>}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge whitespace-nowrap ${
                            q.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            q.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {q.status === 'ACCEPTED' && <CheckCircle size={12} className="inline mr-1" />}
                            {q.status === 'REJECTED' && <XCircle size={12} className="inline mr-1" />}
                            {q.status === 'PENDING' && <Clock size={12} className="inline mr-1" />}
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {quoteRfq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Send size={18} className="text-indigo-600" /> Tạo Báo Giá
              </h3>
              <button onClick={() => setQuoteRfq(null)} className="btn-ghost p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm">
                <p className="text-indigo-800 font-semibold mb-1">Gửi cho: <strong>{quoteRfq.buyer?.name}</strong></p>
                <p className="text-indigo-600 line-clamp-1">{quoteRfq.title}</p>
              </div>

              <form id="quoteForm" onSubmit={handleQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng giá đề xuất (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    placeholder="Nhập con số cạnh tranh nhất..."
                    className="input w-full font-bold text-lg text-primary-700"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">Lưu ý tính toán kỹ càng chi phí vận chuyển & thuế.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Thông điệp thuyết phục (Tuỳ chọn)</label>
                  <textarea
                    rows={4}
                    placeholder="Nêu bật ưu thế của doanh nghiệp bạn: Chính sách chiết khấu, thời gian giao hàng, bảo hành..."
                    className="input w-full text-sm"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 mt-auto">
              <button type="button" onClick={() => setQuoteRfq(null)} className="btn-ghost flex-1">
                Hủy
              </button>
              <button form="quoteForm" type="submit" disabled={submitQuote.isPending} className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700">
                {submitQuote.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                Gửi Báo Giá Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
