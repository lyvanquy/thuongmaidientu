'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, FileText, Settings, LogOut, Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user) {
        router.push('/auth/login?redirect=/dashboard');
      } else if (user.role === 'BUYER') {
        // Fallback cho Buyer (chưa triển khai Buyer Dashboard riêng)
        router.push('/');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [user, mounted, router]);

  if (!mounted || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
  }

  if (user.role === 'BUYER') return null;

  const menu = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sản phẩm', href: '/dashboard/products', icon: Package },
    { name: 'Đơn hàng', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Thị trường & Báo giá', href: '/dashboard/quotations', icon: MessageSquare },
    { name: 'Hợp đồng', href: '/dashboard/contracts', icon: FileText },
    { name: 'Hồ sơ Công ty', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10 transition-transform">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary-700 to-accent-300 bg-clip-text text-transparent">
            TradeMart Seller
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hover:overscroll-contain">
          {menu.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => { clearAuth(); router.push('/auth/login'); }} className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 hidden md:flex">
          <h1 className="font-semibold text-slate-800 hidden sm:block">
            {menu.find(m => m.href === pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Region */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
