import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STORE_LAT = 40.4093;
const STORE_LNG = 49.8671;

const defaultCategories = [
  {
    id: 'cat-mono',
    slug: 'mono-buketler',
    name: 'Mono Buketlər',
    description: 'Tək növ güldən hazırlanmış minimalist buketlər',
    imageUrl: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=900&q=80',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-qarisiq',
    slug: 'qarisiq-buketler',
    name: 'Qarışıq Buketlər',
    description: 'Müxtəlif güllərin uyğun birləşməsindən yaranan buketlər',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&q=80',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-premium',
    slug: 'premium-kompozisiyalar',
    name: 'Premium Kompozisiya və Buketlər',
    description: 'Seçilmiş premium güllərdən hazırlanmış lüks kompozisiyalar',
    imageUrl: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=900&q=80',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-sebet',
    slug: 'sebet-qutu-kompozisiyalar',
    name: 'Səbət və Qutuda Kompozisiyalar',
    description: 'Səbət və xüsusi qutu içində təqdim olunan gül kompozisiyaları',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-gelin',
    slug: 'gelin-buketleri',
    name: 'Gəlin Buketləri',
    description: 'Toy mərasimləri üçün xüsusi hazırlanmış gəlin buketləri',
    imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'cat-art',
    slug: 'art',
    name: 'Art',
    description: 'Floristik sənət əsərləri — klassik çərçivədən kənara çıxan kompozisiyalar',
    imageUrl: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=900&q=80',
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'cat-newborn',
    slug: 'yeni-dogulmus',
    name: 'Yeni Doğulmuş Uşaq Çıxışı',
    description: 'Yeni doğulan uşaq üçün xüsusi hazırlanmış zərif buket və kompozisiyalar',
    imageUrl: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=900&q=80',
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 'cat-yeni-il',
    slug: 'yeni-il-kompozisiyalari',
    name: 'Yeni İl Kompozisiyaları',
    description: 'Yeni il və qış mövsümü üçün xüsusi dekorlu çiçək kompozisiyaları',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80',
    sortOrder: 8,
    isActive: true,
  },
  {
    id: 'cat-novruz',
    slug: 'novruz',
    name: 'Novruz',
    description: 'Novruz bayramı ruhunu əks etdirən milli koloritli gül kompozisiyaları',
    imageUrl: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=900&q=80',
    sortOrder: 9,
    isActive: true,
  },
  {
    id: 'cat-dekor',
    slug: 'toy-ad-guunu-nisar-dekor',
    name: 'Toy, Ad günü, Nişan və Nigar Dekorları',
    description: 'Xüsusi tədbirlər üçün tam məkan bəzəyi və dekor həlləri',
    imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80',
    sortOrder: 10,
    isActive: true,
  },
];

const defaultZones = [
  {
    id: 'zone-baku-center',
    name: '0–3 km',
    centerLat: STORE_LAT,
    centerLng: STORE_LNG,
    radiusKm: 3,
    deliveryFee: 5,
    color: '#4ade80',
    isActive: true,
  },
  {
    id: 'zone-baku-north',
    name: '3–7 km',
    centerLat: STORE_LAT,
    centerLng: STORE_LNG,
    radiusKm: 7,
    deliveryFee: 7,
    color: '#86efac',
    isActive: true,
  },
  {
    id: 'zone-baku-ring-3',
    name: '7–10 km',
    centerLat: STORE_LAT,
    centerLng: STORE_LNG,
    radiusKm: 10,
    deliveryFee: 10,
    color: '#fbbf24',
    isActive: true,
  },
  {
    id: 'zone-baku-ring-4',
    name: '10–15 km',
    centerLat: STORE_LAT,
    centerLng: STORE_LNG,
    radiusKm: 15,
    deliveryFee: 15,
    color: '#fb923c',
    isActive: true,
  },
  {
    id: 'zone-baku-ring-5',
    name: '15–20 km',
    centerLat: STORE_LAT,
    centerLng: STORE_LNG,
    radiusKm: 20,
    deliveryFee: 20,
    color: '#f87171',
    isActive: true,
  },
] as const;

