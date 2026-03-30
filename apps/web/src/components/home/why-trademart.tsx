import { ShieldCheck, Zap, Globe, HeadphonesIcon, TrendingUp, Lock } from 'lucide-react';

const features = [
  { icon: ShieldCheck, title: 'Doanh nghiệp đã xác thực', desc: 'Tất cả supplier đều được kiểm tra giấy phép kinh doanh, chứng nhận chất lượng trước khi hiển thị.', color: 'text-green-600 bg-green-50' },
  { icon: Zap, title: 'Kết nối nhanh', desc: 'Gửi RFQ và nhận báo giá từ nhiều supplier chỉ trong vài giờ. Tiết kiệm thời gian sourcing.', color: 'text-yellow-600 bg-yellow-50' },
  { icon: Globe, title: 'Phủ sóng toàn quốc', desc: 'Kết nối với doanh nghiệp từ 63 tỉnh thành. Tìm supplier gần nhất hoặc phù hợp nhất.', color: 'text-blue-600 bg-blue-50' },
  { icon: Lock, title: 'Ký hợp đồng an toàn', desc: 'Tạo và ký hợp đồng điện tử ngay trên nền tảng với đầy đủ điều khoản pháp lý.', color: 'text-purple-600 bg-purple-50' },
  { icon: TrendingUp, title: 'Dashboard thống kê', desc: 'Theo dõi doanh số, đơn hàng, hợp đồng và hiệu suất kinh doanh theo thời gian thực.', color: 'text-orange-600 bg-orange-50' },
  { icon: HeadphonesIcon, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn sẵn sàng hỗ trợ bạn từ tìm kiếm đến chốt giao dịch thành công.', color: 'text-primary-700 bg-primary-50' },
];

export function WhyTradeMart() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900">Tại Sao Chọn TradeMart?</h2>
          <p className="text-slate-500 text-sm mt-2">Nền tảng toàn diện cho mọi nhu cầu thương mại B2B/B2C</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group flex gap-4 p-6 rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
