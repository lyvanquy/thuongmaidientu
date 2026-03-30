'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      toast.success(`Chào mừng trở lại, ${res.data.user.name || res.data.user.email}! 👋`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black">TM</span>
            </div>
            <span className="text-2xl font-black text-primary-700">Trade<span className="text-accent-300">Mart</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại TradeMart</p>
        </div>

        <div className="card p-6">
          {/* Demo accounts */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-xs text-blue-700 space-y-1">
            <p className="font-semibold mb-2">🔑 Tài khoản demo:</p>
            <p>Admin: <span className="font-mono">admin@trademart.vn</span> / admin123</p>
            <p>Supplier: <span className="font-mono">supplier@trademart.vn</span> / supplier123</p>
            <p>Buyer: <span className="font-mono">buyer@trademart.vn</span> / buyer123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="filter-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="email" className="input pl-9" placeholder="email@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="filter-label">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type={showPass ? 'text' : 'password'} className="input pl-9 pr-10"
                  placeholder="Nhập mật khẩu" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Chưa có tài khoản? {' '}
            <Link href="/auth/register" className="text-primary-700 font-semibold hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