async function main() {
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        id: '5',
        slug: 'ivory-hydrangea',
        name: 'Krem Ortanca Kompozisiyası',
        subtitle: 'Ortanca, lisianthus və açıq zeytun yarpaqları',
        stemNote: 'Masa üstü və giriş konsolu üçün ideal',
        price: 74,
        imageUrl: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=900&q=80',
        category: 'Premium Kompozisiya və Buketlər',
        categorySlug: 'premium-kompozisiyalar',
      },
      {
        id: '6',
        slug: 'ranunculus-candlelight',
        name: 'Şam Nuru Ranunkulus',
        subtitle: 'Şaftalı və pudra tonlarında sıx ranunkulus qatları',
        stemNote: 'Axşam süfrələri üçün yumşaq parlaqlıq',
        price: 59,
        imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&q=80',
        category: 'Qarışıq Buketlər',
        categorySlug: 'qarisiq-buketler',
      },
      {
        id: '7',
        slug: 'morning-rose-box',
        name: 'Səhər Bağı Gül Qutusu',
        subtitle: 'Qutu içində yığılmış bağ gülləri və qaymaq lent detalı',
        stemNote: 'Otel qarşılama və hədiyyə təqdimatı üçün',
        price: 82,
        imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80',
        category: 'Səbət və Qutuda Kompozisiyalar',
        categorySlug: 'sebet-qutu-kompozisiyalar',
      },
      {
        id: '8',
        slug: 'pastel-tulip-cloud',
        name: 'Pastel Lalə Buludu',
        subtitle: 'Lalə, freziya və ipək kimi açılan yaz tonları',
        stemNote: 'Səhər çatdırılması üçün ən çox seçilənlərdən',
        price: 42,
        imageUrl: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=900&q=80',
        category: 'Yeni Doğulmuş Uşaq Çıxışı',
        categorySlug: 'yeni-dogulmus',
      },
      {
        id: '9',
        slug: 'olive-white-bouquet',
        name: 'Zeytun Yarpaqlı Ağ Buket',
        subtitle: 'Ağ qızılgül, anturium və zeytun yarpaqlı təmiz siluet',
        stemNote: 'Minimal interyerlər üçün sakit seçim',
        price: 77,
        imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80',
        category: 'Toy, Ad günü, Nişan və Nigar Dekorları',
        categorySlug: 'toy-ad-guunu-nisar-dekor',
      },
      {
        id: '10',
        slug: 'dinner-mini-arrangement',
        name: 'Axşam Süfrəsi Mini Aranjman',
        subtitle: 'Aşağı boylu masa kompozisiyası və şam işığına uyğun forma',
        stemNote: 'Özəl axşam yeməkləri üçün hazırlanır',
        price: 33,
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80',
        category: 'Yeni İl Kompozisiyaları',
        categorySlug: 'yeni-il-kompozisiyalari',
      },
      {
        id: '1',
        slug: 'blushing-peony',
        name: 'Pion Buketi',
        subtitle: 'Toz çəhrayı pionlar, krem tonlu qatlar və atlas lent',
        stemNote: 'Mərkəzi Bakı üzrə eyni gün təqdimat',
        price: 68,
        imageUrl: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=900&q=80',
        category: 'Mono Buketlər',
        categorySlug: 'mono-buketler',
      },
      {
        id: '2',
        slug: 'garden-rose-crown',
        name: 'Bağ Qızılgülü Tacı',
        subtitle: 'Yüngül qızılgül, gipsofila və yumşaq yaşıl vurğular',
        stemNote: 'Foto çəkiliş və nişan səhərləri üçün',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80',
        category: 'Gəlin Buketləri',
        categorySlug: 'gelin-buketleri',
      },
      {
        id: '3',
        slug: 'mint-wildflower',
        name: 'Nanəli Çiçək Dəstəsi',
        subtitle: 'Vəhşi çiçəklər, nanə tonu və sərbəst bağlanmış forma',
        stemNote: 'Sakit təşəkkür jesti üçün seçilir',
        price: 38,
        imageUrl: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=900&q=80',
        category: 'Novruz',
        categorySlug: 'novruz',
      },
      {
        id: '4',
        slug: 'dried-pampas',
        name: 'Qurudulmuş Pampas və Gül',
        subtitle: 'Uzunömürlü pampas, qurudulmuş qızılgül və lunaria',
        stemNote: 'Məkan üçün qalıcı kompozisiya',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=900&q=80',
        category: 'Art',
        categorySlug: 'art',
      },
    ],
  });

  for (const zone of defaultZones) {
    await prisma.zone.upsert({
      where: { id: zone.id },
      update: zone,
      create: zone,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
