'use client';
import { useState, useEffect } from 'react';
import { api, adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, Save, Send, ShieldCheck, Printer,
  CheckCircle2, Clock, PenLine, FileCheck, Award, ArrowLeft, XCircle, Shield
} from 'lucide-react';
import Link from 'next/link';
import { OtpSignModal } from '@/components/contract/otp-sign-modal';

// ─── Status Timeline ───────────────────────────────────────
const STATUS_STEPS = [
  { key: 'DRAFT',    label: 'Soạn thảo',          icon: '📝' },
  { key: 'PENDING',  label: 'Chờ phê duyệt',       icon: '📤' },
  { key: 'APPROVED', label: 'Đã phê duyệt',        icon: '✅' },
  { key: 'SIGNED',   label: 'Đã ký — Có hiệu lực', icon: '🔏' },
  { key: 'COMPLETED',label: 'Hoàn thành',          icon: '🎉' },
];

function ContractTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div className="no-print card p-5 mb-6">
      <h3 className="text-sm font-bold text-slate-700 mb-4">Tiến trình Hợp Đồng</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= currentIdx;
            const isActive = i === currentIdx;
            return (
              <div key={step.key} className="flex items-center gap-4 relative pl-10">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  isDone
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-slate-200 text-slate-300'
                } ${isActive ? 'ring-4 ring-primary-100 scale-110' : ''}`}>
                  {isDone ? <CheckCircle2 size={16} /> : <Clock size={14} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.icon} {step.label}
                  </p>
                  {isActive && <p className="text-xs text-primary-600 font-medium">← Trạng thái hiện tại</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ContractDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore() as any;
  const router = useRouter();

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    value: 0,
    currency: 'VND',
    terms: '',
    deliveryMethod: '',
    warranty: '',
    paymentMethod: '',
    penalty: '',
    startDate: '',
    endDate: '',
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const fetchContract = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data);
      setFormData(prev => ({
        ...prev,
        value: res.data.value || 0,
        currency: res.data.currency || 'VND',
        terms: res.data.terms || '',
        startDate: res.data.startDate ? res.data.startDate.substring(0, 10) : '',
        endDate: res.data.endDate ? res.data.endDate.substring(0, 10) : '',
      }));
    } catch {
      alert('Không tìm thấy hợp đồng');
      router.push('/contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchContract();
  }, [user, id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-primary-600" size={36} />
    </div>
  );
  if (!contract) return null;

  const isBuyer    = user?.companyId === contract.buyerId;
  const isSupplier = user?.companyId === contract.supplierId;
  const amISigned  = contract.signatures?.some((s: any) => s.userId === user?.id);
  const supplierSig = contract.signatures?.find((s: any) => s.user?.companyId === contract.supplierId);
  const buyerSig    = contract.signatures?.find((s: any) => s.user?.companyId === contract.buyerId);
  
  const canSupplierSign = !amISigned && contract.status === 'APPROVED' && isSupplier && !supplierSig;
  const canBuyerSign    = !amISigned && contract.status === 'APPROVED' && isBuyer    && !buyerSig;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/contracts/${id}`, {
        value: formData.value,
        terms: buildTermsText(),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      await fetchContract();
    } catch { alert('Lỗi lưu nháp'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.patch(`/contracts/${id}`, {
        value: formData.value,
        terms: buildTermsText(),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      await api.post(`/contracts/${id}/submit`);
      await fetchContract();
    } catch { alert('Lỗi gửi hợp đồng'); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    if (!confirm('Bạn chắc chắn phê duyệt phân quyền pháp lý cho hợp đồng này?')) return;
    setSaving(true);
    try {
      await adminApi.approveContract(id as string);
      await fetchContract();
    } catch { alert('Lỗi phê duyệt'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!confirm('Bạn sẽ TỪ CHỐI hợp đồng này? Hành động không thể hoàn tác.')) return;
    setSaving(true);
    try {
      await adminApi.rejectContract(id as string);
      await fetchContract();
    } catch { alert('Lỗi từ chối hợp đồng'); }
    finally { setSaving(false); }
  };

  const handleRequestOtp = async () => {
    const res = await api.post(`/contracts/${id}/request-otp`);
    return res.data;
  };

  const handleSign = async (otp: string, signatureImage: string, stampUrl: string, signerTitle: string) => {
    await api.post(`/contracts/${id}/sign`, { otp, signatureImage, stampUrl, signerTitle });
    await fetchContract();
  };

  const handlePrint = () => setShowPrintPreview(true);

  // Tạo nội dung điều khoản từ form data
  const buildTermsText = () => {
    return [
      formData.paymentMethod && `Phương thức thanh toán: ${formData.paymentMethod}`,
      formData.deliveryMethod && `Phương thức giao hàng: ${formData.deliveryMethod}`,
      formData.warranty && `Bảo hành: ${formData.warranty}`,
      formData.penalty && `Điều khoản phạt vi phạm: ${formData.penalty}`,
      formData.terms && `Điều khoản khác: ${formData.terms}`,
    ].filter(Boolean).join('\n\n');
  };

  return (
    <>
      <style global jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 30mm 25mm !important; }
        }
      `}</style>

      <div className={`bg-slate-100 min-h-screen py-6 ${showPrintPreview ? 'fixed inset-0 z-50 !bg-slate-900/90 overflow-auto flex flex-col backdrop-blur-md' : ''}`}>
        
        {/* Print Preview Floating Toolbar */}
        {showPrintPreview && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[70] bg-white/10 backdrop-blur-xl px-5 py-3 rounded-full shadow-2xl border border-white/20">
            <span className="text-white/80 text-sm font-medium mr-4">Chế độ Xem Trước (A4)</span>
            <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 rounded-full text-white text-sm font-semibold hover:bg-white/20 transition">Đóng</button>
            <button onClick={() => window.print()} className="px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold shadow-xl flex items-center gap-2 transition">
              <Printer size={16} /> Bắt đầu In / Lưu PDF
            </button>
          </div>
        )}

        <div className={`max-w-5xl mx-auto px-4 ${showPrintPreview ? 'w-full mt-24 pb-24 drop-shadow-2xl scale-[0.85] origin-top' : ''}`}>

          {/* Topbar — no-print */}
          {!showPrintPreview && (
            <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
              <Link href="/contracts" className="text-slate-500 hover:text-primary-600 font-medium flex items-center gap-1">
              <ArrowLeft size={16} /> Quay lại danh sách
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handlePrint} className="btn-ghost border border-slate-200 text-sm">
                <Printer size={15} /> In / Xuất PDF
              </button>

              {contract.status === 'DRAFT' && isSupplier && (
                <>
                  <button onClick={handleSave} disabled={saving} className="btn-ghost border border-slate-200 text-sm">
                    <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu nháp'}
                  </button>
                  <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm">
                    <Send size={15} /> Gửi cho Bên Mua
                  </button>
                </>
              )}

              {contract.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  {user?.role !== 'ADMIN' && (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 border border-amber-200 shadow-sm">
                      <Clock size={16} /> Đang chờ Sàn duyệt
                    </span>
                  )}
                  {user?.role === 'ADMIN' && (
                    <>
                      <button onClick={handleApprove} disabled={saving} className="btn-primary text-sm bg-green-600 hover:bg-green-700 shadow-green-200">
                        <CheckCircle2 size={15} /> Admin Duyệt
                      </button>
                      <button onClick={handleReject} disabled={saving} className="btn-primary text-sm bg-red-600 hover:bg-red-700 shadow-red-200">
                        <XCircle size={15} /> Từ chối
                      </button>
                    </>
                  )}
                </div>
              )}

              {contract.status === 'APPROVED' && !amISigned && (
                <button onClick={() => setShowOtpModal(true)} className="btn-primary text-sm bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
                  <PenLine size={15} /> Ký Tên Điện Tử
                </button>
              )}

              {contract.status === 'SIGNED' && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">
                  <ShieldCheck size={16} /> Hợp đồng có hiệu lực pháp lý
                </div>
              )}
            </div>
          </div>
          )}

          <div className="flex gap-6">
            {/* Left: Timeline (no-print) */}
            <div className="no-print w-64 flex-shrink-0 hidden lg:block">
              <ContractTimeline status={contract.status} />

              {/* Audit Trail */}
              <div className="card p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Nhật ký Kiểm toán</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <FileCheck size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Hợp đồng được tạo</p>
                      <p className="text-slate-400">{new Date(contract.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {contract.signatures?.map((sig: any) => (
                    <div key={sig.id} className="flex items-start gap-2 text-xs text-slate-600">
                      <Award size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{sig.user?.name} đã ký</p>
                        <p className="text-slate-400">{new Date(sig.signedAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Contract A4 Document */}
            <div className="flex-1">
              <div className="print-page bg-white shadow-lg border border-slate-200 rounded-sm p-8 sm:p-14 min-h-[1100px] relative">

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none overflow-hidden select-none">
                  <span className="text-9xl font-black rotate-[-45deg] whitespace-nowrap uppercase tracking-widest">
                    {contract.status === 'DRAFT' ? 'BẢN NHÁP' : contract.status === 'SIGNED' ? 'ĐÃ KÝ' : contract.status}
                  </span>
                </div>

                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-10">
                    <p className="font-bold text-sm tracking-widest">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold text-sm tracking-wider mt-0.5">Độc lập – Tự do – Hạnh phúc</p>
                    <div className="flex items-center justify-center gap-3 mt-4 mb-6">
                      <div className="h-px flex-1 bg-slate-900" />
                      <div className="h-px w-8 bg-slate-900" />
                      <div className="h-px flex-1 bg-slate-900" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-wide mb-1">HỢP ĐỒNG MUA BÁN HÀNG HÓA</h1>
                    <h2 className="text-base font-bold uppercase text-slate-700 mb-3">(Hợp đồng Thương Mại Điện Tử)</h2>
                    <div className="text-sm text-slate-600 space-y-0.5">
                      <p><strong>Số:</strong> <span className="font-mono">{contract.contractNumber?.toUpperCase()}</span></p>
                      <p><strong>Ngày:</strong> {new Date(contract.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Preamble */}
                  <p className="indent-8 text-justify leading-relaxed mb-6 text-sm">
                    Hôm nay, ngày {new Date().toLocaleDateString('vi-VN')}, tại hệ thống giao dịch điện tử <strong>TradeMart</strong>
                    {' '}(theo Luật Giao dịch Điện tử Việt Nam 2023), chúng tôi gồm hai bên cùng ký kết hợp đồng với các điều khoản và điều kiện như sau:
                  </p>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <h3 className="font-black uppercase text-slate-800 border-b border-slate-300 pb-2 mb-3 text-xs tracking-widest">BÊN BÁN (BÊN A)</h3>
                      <div className="space-y-1.5">
                        <p><span className="text-slate-500">Tên công ty:</span> <strong>{contract.supplier?.name}</strong></p>
                        <p><span className="text-slate-500">Địa chỉ:</span> {contract.supplier?.province || '—'}</p>
                        <p><span className="text-slate-500">Email:</span> {contract.supplier?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <h3 className="font-black uppercase text-slate-800 border-b border-slate-300 pb-2 mb-3 text-xs tracking-widest">BÊN MUA (BÊN B)</h3>
                      <div className="space-y-1.5">
                        <p><span className="text-slate-500">Tên công ty:</span> <strong>{contract.buyer?.name}</strong></p>
                        <p><span className="text-slate-500">Địa chỉ:</span> {contract.buyer?.province || '—'}</p>
                        <p><span className="text-slate-500">Email:</span> {contract.buyer?.email || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* ĐIỀU 1 */}
                  <Section title="Điều 1: Hàng hóa / Dịch vụ">
                    <p className="indent-8">Bên A đồng ý cung cấp và Bên B đồng ý mua hàng hóa/dịch vụ với tên gọi và mô tả được quy định trong hợp đồng này mang tên: <strong>"{contract.title}"</strong>. Chất lượng, quy cách kỹ thuật do hai bên thống nhất trong bản đặc tả kỹ thuật đính kèm (nếu có).</p>
                  </Section>

                  {/* ĐIỀU 2: Giá trị + Thanh toán */}
                  <Section title="Điều 2: Giá trị Hợp đồng & Phương thức Thanh toán">
                    <div className="mb-3 p-3 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Tổng giá trị hợp đồng:</span>
                      {contract.status === 'DRAFT' && isSupplier ? (
                        <div className="flex items-center gap-2">
                          <input type="number" className="input !py-1 text-right w-36 text-sm" value={formData.value}
                            onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
                          <span className="font-bold text-primary-700">{formData.currency}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-black text-primary-700">{contract.value?.toLocaleString('vi-VN')} {contract.currency}</span>
                      )}
                    </div>
                    <p><span className="text-slate-500">Phương thức thanh toán:</span>{' '}
                      {contract.status === 'DRAFT' && isSupplier
                        ? <input className="input !py-1 !px-2 text-sm ml-1 w-60 inline-block" placeholder="Chuyển khoản, COD..." value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} />
                        : <strong>{formData.paymentMethod || 'Thỏa thuận trực tiếp'}</strong>
                      }
                    </p>
                  </Section>

                  {/* ĐIỀU 3: Giao hàng */}
                  <Section title="Điều 3: Thời gian & Phương thức Giao hàng">
                    <div className="grid grid-cols-2 gap-4">
                      <p><span className="text-slate-500">Ngày bắt đầu:</span>{' '}
                        {contract.status === 'DRAFT' && isSupplier
                          ? <input type="date" className="input !py-1 text-sm ml-1 w-40 inline-block" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                          : <strong>{contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '—'}</strong>
                        }
                      </p>
                      <p><span className="text-slate-500">Ngày kết thúc:</span>{' '}
                        {contract.status === 'DRAFT' && isSupplier
                          ? <input type="date" className="input !py-1 text-sm ml-1 w-40 inline-block" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                          : <strong>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '—'}</strong>
                        }
                      </p>
                    </div>
                    <p className="mt-2"><span className="text-slate-500">Phương thức giao hàng:</span>{' '}
                      {contract.status === 'DRAFT' && isSupplier
                        ? <input className="input !py-1 !px-2 text-sm ml-1 w-60 inline-block" placeholder="Giao tận nơi, tự lấy..." value={formData.deliveryMethod} onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value })} />
                        : <strong>{formData.deliveryMethod || 'Thỏa thuận trực tiếp'}</strong>
                      }
                    </p>
                  </Section>

                  {/* ĐIỀU 4: Bảo hành */}
                  <Section title="Điều 4: Bảo hành & Khiếu nại">
                    {contract.status === 'DRAFT' && isSupplier
                      ? <textarea rows={2} className="input w-full text-sm" placeholder="Ví dụ: Bảo hành 12 tháng, khiếu nại trong 7 ngày..." value={formData.warranty} onChange={e => setFormData({ ...formData, warranty: e.target.value })} />
                      : <p className="indent-8">{formData.warranty || 'Hai bên thực hiện theo quy định pháp luật hiện hành về bảo hành hàng hóa.'}</p>
                    }
                  </Section>

                  {/* ĐIỀU 5: Phạt vi phạm */}
                  <Section title="Điều 5: Phạt vi phạm & Bồi thường Thiệt hại">
                    {contract.status === 'DRAFT' && isSupplier
                      ? <textarea rows={2} className="input w-full text-sm" placeholder="Ví dụ: Phạt 8% giá trị hợp đồng nếu vi phạm..." value={formData.penalty} onChange={e => setFormData({ ...formData, penalty: e.target.value })} />
                      : <p className="indent-8">{formData.penalty || 'Bên vi phạm hợp đồng phải bồi thường thiệt hại thực tế theo quy định tại Bộ luật Dân sự 2015.'}</p>
                    }
                  </Section>

                  {/* ĐIỀU 6: Điều khoản chung */}
                  <Section title="Điều 6: Điều khoản Chung">
                    <p className="indent-8 mb-2">Hợp đồng này được lập và ký kết trên nền tảng điện tử TradeMart, có giá trị pháp lý tương đương hợp đồng bằng văn bản theo quy định của Luật Giao dịch Điện tử Việt Nam 2023.</p>
                    <p className="indent-8">Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng. Nếu không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền để giải quyết.</p>
                    {contract.status === 'DRAFT' && isSupplier && (
                      <div className="mt-3">
                        <p className="text-slate-500 text-sm mb-1">Điều khoản bổ sung khác:</p>
                        <textarea rows={3} className="input w-full text-sm" placeholder="Điều khoản bảo mật, bất khả kháng, chuyển nhượng hợp đồng..." value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} />
                      </div>
                    )}
                    {contract.status !== 'DRAFT' && contract.terms && (
                      <p className="indent-8 mt-2"><strong>Điều khoản thêm:</strong> {contract.terms}</p>
                    )}
                  </Section>

                  {/* Chữ ký */}
                  <div className="grid grid-cols-2 gap-8 mt-16 pt-10 border-t-2 border-slate-200 text-center">
                    <div>
                      <p className="font-black uppercase text-sm tracking-wider mb-1">ĐẠI DIỆN BÊN A (BÊN BÁN)</p>
                      <p className="text-xs text-slate-500 italic mb-4">(Ký tên, đóng dấu)</p>
                      <div 
                        onClick={() => canSupplierSign && setShowOtpModal(true)}
                        className={`min-h-32 border-b border-dashed flex flex-col justify-end pb-2 transition-all ${
                          canSupplierSign 
                            ? 'cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 border-2 border-indigo-200 rounded-xl' 
                            : 'border-slate-300'
                        }`}
                      >
                        {supplierSig ? (
                          <div className="flex flex-col items-center w-full">
                            <span className="font-bold text-sm text-slate-800 mb-1 leading-tight">{supplierSig.signerTitle}</span>
                            <div className="relative w-full max-w-[200px] h-28 flex items-center justify-center mx-auto mb-2">
                              {supplierSig.signatureUrl && (
                                <img src={supplierSig.signatureUrl} alt="Chữ ký" className="absolute z-20 max-h-24 max-w-full object-contain mix-blend-multiply opacity-95" />
                              )}
                              {supplierSig.stampUrl && (
                                <img src={supplierSig.stampUrl} alt="Mộc đỏ" className="absolute z-10 max-h-28 -ml-8 mt-2 opacity-90 mix-blend-multiply rotate-[-3deg]" style={{ left: '50%' }} />
                              )}
                            </div>
                            <span className="font-extrabold uppercase text-slate-900 border-t border-slate-200 pt-1 inline-block min-w-32">{supplierSig.user?.name}</span>
                            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              <ShieldCheck size={10} /> Đã xác thực điện tử
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center pb-8">
                            <span className="text-slate-300 text-sm italic">Chưa ký</span>
                            {canSupplierSign && <span className="text-[10px] text-indigo-600 font-bold mt-2 animate-pulse bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200">Bấm vào đây để Ký & Đóng dấu</span>}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-2">{contract.supplier?.name}</p>
                    </div>

                    <div>
                      <p className="font-black uppercase text-sm tracking-wider mb-1">ĐẠI DIỆN BÊN B (BÊN MUA)</p>
                      <p className="text-xs text-slate-500 italic mb-4">(Ký tên, đóng dấu)</p>
                      <div 
                        onClick={() => canBuyerSign && setShowOtpModal(true)}
                        className={`min-h-32 border-b border-dashed flex flex-col justify-end pb-2 transition-all ${
                          canBuyerSign 
                            ? 'cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 border-2 border-indigo-200 rounded-xl' 
                            : 'border-slate-300'
                        }`}
                      >
                        {buyerSig ? (
                          <div className="flex flex-col items-center w-full">
                            <span className="font-bold text-sm text-slate-800 mb-1 leading-tight">{buyerSig.signerTitle}</span>
                            <div className="relative w-full max-w-[200px] h-28 flex items-center justify-center mx-auto mb-2">
                              {buyerSig.signatureUrl && (
                                <img src={buyerSig.signatureUrl} alt="Chữ ký" className="absolute z-20 max-h-24 max-w-full object-contain mix-blend-multiply opacity-95" />
                              )}
                              {buyerSig.stampUrl && (
                                <img src={buyerSig.stampUrl} alt="Mộc đỏ" className="absolute z-10 max-h-28 -ml-8 mt-2 opacity-90 mix-blend-multiply rotate-[-3deg]" style={{ left: '50%' }} />
                              )}
                            </div>
                            <span className="font-extrabold uppercase text-slate-900 border-t border-slate-200 pt-1 inline-block min-w-32">{buyerSig.user?.name}</span>
                            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              <ShieldCheck size={10} /> Đã xác thực điện tử
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center pb-8">
                            <span className="text-slate-300 text-sm italic">Chưa ký</span>
                            {canBuyerSign && <span className="text-[10px] text-indigo-600 font-bold mt-2 animate-pulse bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200">Bấm vào đây để Ký & Đóng dấu</span>}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-2">{contract.buyer?.name}</p>
                    </div>
                  </div>

                  {/* E-Stamp khi đã ký */}
                  {contract.status === 'SIGNED' && (
                    <div className="flex justify-center mt-8">
                      <div className="border-4 border-red-600 rounded-full w-40 h-40 flex flex-col items-center justify-center text-red-600 rotate-[-15deg] opacity-80">
                        <ShieldCheck size={32} className="mb-1" />
                        <span className="text-xs font-black uppercase tracking-wider text-center leading-tight">ĐÃ KÝ<br />ĐIỆN TỬ</span>
                        <span className="text-[9px] mt-1 font-bold">TRADEMART</span>
                        <span className="text-[8px]">{new Date().toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Sign Modal */}
      <OtpSignModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSign={handleSign}
        onRequestOtp={handleRequestOtp}
        signerName={user?.name || ''}
        email={user?.email}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-black text-sm uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-1 mb-3">{title}</h3>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}
