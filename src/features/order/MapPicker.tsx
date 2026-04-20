'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchZones, type Zone } from '@/api/zones';

interface MapPickerProps {
  onPin: (lat: number, lng: number) => void;
}

export function MapPicker({ onPin }: MapPickerProps) {
  const [MapComponents, setMapComponents] = useState<React.ComponentType<MapInnerProps> | null>(null);

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: fetchZones,
  });

  useEffect(() => {
    import('./MapPickerInner').then((mod) => {
      setMapComponents(() => mod.MapPickerInner);
    });
  }, []);

  if (!MapComponents) {
    return (
      <div
        style={{
          height: 350,
          borderRadius: 16,
          background: 'rgba(139,151,112,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-soft)',
          fontSize: '0.875rem',
          letterSpacing: '0.06em',
        }}
      >
        Xəritə yüklənir…
      </div>
    );
  }

  return <MapComponents zones={zones} onPin={onPin} />;
}

export interface MapInnerProps {
  zones: Zone[];
  onPin: (lat: number, lng: number) => void;
}
