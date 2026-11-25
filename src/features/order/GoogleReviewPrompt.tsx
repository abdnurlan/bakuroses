'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleLogo, Star } from '@phosphor-icons/react';

export const GOOGLE_REVIEW_URL = 'https://g.page/r/CRoOC9xGKSaFEAE/review';

/** How long the success animation plays before the review card appears. */
const SHOW_AFTER_MS = 4000;
/** Seconds the card counts down before it opens the review page by itself. */
const AUTO_OPEN_SECONDS = 8;

export function GoogleReviewPrompt() {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_OPEN_SECONDS);
  const [autoOpen, setAutoOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible || !autoOpen) return;
    if (secondsLeft <= 0) {
      // Browsers block window.open without a click, so open it in this tab.
      window.location.href = GOOGLE_REVIEW_URL;
      return;
    }
    const tick = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(tick);
  }, [visible, autoOpen, secondsLeft]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="google-review"
          role="dialog"
          aria-labelledby="google-review-title"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="google-review-card"
        >
          <div className="google-review-stars" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={20} weight="fill" />
            ))}
          </div>

          <p id="google-review-title" className="google-review-title">
            Bizi qiymətləndirin
          </p>
          <p className="google-review-text">
            Rəyiniz bizim üçün çox dəyərlidir. Bir dəqiqənizi ayırıb Google-da fikrinizi yazın.
          </p>

          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="google-review-button"
            onClick={() => setAutoOpen(false)}
          >
            <GoogleLogo size={18} weight="bold" />
            Google-da rəy yaz
          </a>

          {autoOpen ? (
            <button type="button" className="google-review-dismiss" onClick={() => setAutoOpen(false)}>
              {secondsLeft} saniyəyə açılacaq · Ləğv et
            </button>
          ) : (
            <button type="button" className="google-review-dismiss" onClick={() => setVisible(false)}>
              Bağla
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
