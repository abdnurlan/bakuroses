import { HeroCanvasScrub } from '@/features/hero/HeroCanvasScrub';
import { BotanicalBanner } from '@/features/shop/BotanicalBanner';
import { ProductGrid } from '@/features/shop/ProductGrid';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';

const SIGNATURE_DETAILS = [
  { value: 'Eyni Gün', label: 'Mərkəzi Bakı üzrə çatdırılma' },
  { value: 'Şəxsi', label: 'Otel və yaşayış ünvanına təqdimat' },
  { value: 'Xüsusi', label: 'Rəng palitrasına uyğun kompozisiya' },
];

const EDITORIAL_BLOCKS = [
  {
    eyebrow: 'Atelye Xidməti',
    title: 'Hər şey çoxluqla deyil, ölçü ilə qurulur.',
    copy: 'Buketləri siluet, boşluq və sapların hərəkəti üzərində qururuq ki, kompozisiya hər bucaqdan sakit və zərif görünsün.',
  },
  {
    eyebrow: 'İmza Təqdimatı',
    title: 'Hədiyyə hissi, buket qapıya çatmamış başlayır.',
    copy: 'Kağız, atlas lent, qeyd kartı və vazaya uyğun təqdimat bizim üçün sonradan əlavə olunan detal deyil, məhsulun bir hissəsidir.',
  },
  {
    eyebrow: 'Məkan Üçün',
    title: 'Dəhliz, masa, suit otaq və yataq kənarı üçün düşünülür.',
    copy: 'Hər ölçü onun yaşayacağı məkana görə seçilir; sakit jestlərdən girişdə vurğu yaradan böyük kompozisiyalara qədər.',
  },
];

const OCCASIONS = [
  'Özəl axşam yeməkləri və masa tərtibatı',
  'Ad günü səhər çatdırılmaları',
  'Otel qarşılama və concierge hədiyyələri',
  'Üzr və təşəkkür üçün sakit buketlər',
];

export default function HomePage() {
  return (
    <main>
      <HeroCanvasScrub />

      <section className="section-shell section-intro">
        <RevealOnScroll variant="fade">
          <div className="section-heading">
            <p className="section-kicker">Seçilmiş Özəl Anlar Üçün</p>
            <AnimatedTitleReveal
              as="h2"
              className="section-title"
              text="Hədiyyə etmək, qarşılamaq və xatırlamaq üçün daha zərif bir gül dili."
            />
            <p className="section-copy">
              Hər buket qalereya dəqiqliyi ilə qurulur: seçilmiş güllər, ton içində rəng palitrası və geniş nəfəs alan kompozisiya sayəsində heç nə artıq görünmür.
            </p>
          </div>
        </RevealOnScroll>
      </section>

      <RevealOnScroll variant="fade">
        <BotanicalBanner />
      </RevealOnScroll>

      <section className="section-shell atelier-shell">
        <div className="atelier-grid">
          <RevealOnScroll variant="slide-up">
            <article className="atelier-feature-card">
              <p className="section-kicker">Evin İmzası</p>
              <AnimatedTitleReveal
                as="h2"
                className="section-title atelier-title"
                text="Kütləvi deyil, seçilərək hazırlanmış gül obyektləri."
              />
              <p className="section-copy atelier-copy">
                Studiyamızın yanaşması adi floristika deyil, daha çox editorial səhnə quruluşuna yaxındır. Tonal ləçəklər, nəfəs alan boşluqlar və yumşaq siluet daha sakit bir lüks hissi yaradır.
              </p>

              <div className="signature-detail-grid">
                {SIGNATURE_DETAILS.map((detail) => (
                  <div key={detail.label} className="signature-detail-card">
                    <span className="signature-detail-value">{detail.value}</span>
                    <span className="signature-detail-label">{detail.label}</span>
                  </div>
                ))}
              </div>
            </article>
          </RevealOnScroll>

          <div className="atelier-stack">
            {EDITORIAL_BLOCKS.map((block, index) => (
              <RevealOnScroll key={block.title} variant="slide-up" delay={index * 0.06}>
                <article className="atelier-mini-card">
                  <p className="atelier-mini-eyebrow">{block.eyebrow}</p>
                  <AnimatedTitleReveal
                    as="h3"
                    className="atelier-mini-title"
                    delay={index * 0.04}
                    text={block.title}
                  />
                  <p className="atelier-mini-copy">{block.copy}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="collection" className="section-shell collection-shell">
        <RevealOnScroll variant="fade" style={{ marginBottom: '4rem' }}>
          <div className="section-heading">
            <p className="section-kicker">Kolleksiya</p>
            <AnimatedTitleReveal
              as="h2"
              className="section-title"
              text="Boutique yaxınlığı ilə qurulan editorial buketlər."
            />
            <p className="section-copy">
              Müasir mənzillər, otel suitləri, şam süfrələri və Bakı üzrə düşünülmüş çatdırılmalar üçün hazırlanıb.
            </p>
          </div>
        </RevealOnScroll>

        <ProductGrid />
      </section>

      <section className="section-shell occasions-shell">
        <RevealOnScroll variant="fade">
          <div className="occasions-panel">
            <div className="occasions-copy">
              <p className="section-kicker">Nə Zaman Göndərməli</p>
              <AnimatedTitleReveal
                as="h2"
                className="section-title occasions-title"
                text="Adi buketdən daha çoxunu haqq edən anlar üçün hazırlanıb."
              />
            </div>

            <div className="occasion-list">
              {OCCASIONS.map((occasion) => (
                <div key={occasion} className="occasion-pill">
                  {occasion}
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <footer className="site-footer">
        <span className="site-footer-mark">Baku Roses</span>
        <span className="site-footer-copy">
          © {new Date().getFullYear()} · Bütün hüquqlar qorunur
        </span>
      </footer>
    </main>
  );
}
