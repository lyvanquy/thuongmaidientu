import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TradeMart database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'lyvanquy2020@gmail.com' },
    update: {},
    create: { email: 'lyvanquy2020@gmail.com', password: adminPassword, name: 'Admin TradeMart', role: 'ADMIN' },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Categories
  const cats = [
    { name: 'Nông sản & Thực phẩm', icon: '🌾', children: ['Gạo & Ngũ cốc', 'Rau củ quả', 'Trái cây', 'Thủy hải sản'] },
    { name: 'Vật liệu xây dựng', icon: '🏗️', children: ['Xi măng & Bê tông', 'Thép xây dựng', 'Gạch & Ngói', 'Vật liệu hoàn thiện'] },
    { name: 'Máy móc thiết bị', icon: '⚙️', children: ['Máy nông nghiệp', 'Máy công nghiệp', 'Thiết bị điện', 'Phụ tùng'] },
    { name: 'Dệt may & Thời trang', icon: '👗', children: ['Vải & Nguyên liệu', 'Quần áo thành phẩm', 'Giày dép', 'Phụ kiện'] },
    { name: 'Hóa chất & Nguyên liệu', icon: '⚗️', children: ['Hóa chất công nghiệp', 'Nhựa & Cao su', 'Sơn & Phủ bề mặt'] },
    { name: 'Điện tử & Công nghệ', icon: '💻', children: ['Thiết bị điện tử', 'Linh kiện', 'Thiết bị viễn thông'] },
    { name: 'Đồ gỗ & Nội thất', icon: '🪑', children: ['Gỗ nguyên liệu', 'Nội thất văn phòng', 'Nội thất gia đình'] },
    { name: 'Năng lượng', icon: '⚡', children: ['Năng lượng mặt trời', 'Dầu & Khí', 'Pin & Ắc quy'] },
  ];

  const categories = [];
  for (const cat of cats) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();
    const parent = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: cat.name, slug, icon: cat.icon, sortOrder: cats.indexOf(cat) },
    });
    categories.push(parent);
    const children = [];
    for (let i = 0; i < cat.children.length; i++) {
      const child = cat.children[i];
      const childSlug = child.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now() + i;
      const childCat = await prisma.category.upsert({
        where: { slug: childSlug },
        update: {},
        create: { name: child, slug: childSlug, parentId: parent.id, sortOrder: i },
      });
      children.push(childCat);
    }
    categories.push(...children);
  }
  console.log('✅ Categories seeded');

  // Sample data for suppliers and buyers
  const suppliersData = [
    { email: 'supplier1@trademart.vn', name: 'Nguyễn Văn A', company: 'Công Ty TNHH Nông Sản Việt', province: 'Hà Nội', products: ['Gạo ST25', 'Cà phê Robusta'] },
    { email: 'supplier2@trademart.vn', name: 'Trần Thị B', company: 'Công Ty Cổ Phần Thủy Hải Sản', province: 'TP.HCM', products: ['Tôm sú', 'Cá basa'] },
    { email: 'supplier3@trademart.vn', name: 'Lê Văn C', company: 'Công Ty TNHH Vật Liệu Xây Dựng', province: 'Đà Nẵng', products: ['Xi măng PCB40', 'Thép xây dựng'] },
    { email: 'supplier4@trademart.vn', name: 'Phạm Thị D', company: 'Công Ty Cổ Phần Máy Móc Công Nghiệp', province: 'Hải Phòng', products: ['Máy cày', 'Máy gieo hạt'] },
    { email: 'supplier5@trademart.vn', name: 'Hoàng Văn E', company: 'Công Ty TNHH Dệt May Việt Nam', province: 'Bình Dương', products: ['Vải cotton', 'Quần áo thành phẩm'] },
  ];

  const buyersData = [
    { email: 'buyer1@trademart.vn', name: 'Vũ Thị F' },
    { email: 'buyer2@trademart.vn', name: 'Đỗ Văn G' },
    { email: 'buyer3@trademart.vn', name: 'Bùi Thị H' },
    { email: 'buyer4@trademart.vn', name: 'Ngô Văn I' },
    { email: 'buyer5@trademart.vn', name: 'Đinh Thị J' },
  ];

  const suppliers = [];
  const companies = [];

  for (const sup of suppliersData) {
    const password = await bcrypt.hash('supplier123', 12);
    const user = await prisma.user.upsert({
      where: { email: sup.email },
      update: {},
      create: { email: sup.email, password, name: sup.name, role: 'SUPPLIER' },
    });

    const slug = sup.company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now() + suppliers.length;
    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: {
        name: sup.company,
        slug,
        description: `Chuyên cung cấp ${sup.products.join(', ')} chất lượng cao.`,
        province: sup.province,
        phone: '0241234567',
        email: sup.email,
        website: `https://${slug}.vn`,
        yearFounded: 2015,
        employeeCount: '11-50',
        businessType: 'Manufacturer',
        verificationStatus: 'VERIFIED',
        users: { connect: { id: user.id } },
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { companyId: company.id } });

    // Add products
    for (const prodName of sup.products) {
      const prodSlug = prodName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now() + Math.random();
      const category = categories.find(c => c.name.includes('Nông sản') || c.name.includes('Thủy hải sản') || c.name.includes('Vật liệu') || c.name.includes('Máy móc') || c.name.includes('Dệt may'));
      await prisma.product.create({
        data: {
          name: prodName,
          slug: prodSlug,
          description: `Sản phẩm ${prodName} chất lượng cao từ ${sup.company}.`,
          price: Math.floor(Math.random() * 1000000) + 100000,
          moq: 100,
          unit: 'kg',
          province: sup.province,
          type: 'B2B',
          status: 'APPROVED',
          companyId: company.id,
          categoryId: category.id,
          images: {
            create: [
              { url: `https://example.com/${prodSlug}-1.jpg`, isPrimary: true },
              { url: `https://example.com/${prodSlug}-2.jpg` },
            ],
          },
        },
      });
    }

    suppliers.push(user);
    companies.push(company);
  }

  const buyers = [];
  for (const buy of buyersData) {
    const password = await bcrypt.hash('buyer123', 12);
    const user = await prisma.user.upsert({
      where: { email: buy.email },
      update: {},
      create: { email: buy.email, password, name: buy.name, role: 'BUYER' },
    });
    buyers.push(user);
  }

  console.log('✅ Suppliers and Buyers seeded');

  // Create RFQs
  const rfqs = [];
  for (let i = 0; i < 5; i++) {
    const buyer = buyers[i % buyers.length];
    const rfq = await prisma.rFQ.create({
      data: {
        title: `Yêu cầu báo giá ${i + 1}`,
        description: `Cần mua ${suppliersData[i % suppliersData.length].products[0]} số lượng lớn.`,
        buyerId: buyer.id,
        status: 'OPEN',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        items: {
          create: [
            {
              productName: suppliersData[i % suppliersData.length].products[0],
              quantity: 500,
              unit: 'kg',
              notes: 'Chất lượng cao',
            },
          ],
        },
      },
    });
    rfqs.push(rfq);
  }

  // Create Quotations
  for (let i = 0; i < 5; i++) {
    const rfq = rfqs[i];
    const supplier = suppliers[i % suppliers.length];
    const company = companies[i % companies.length];
    await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        supplierId: supplier.id,
        companyId: company.id,
        price: Math.floor(Math.random() * 500000) + 200000,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        message: 'Chúng tôi có thể cung cấp với giá cạnh tranh.',
        status: 'PENDING',
      },
    });
  }

  // Create Contracts
  const contracts = [];
  for (let i = 0; i < 3; i++) {
    const buyerCompany = companies[(i + 1) % companies.length]; // Assuming some companies can be buyers too
    const supplierCompany = companies[i % companies.length];
    const contract = await prisma.contract.create({
      data: {
        title: `Hợp đồng cung cấp ${i + 1}`,
        buyerId: buyerCompany.id,
        supplierId: supplierCompany.id,
        value: Math.floor(Math.random() * 10000000) + 1000000,
        terms: 'Điều khoản hợp đồng chuẩn.',
        status: 'APPROVED',
      },
    });
    contracts.push(contract);
  }

  // Create Orders
  for (let i = 0; i < 3; i++) {
    const contract = contracts[i];
    const buyer = buyers[i % buyers.length];
    const order = await prisma.order.create({
      data: {
        contractId: contract.id,
        buyerId: buyer.id,
        total: contract.value,
        subTotal: contract.value,
        status: 'PENDING',
        address: '123 Đường ABC, Quận 1, TP.HCM',
      },
    });

    // Add order items
    const products = await prisma.product.findMany({ where: { companyId: contract.supplierId } });
    if (products.length > 0) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: products[0].id,
          quantity: 100,
          price: products[0].price,
          total: products[0].price * 100,
        },
      });
    }
  }

  console.log('\n🎉 Seed hoàn thành!');
  console.log('📋 Tài khoản mẫu:');
  console.log('  Admin:    lyvanquy2020@gmail.com / admin123');
  console.log('  Suppliers: supplier1-5@trademart.vn / supplier123');
  console.log('  Buyers:    buyer1-5@trademart.vn / buyer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
