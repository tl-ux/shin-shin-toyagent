import { cn } from '@/lib/utils';

export default function ProductCard({ p, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all text-right cursor-pointer"
    >
      {p.image_url ? (
        <div className="relative w-full">
          <img src={p.image_url} alt={p.name} className="w-full object-contain h-24" style={{ imageRendering: 'crisp-edges' }} />
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

        </div>
      </div>
    </div>
  );
}