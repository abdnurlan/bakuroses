'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchZones, type Zone } from '@/api/zones';

interface MapPickerProps {
  className?: string;
  onPin: (lat: number, lng: number) => void;
  confirmMode?: boolean;
  onStage?: (lat: number, lng: number) => void;
}

export function MapPicker({ className, onPin, confirmMode, onStage }: MapPickerProps) {
  const [MapComponents, setMapComponents] = useState<ComponentType<MapInnerProps> | null>(null);

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
        className={className}
        style={{
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

  return <MapComponents className={className} zones={zones} onPin={onPin} confirmMode={confirmMode} onStage={onStage} />;
}

export interface MapInnerProps {
  className?: string;
  zones: Zone[];
  onPin: (lat: number, lng: number) => void;
  confirmMode?: boolean;
  onStage?: (lat: number, lng: number) => void;
}
