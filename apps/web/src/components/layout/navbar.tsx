'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Heart, User, ChevronDown, Building2, Package, FileText, ShoppingCart, MessageCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { NotificationBell } from './notification-bell';

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top bar */}
      <div className="bg-primary-700 text-white text-xs py-1.5">
        <div className="container-main flex justify-between items-center">
          <span>🇻🇳 Sàn thương mại B2B/B2C hàng đầu Việt Nam</span>
          <div className="flex gap-4">
            <Link href="/auth/register?role=SUPPLIER" className="hover:text-accent-300 transition-colors">Đăng ký Doanh nghiệp</Link>
            <Link href="/auth/login" className="hover:text-accent-300 transition-colors">Đăng nhập</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container-main py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm">TM</span>
            </div>
            <div>
              <span className="text-xl font-black text-primary-700">Trade</span>
              <span className="text-xl font-black text-accent-300">Mart</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm, doanh nghiệp, ngành hàng..."
                className="flex-1 px-4 py-2.5 border border-slate-300 border-r-0 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button type="submit" className="px-5 py-2.5 bg-primary-700 text-white rounded-r-xl hover:bg-primary-600 transition-colors flex items-center gap-2">
                <Search size={16} />
                <span className="hidden sm:inline text-sm font-medium">Tìm kiếm</span>
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Link href="/chat" className="btn-ghost text-slate-600 relative" title="Đàm phán">
                  <MessageCircle size={20} />
                </Link>
                <Link href="/favorites" className="btn-ghost text-slate-600 relative">
                  <Heart size={20} />
                </Link>
                <Link href="/checkout" className="btn-ghost relative" title="Giỏ hàng">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-300 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{cartCount > 9 ? '9+' : cartCount}</span>
                  )}
                </Link>
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-semibold text-slate-800">{user?.name || 'Tài khoản'}</p>
                      <p className="text-[10px] text-slate-500">{user?.role}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <p className="font-semibold text-sm text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                          <User size={15} /> Trang cá nhân
                        </Link>
                        <Link href="/chat" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                          <MessageCircle size={15} /> Đàm phán B2B
                        </Link>
                        <Link href="/contracts" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                          <FileText size={15} /> Hợp đồng của tôi
                        </Link>
                        {user?.role === 'SUPPLIER' && (
                          <>
                            <div className="mx-4 my-1 border-t border-slate-100" />
                            <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                              <Building2 size={15} /> Supplier Dashboard
                            </Link>
                            <Link href="/dashboard/products" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                              <Package size={15} /> Quản lý sản phẩm
                            </Link>
                          </>
                        )}
                        {user?.role === 'ADMIN' && (
                          <>
                            <div className="mx-4 my-1 border-t border-slate-100" />
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                              <Building2 size={15} /> Admin Panel
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                          <LogOut size={15} /> Đăng xuất
                        </button>
                      </div>
                    </div>

                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login" className="btn-outline text-sm py-2 px-4">Đăng nhập</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { label: '🌾 Nông sản', href: '/products?category=nongsanthucpham' },
            { label: '🏗️ Vật liệu XD', href: '/products?category=vatlieuXD' },
            { label: '⚙️ Máy móc', href: '/products?category=maymoc' },
            { label: '👗 Dệt may', href: '/products?category=detmay' },
            { label: '⚗️ Hóa chất', href: '/products?category=hochat' },
            { label: '💻 Điện tử', href: '/products?category=dientucongnghe' },
            { label: '🪑 Đồ gỗ', href: '/products?category=dogononthat' },
            { label: '⚡ Năng lượng', href: '/products?category=nanglugng' },
            { label: '🏢 Doanh nghiệp', href: '/companies' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-all font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
