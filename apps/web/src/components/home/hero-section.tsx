'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '10,000+', label: 'Sản phẩm' },
  { value: '2,500+', label: 'Doanh nghiệp' },
  { value: '500+', label: 'Ngành hàng' },
  { value: '50,000+', label: 'Giao dịch' },
];

export function HeroSection() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'product' | 'company'>('product');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(tab === 'product'
      ? `/products?search=${encodeURIComponent(search)}`
      : `/companies?search=${encodeURIComponent(search)}`
    );
  };

  return (
    <section className="hero-gradient text-white relative overflow-hidden min-h-[520px] flex items-center">
      {/* BG decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-accent-300/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl" />
      </div>

      <div className="container-main relative z-10 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm font-medium mb-6 border border-white/20">
              <Zap size={14} className="text-accent-300" />
              Nền tảng thương mại B2B/B2C #1 Việt Nam
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              Kết Nối Doanh Nghiệp,<br />
              <span className="text-accent-300">Chốt Giao Dịch</span> Nhanh
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-xl mx-auto">
              Tìm sản phẩm, kết nối supplier uy tín, gửi RFQ, đàm phán và ký hợp đồng — tất cả trên một nền tảng.
            </p>
          </motion.div>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-1.5 shadow-2xl"
          >
            {/* Tabs */}
            <div className="flex gap-1 mb-1 px-1 pt-1">
              {[
                { key: 'product', label: '📦 Tìm Sản Phẩm' },
                { key: 'company', label: '🏢 Tìm Doanh Nghiệp' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-primary-700 text-white shadow'
                      : 'text-slate-600 hover:text-primary-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 px-1 pb-1">
              <div className="flex-1 flex items-center gap-2 px-4 bg-slate-50 rounded-xl">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tab === 'product' ? 'Gạo ST25, thép xây dựng, máy CNC...' : 'Công ty TNHH, nhà máy dệt may, xuất khẩu...'}
                  className="w-full py-3 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3 rounded-xl">
                Tìm kiếm
                <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>

          {/* Popular tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            <span className="text-xs text-slate-300">Tìm kiếm phổ biến:</span>
            {['Gạo xuất khẩu', 'Thép hộp', 'Máy nông nghiệp', 'Vải thun', 'Xi măng'].map((t) => (
              <button
                key={t}
                onClick={() => { setSearch(t); }}
                className="text-xs text-slate-200 hover:text-accent-300 underline-offset-2 hover:underline transition-colors"
              >
                {t}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
              <p className="text-3xl font-black text-accent-300">{s.value}</p>
              <p className="text-xs text-slate-300 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
