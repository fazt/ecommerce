'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
}: {
  images: Array<{ url: string; alt: string | null; position: number }>;
}) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState(0);
  if (sorted.length === 0) {
    return <div className="aspect-square rounded-lg bg-muted" />;
  }
  const current = sorted[active] ?? sorted[0]!;
  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt ?? ''} className="h-full w-full object-cover" />
      </div>
      {sorted.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {sorted.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className={cn(
                'aspect-square overflow-hidden rounded-md border bg-muted transition-all hover:opacity-80',
                active === i && 'ring-2 ring-foreground ring-offset-2',
              )}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}