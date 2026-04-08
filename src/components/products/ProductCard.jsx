import { cn } from '@/lib/utils';

export default function ProductCard({ p, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all text-right cursor-pointer"
    >
      <div className="w-full aspect-square overflow-hidden bg-gradient-to-br from-accent to-primary/10 flex items-center justify-center">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" style={{ imageRendering: 'crisp-edges' }} />
        ) : (
          <span className="text-3xl font-bold text-primary/30">{p.name[0]}</span>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-base leading-tight truncate text-center">{p.name}</div>
        {p.sku && <div className="text-xs text-muted-foreground mt-0.5 text-center">מק"ט: {p.sku}</div>}
        <div className="flex items-center justify-center mt-2">
          <span className="font-bold text-primary text-base">₪{(p.price || 0).toLocaleString()}</span>

        </div>
      </div>
    </div>
  );
}