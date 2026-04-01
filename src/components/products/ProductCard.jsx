import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ProductCard({ p, onClick }) {
  const allImages = [p.image_url, ...(p.image_urls || [])].filter(Boolean);
  const [imgIndex, setImgIndex] = useState(0);

  const handleDotClick = (e, i) => {
    e.stopPropagation();
    setImgIndex(i);
  };

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all text-right cursor-pointer"
    >
      {allImages.length > 0 ? (
        <div className="relative w-full">
          <img src={allImages[imgIndex]} alt={p.name} className="w-full object-contain h-48" />
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {allImages.map((_, i) => (
                <div
                  key={i}
                  onClick={(e) => handleDotClick(e, i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors cursor-pointer',
                    i === imgIndex ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-accent to-primary/10 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary/30">{p.name[0]}</span>
        </div>
      )}
      <div className="p-3">
        <div className="font-semibold text-base leading-tight truncate text-center">{p.name}</div>
        {p.sku && <div className="text-xs text-muted-foreground mt-0.5 text-center">מק"ט: {p.sku}</div>}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary text-base">₪{(p.price || 0).toLocaleString()}</span>
          {p.stock !== null && p.stock !== undefined && (
            <span className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              p.stock === 0 ? 'bg-destructive/10 text-destructive' :
              p.stock <= 5 ? 'bg-warning/10 text-warning' :
              'bg-success/10 text-success'
            )}>
              {p.stock}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}