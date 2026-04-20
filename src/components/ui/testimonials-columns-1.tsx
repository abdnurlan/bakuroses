"use client";
import React from "react";
import { motion } from "motion/react";

export type TestimonialItem = {
  text: string;
  image: string;
  name: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className} style={{ overflow: "hidden" }}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 pb-4"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name }, i) => (
              <div key={i} className="testimonials-card">
                <p className="testimonials-card__text">{text}</p>
                <div className="testimonials-card__author">
                  <img
                    width={36}
                    height={36}
                    src={image}
                    alt={name}
                    className="testimonials-card__avatar"
                  />
                  <span className="testimonials-card__name">{name}</span>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
