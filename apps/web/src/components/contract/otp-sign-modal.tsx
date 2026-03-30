'use client';
import { useState, useRef, useEffect } from 'react';
import { Mail, Shield, Loader2, X, RefreshCw } from 'lucide-react';
import { SignatureCanvas } from './signature-canvas';

interface OtpSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (otp: string, signatureImage: string) => Promise<void>;
  onRequestOtp: () => Promise<{ otp?: string; email?: string; message?: string }>;
  signerName: string;
  email?: string;
}

type Step = 'request' | 'otp' | 'sign' | 'done';

export function OtpSignModal({ isOpen, onClose, onSign, onRequestOtp, signerName, email }: OtpSignModalProps) {
  const [step, setStep] = useState<Step>('request');
  const [loading, setLoading] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string>(''); // Hiển thị OTP trong chế độ dev
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('request');
      setOtpValue(['', '', '', '', '', '']);
      setDevOtp('');
      setSignatureImage('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await onRequestOtp();
      if (res?.otp) setDevOtp(res.otp); // Dev mode: hiện OTP
      setStep('otp');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể gửi OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otpValue];
    newOtp[index] = value;
    setOtpValue(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otpValue.join('');
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }
    setError('');
    setStep('sign');
  };

  const handleCanvasConfirm = (base64: string) => {
    setSignatureImage(base64);
    // Tự động submit sau khi vẽ xong
    handleFinalSign(base64);
  };

  const handleFinalSign = async (imgData: string) => {
    setLoading(true);
    setError('');
    try {
      await onSign(otpValue.join(''), imgData);
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ký tên thất bại.');
      setStep('otp'); // Quay lại bước OTP nếu lỗi
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Ký Hợp Đồng Điện Tử</h3>
              <p className="text-xs text-slate-500">Xác thực bảo mật 2 bước (OTP + Chữ ký)</p>
            </div>
          </div>
          {step !== 'done' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Steps Indicator */}
        <div className="flex border-b border-slate-100">
          {[
            { key: 'request', label: 'Gửi OTP' },
            { key: 'otp', label: 'Nhập OTP' },
            { key: 'sign', label: 'Ký tên' },
          ].map((s, i) => {
            const steps: Step[] = ['request', 'otp', 'sign', 'done'];
            const currentIdx = steps.indexOf(step);
            const stepIdx = ['request', 'otp', 'sign'].indexOf(s.key as Step);
            const isDone = currentIdx > stepIdx;
            const isActive = currentIdx === stepIdx;
            return (
              <div key={s.key} className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
                isDone ? 'border-green-500 text-green-600' :
                isActive ? 'border-indigo-600 text-indigo-700' :
                'border-transparent text-slate-400'
              }`}>
                {isDone ? '✓ ' : `${i + 1}. `}{s.label}
              </div>
            );
          })}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* STEP 1: Request OTP */}
          {step === 'request' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                <Mail size={32} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Xác thực danh tính trước khi ký</p>
                <p className="text-sm text-slate-500 mt-1">
                  Mã OTP 6 chữ số sẽ được gửi đến email của bạn.
                  <br />
                  <strong className="text-slate-700">{email || 'Email đã đăng ký'}</strong>
                </p>
              </div>
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full btn-primary bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Gửi mã OTP xác nhận
              </button>
            </div>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="font-semibold text-slate-800">Nhập mã OTP 6 chữ số</p>
                <p className="text-sm text-slate-500 mt-1">Kiểm tra email và nhập mã bên dưới (hiệu lực 10 phút)</p>
              </div>

              {/* DEV MODE: Hiện OTP */}
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-700 font-medium">🛠 DEV MODE — OTP của bạn là:</p>
                  <p className="text-3xl font-black text-amber-800 tracking-[0.3em] mt-1">{devOtp}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {otpValue.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep('request'); setOtpValue(['','','','','','']); }} className="btn-ghost border border-slate-200 text-sm">
                  <RefreshCw size={14} /> Gửi lại
                </button>
                <button onClick={handleVerifyOtp} className="flex-1 btn-primary bg-indigo-600 hover:bg-indigo-700">
                  Xác nhận OTP →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Sign Canvas */}
          {step === 'sign' && (
            <div>
              <SignatureCanvas
                signerName={signerName}
                onConfirm={handleCanvasConfirm}
                onCancel={() => setStep('otp')}
              />
              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" /> Đang ghi nhận chữ ký...
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <span className="text-5xl">✅</span>
              </div>
              <div>
                <h4 className="text-xl font-black text-green-700">Ký tên thành công!</h4>
                <p className="text-sm text-slate-500 mt-1">Chữ ký điện tử của bạn đã được ghi nhận và có hiệu lực pháp lý.</p>
              </div>
              <button onClick={onClose} className="btn-primary bg-green-600 hover:bg-green-700 mx-auto">
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
