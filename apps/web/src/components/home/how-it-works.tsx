import { Search, Package, MessageSquare, FileSignature, CheckCircle } from 'lucide-react';

const steps = [
  { icon: Search, title: 'Tìm Sản Phẩm', desc: 'Tìm kiếm theo ngành hàng, khu vực, giá, MOQ. Lọc supplier uy tín đã xác thực.', color: 'bg-blue-100 text-blue-600' },
  { icon: Package, title: 'Gửi Yêu Cầu RFQ', desc: 'Tạo yêu cầu báo giá (RFQ) chi tiết, gửi tới nhiều supplier cùng lúc.', color: 'bg-purple-100 text-purple-600' },
  { icon: MessageSquare, title: 'Đàm Phán & Chat', desc: 'Chat trực tiếp với supplier, nhận báo giá, đàm phán điều khoản thuận tiện.', color: 'bg-orange-100 text-orange-600' },
  { icon: FileSignature, title: 'Ký Hợp Đồng', desc: 'Tạo, duyệt và ký hợp đồng số ngay trên nền tảng. Lưu trữ lịch sử đầy đủ.', color: 'bg-green-100 text-green-600' },
  { icon: CheckCircle, title: 'Thanh Toán & Giao Hàng', desc: 'Xác nhận đơn hàng, thanh toán an toàn và theo dõi trạng thái giao hàng.', color: 'bg-primary-100 text-primary-700' },
];

export function HowItWorks() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900">Quy Trình Giao Dịch B2B</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">Từ tìm kiếm đến ký hợp đồng, chỉ trong vài bước đơn giản</p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className={`relative w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-4 shadow-sm z-10`}>
                  <step.icon size={32} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary-700 text-white text-xs rounded-full flex items-center justify-center font-bold shadow">{i + 1}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
