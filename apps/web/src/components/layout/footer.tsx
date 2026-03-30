import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Youtube, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary-700 text-white mt-16">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-white font-black">TM</span>
              </div>
              <span className="text-2xl font-black">Trade<span className="text-accent-300">Mart</span></span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Sàn thương mại điện tử B2B/B2C hàng đầu Việt Nam. Kết nối doanh nghiệp, tìm sản phẩm, ký hợp đồng trực tuyến.
            </p>
            <div className="flex gap-3">
              {[Facebook, Youtube, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent-300 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Doanh nghiệp */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Cho Doanh Nghiệp</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {['Đăng ký Supplier', 'Đăng sản phẩm', 'Quản lý RFQ', 'Quản lý hợp đồng', 'Dashboard thống kê'].map((item) => (
                <li key={item}><a href="#" className="hover:text-accent-300 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Mua hàng */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Cho Người Mua</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {['Tìm sản phẩm', 'Tìm nhà cung cấp', 'Gửi yêu cầu báo giá', 'Theo dõi đơn hàng', 'Hướng dẫn mua hàng'].map((item) => (
                <li key={item}><a href="#" className="hover:text-accent-300 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Liên Hệ</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 flex-shrink-0 text-accent-300" /><span>Tầng 10, 123 Nguyễn Văn Linh, Hà Nội</span></li>
              <li className="flex items-center gap-2"><Phone size={15} className="flex-shrink-0 text-accent-300" /><a href="tel:1800xxxx" className="hover:text-accent-300">1800 xxxx (Miễn phí)</a></li>
              <li className="flex items-center gap-2"><Mail size={15} className="flex-shrink-0 text-accent-300" /><a href="mailto:support@trademart.vn" className="hover:text-accent-300">support@trademart.vn</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="container-main flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <p>© 2024 TradeMart. Giấy phép ĐKKD số xxxx/GP-BTTTT.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition-colors">Quy chế sàn TMĐT</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
