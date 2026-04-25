"use client";
import React, { useRef } from "react";

export type TestimonialItem = {
  text: string;
  name: string;
  meta?: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  const duration = props.duration ?? 15;

  return (
    <div className={props.className} style={{ overflow: "hidden" }}>
      <div
        className="flex flex-col gap-4 pb-4 testimonials-scroll-track"
        style={{
          animation: `testimonials-scroll ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {[0, 1].map((pass) => (
          <React.Fragment key={pass}>
            {props.testimonials.map(({ text, name, meta }, i) => (
              <div key={`${pass}-${i}`} className="testimonials-card">
                <p className="testimonials-card__text">{text}</p>
                <div className="testimonials-card__author">
                  <span className="testimonials-card__avatar" aria-hidden="true">
                    {getInitials(name)}
                  </span>
                  <span className="testimonials-card__author-copy">
                    <span className="testimonials-card__name">{name}</span>
                    {meta && <span className="testimonials-card__meta">{meta}</span>}
                  </span>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
