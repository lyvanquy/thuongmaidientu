import Link from 'next/link';

const categories = [
  { name: 'Nông sản & Thực phẩm', icon: '🌾', slug: 'nongsanthucpham', count: '1,240+', color: 'from-green-50 to-green-100 border-green-200' },
  { name: 'Vật liệu Xây dựng', icon: '🏗️', slug: 'vatlieuXD', count: '890+', color: 'from-slate-50 to-slate-100 border-slate-200' },
  { name: 'Máy móc Thiết bị', icon: '⚙️', slug: 'maymoc', count: '670+', color: 'from-blue-50 to-blue-100 border-blue-200' },
  { name: 'Dệt may & Thời trang', icon: '👗', slug: 'detmay', count: '2,100+', color: 'from-pink-50 to-pink-100 border-pink-200' },
  { name: 'Hóa chất & Nguyên liệu', icon: '⚗️', slug: 'hochat', count: '430+', color: 'from-purple-50 to-purple-100 border-purple-200' },
  { name: 'Điện tử & Công nghệ', icon: '💻', slug: 'dientucongnghe', count: '780+', color: 'from-cyan-50 to-cyan-100 border-cyan-200' },
  { name: 'Đồ gỗ & Nội thất', icon: '🪑', slug: 'dogononthat', count: '560+', color: 'from-amber-50 to-amber-100 border-amber-200' },
  { name: 'Năng lượng', icon: '⚡', slug: 'nanglugng', count: '320+', color: 'from-yellow-50 to-yellow-100 border-yellow-200' },
];

export function CategoryGrid() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ngành Hàng Chính</h2>
            <p className="text-slate-500 text-sm mt-1">Khám phá sản phẩm theo ngành hàng</p>
          </div>
          <Link href="/categories" className="text-sm text-primary-700 font-semibold hover:underline flex items-center gap-1">
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${cat.color} border hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
              <div className="text-center">
                <p className="font-semibold text-slate-800 text-sm leading-tight">{cat.name}</p>
                <p className="text-xs text-slate-500 mt-1">{cat.count} sản phẩm</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
