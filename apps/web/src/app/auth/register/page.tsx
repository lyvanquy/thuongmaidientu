'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'BUYER';
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', role: defaultRole });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      toast.success('Đăng ký thành công! Chào mừng bạn đến với TradeMart 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black">TM</span>
            </div>
            <span className="text-2xl font-black text-primary-700">Trade<span className="text-accent-300">Mart</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Tham gia cộng đồng thương mại B2B/B2C</p>
        </div>

        <div className="card p-6">
          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            {[
              { value: 'BUYER', label: '🛒 Người mua', desc: 'Tìm kiếm & đặt hàng' },
              { value: 'SUPPLIER', label: '🏭 Nhà cung cấp', desc: 'Bán hàng & ký HĐ' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setForm(f => ({ ...f, role: r.value }))}
                className={`flex-1 py-2.5 px-3 rounded-lg text-left transition-all ${
                  form.role === r.value
                    ? 'bg-white shadow-sm border border-slate-200'
                    : 'hover:bg-white/50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="filter-label">Họ và tên</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="Nguyễn Văn A" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="filter-label">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="email" className="input pl-9" placeholder="email@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="filter-label">Số điện thoại</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="0901234567" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="filter-label">Mật khẩu *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type={showPass ? 'text' : 'password'} className="input pl-9 pr-10"
                  placeholder="Ít nhất 6 ký tự" minLength={6} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Đã có tài khoản? {' '}
            <Link href="/auth/login" className="text-primary-700 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
