import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
        category: 'Kompozisiya',
      },
      {
        id: '6',
        slug: 'ranunculus-candlelight',
        name: 'Şam Nuru Ranunkulus',
        subtitle: 'Şaftalı və pudra tonlarında sıx ranunkulus qatları',
        stemNote: 'Axşam süfrələri üçün yumşaq parlaqlıq',
        price: 59,
        imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&q=80',
        category: 'Buket',
      },
      {
        id: '7',
        slug: 'morning-rose-box',
        name: 'Səhər Bağı Gül Qutusu',
        subtitle: 'Qutu içində yığılmış bağ gülləri və qaymaq lent detalı',
        stemNote: 'Otel qarşılama və hədiyyə təqdimatı üçün',
        price: 82,
        imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80',
        category: 'Qutu',
      },
      {
        id: '8',
        slug: 'pastel-tulip-cloud',
        name: 'Pastel Lalə Buludu',
        subtitle: 'Lalə, freziya və ipək kimi açılan yaz tonları',
        stemNote: 'Səhər çatdırılması üçün ən çox seçilənlərdən',
        price: 42,
        imageUrl: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=900&q=80',
        category: 'Yaz',
      },
      {
        id: '9',
        slug: 'olive-white-bouquet',
        name: 'Zeytun Yarpaqlı Ağ Buket',
        subtitle: 'Ağ qızılgül, anturium və zeytun yarpaqlı təmiz siluet',
        stemNote: 'Minimal interyerlər üçün sakit seçim',
        price: 77,
        imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80',
        category: 'Ağ Ton',
      },
      {
        id: '10',
        slug: 'dinner-mini-arrangement',
        name: 'Axşam Süfrəsi Mini Aranjman',
        subtitle: 'Aşağı boylu masa kompozisiyası və şam işığına uyğun forma',
        stemNote: 'Özəl axşam yeməkləri üçün hazırlanır',
        price: 33,
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80',
        category: 'Masa',
      },
      {
        id: '1',
        slug: 'blushing-peony',
        name: 'Pion Buketi',
        subtitle: 'Toz çəhrayı pionlar, krem tonlu qatlar və atlas lent',
        stemNote: 'Mərkəzi Bakı üzrə eyni gün təqdimat',
        price: 68,
        imageUrl: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=900&q=80',
        category: 'Buket',
      },
      {
        id: '2',
        slug: 'garden-rose-crown',
        name: 'Bağ Qızılgülü Tacı',
        subtitle: 'Yüngül qızılgül, gipsofila və yumşaq yaşıl vurğular',
        stemNote: 'Foto çəkiliş və nişan səhərləri üçün',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80',
        category: 'Tac',
      },
      {
        id: '3',
        slug: 'mint-wildflower',
        name: 'Nanəli Çiçək Dəstəsi',
        subtitle: 'Vəhşi çiçəklər, nanə tonu və sərbəst bağlanmış forma',
        stemNote: 'Sakit təşəkkür jesti üçün seçilir',
        price: 38,
        imageUrl: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=900&q=80',
        category: 'Dəstə',
      },
      {
        id: '4',
        slug: 'dried-pampas',
        name: 'Qurudulmuş Pampas və Gül',
        subtitle: 'Uzunömürlü pampas, qurudulmuş qızılgül və lunaria',
        stemNote: 'Məkan üçün qalıcı kompozisiya',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=900&q=80',
        category: 'Quru',
      },
    ],
  });

  await prisma.zone.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'zone-baku-center',
        name: 'Bakı Mərkəz',
        centerLat: 40.4093,
        centerLng: 49.8671,
        radiusKm: 5,
        color: '#cf6f94',
        isActive: true,
      },
      {
        id: 'zone-baku-north',
        name: 'Bakı Şimal',
        centerLat: 40.4393,
        centerLng: 49.8871,
        radiusKm: 4,
        color: '#8b9770',
        isActive: true,
      },
    ],
  });

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
