'use client';

import { useLang } from '@/providers/LanguageProvider';

const STEP_KEYS = ['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'] as const;

const STEP_ICONS: Record<string, string> = {
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  ON_THE_WAY: '🛵',
  DELIVERED: '📦',
};

export function StatusStepper({ current }: { current: string | null | undefined }) {
  const { t } = useLang();

  const STEP_LABELS: Record<string, string> = {
    CONFIRMED: t('status_confirmed'),
    PREPARING: t('status_preparing'),
    ON_THE_WAY: t('status_on_way'),
    DELIVERED: t('status_delivered'),
  };

  if (current === 'CANCELLED') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#b24d68', fontSize: '0.95rem' }}>
        {t('status_cancelled')}
      </div>
    );
  }

  if (current === 'PENDING_PAYMENT') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
        {t('status_payment_pending')}
      </div>
    );
  }

  const currentIndex = STEP_KEYS.findIndex((k) => k === current);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, margin: '1.5rem 0', overflowX: 'auto' }}>
      {STEP_KEYS.map((key, index) => {
        const isDone = currentIndex > index;
        const isActive = currentIndex === index;

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.1rem',
                background: isDone || isActive ? 'var(--color-accent-strong)' : 'rgba(139,151,112,0.12)',
                color: isDone || isActive ? '#fff' : 'var(--color-text-muted)',
                transition: 'background 0.3s',
                boxShadow: isActive ? '0 0 0 4px rgba(207,111,148,0.2)' : 'none',
              }}>
                {isDone || isActive ? STEP_ICONS[key] : index + 1}
              </div>
              <span style={{
                fontSize: '0.7rem', letterSpacing: '0.08em',
                color: isDone || isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                textAlign: 'center', fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap',
              }}>
                {STEP_LABELS[key]}
              </span>
            </div>
            {index < STEP_KEYS.length - 1 && (
              <div style={{
                width: 48, height: 2,
                background: isDone ? 'var(--color-accent-strong)' : 'rgba(139,151,112,0.18)',
                margin: '0 4px', marginBottom: 26, transition: 'background 0.3s', flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
