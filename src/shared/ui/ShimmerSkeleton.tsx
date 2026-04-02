import { CSSProperties } from 'react';

interface Props {
  style?: CSSProperties;
  className?: string;
}

export function ShimmerSkeleton({ style, className }: Props) {
  return (
    <div
      className={`shimmer ${className ?? ''}`}
      style={{ borderRadius: '4px', ...style }}
    />
  );
}
