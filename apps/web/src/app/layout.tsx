import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: { default: 'TradeMart — Sàn Thương Mại B2B/B2C', template: '%s | TradeMart' },
  description: 'Kết nối doanh nghiệp, tìm sản phẩm, ký hợp đồng — nền tảng thương mại điện tử B2B/B2C hàng đầu Việt Nam.',
  keywords: ['thương mại điện tử', 'B2B', 'B2C', 'hợp đồng', 'supplier', 'trademart'],
  openGraph: {
    title: 'TradeMart — Sàn Thương Mại B2B/B2C',
    description: 'Kết nối doanh nghiệp, tìm sản phẩm, ký hợp đồng.',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </Providers>
      </body>
    </html>
  );
}
