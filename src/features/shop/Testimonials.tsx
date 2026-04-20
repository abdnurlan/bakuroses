"use client";
import { motion } from "motion/react";
import { useLang } from "@/providers/LanguageProvider";
import {
  TestimonialsColumn,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns-1";

export const Testimonials = () => {
  const { t } = useLang();

  const testimonials: TestimonialItem[] = [
    {
      text: t("testimonial_1_text"),
      image: "https://randomuser.me/api/portraits/women/21.jpg",
      name: t("testimonial_1_name"),
    },
    {
      text: t("testimonial_2_text"),
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      name: t("testimonial_2_name"),
    },
    {
      text: t("testimonial_3_text"),
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      name: t("testimonial_3_name"),
    },
    {
      text: t("testimonial_4_text"),
      image: "https://randomuser.me/api/portraits/men/53.jpg",
      name: t("testimonial_4_name"),
    },
    {
      text: t("testimonial_5_text"),
      image: "https://randomuser.me/api/portraits/women/62.jpg",
      name: t("testimonial_5_name"),
    },
    {
      text: t("testimonial_6_text"),
      image: "https://randomuser.me/api/portraits/men/71.jpg",
      name: t("testimonial_6_name"),
    },
    {
      text: t("testimonial_7_text"),
      image: "https://randomuser.me/api/portraits/women/83.jpg",
      name: t("testimonial_7_name"),
    },
    {
      text: t("testimonial_8_text"),
      image: "https://randomuser.me/api/portraits/men/14.jpg",
      name: t("testimonial_8_name"),
    },
    {
      text: t("testimonial_9_text"),
      image: "https://randomuser.me/api/portraits/women/37.jpg",
      name: t("testimonial_9_name"),
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section className="section-shell testimonials-shell">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="testimonials-heading"
      >
        <span className="section-kicker">{t("testimonials_kicker")}</span>
        <h2 className="section-title testimonials-title">
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
