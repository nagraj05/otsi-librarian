'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const SIZES = { sm: 14, md: 18, lg: 22 };

export function HalfStarRating({ value, onChange, size = 'md', showValue = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onChange;
  const display = hovered ?? value ?? 0;
  const px = SIZES[size];

  function fill(star: number): 'full' | 'half' | 'empty' {
    if (display >= star)       return 'full';
    if (display >= star - 0.5) return 'half';
    return 'empty';
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const f = fill(star);
        return (
          <div
            key={star}
            className={`relative shrink-0 ${interactive ? 'cursor-pointer select-none' : ''}`}
            style={{ width: px, height: px }}
            onMouseMove={interactive ? e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHovered(e.clientX < rect.left + rect.width / 2 ? star - 0.5 : star);
            } : undefined}
            onMouseLeave={interactive ? () => setHovered(null) : undefined}
            onClick={interactive ? () => {
              // clicking the already-set value clears it
              onChange(hovered === value ? null : hovered!);
            } : undefined}
          >
            {/* empty base */}
            <Star
              style={{ width: px, height: px }}
              className="absolute inset-0 text-foreground/20 fill-foreground/10"
            />
            {/* filled overlay clipped to left half or full width */}
            {f !== 'empty' && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: f === 'half' ? '50%' : '100%' }}
              >
                <Star style={{ width: px, height: px }} className="text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        );
      })}

      {showValue && value !== null && (
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
          {Number(value).toFixed(1)}
        </span>
      )}

      {interactive && value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
