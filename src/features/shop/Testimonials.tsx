"use client";
import { motion } from "motion/react";
import { useLang } from "@/providers/LanguageProvider";
import {
  TestimonialsColumn,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns-1";

export const Testimonials = () => {
  const { t } = useLang();
  const verifiedLabel = t("testimonial_verified");

  const testimonials: TestimonialItem[] = [
    {
      text: t("testimonial_1_text"),
      name: t("testimonial_1_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_2_text"),
      name: t("testimonial_2_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_3_text"),
      name: t("testimonial_3_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_4_text"),
      name: t("testimonial_4_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_5_text"),
      name: t("testimonial_5_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_6_text"),
      name: t("testimonial_6_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_7_text"),
      name: t("testimonial_7_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_8_text"),
      name: t("testimonial_8_name"),
      meta: verifiedLabel,
    },
    {
      text: t("testimonial_9_text"),
      name: t("testimonial_9_name"),
      meta: verifiedLabel,
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section id="testimonials" className="section-shell testimonials-shell" aria-labelledby="testimonials-title">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="testimonials-heading"
      >
        <span className="section-kicker">{t("testimonials_kicker")}</span>
        <h2 id="testimonials-title" className="section-title testimonials-title">
          {t("testimonials_title")}
        </h2>
        <p className="testimonials-subtitle">{t("testimonials_subtitle")}</p>
      </motion.div>

      {/* Columns */}
      <div className="testimonials-columns">
        <TestimonialsColumn testimonials={firstColumn} duration={18} />
        <TestimonialsColumn
          testimonials={secondColumn}
          duration={22}
          className="testimonials-col--md"
        />
        <TestimonialsColumn
          testimonials={thirdColumn}
          duration={16}
          className="testimonials-col--lg"
        />
      </div>
    </section>
  );
};

export default Testimonials;
