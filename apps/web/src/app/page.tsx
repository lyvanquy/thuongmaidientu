import { HeroSection } from '@/components/home/hero-section';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { FeaturedCompanies } from '@/components/home/featured-companies';
import { WhyTradeMart } from '@/components/home/why-trademart';
import { HowItWorks } from '@/components/home/how-it-works';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TradeMart — Sàn Thương Mại B2B/B2C Hàng Đầu Việt Nam',
  description: 'Tìm sản phẩm, kết nối doanh nghiệp, ký hợp đồng trực tuyến. Nền tảng thương mại điện tử B2B/B2C toàn diện.',
};

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts />
      <HowItWorks />
      <FeaturedCompanies />
      <WhyTradeMart />
    </div>
  );
}
