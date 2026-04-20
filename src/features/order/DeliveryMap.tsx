'use client';

import { useEffect, useRef, useState } from 'react';

interface CourierLocation {
  lat: number;
  lng: number;
  heading: number;
}

interface DeliveryMapProps {
  destination: [number, number];
  courierLocation: CourierLocation | null;
}

export function DeliveryMap({ destination, courierLocation }: DeliveryMapProps) {
  const [MapInner, setMapInner] = useState<React.ComponentType<DeliveryMapProps> | null>(null);

  useEffect(() => {
    import('./DeliveryMapInner').then((mod) => {
      setMapInner(() => mod.DeliveryMapInner);
    });
  }, []);

  if (!MapInner) {
    return (
      <div
        style={{
          height: 400,
          borderRadius: 16,
          background: 'rgba(139,151,112,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-soft)',
          fontSize: '0.875rem',
        }}
      >
        Xəritə yüklənir…
      </div>
    );
  }

  return <MapInner destination={destination} courierLocation={courierLocation} />;
}
