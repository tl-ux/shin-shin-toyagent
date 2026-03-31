import { useState } from 'react';
import { Search, User, MapPin, ChevronLeft, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CustomerSelect({ customers, selected, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">בחר לקוח</h2>
        <p className="text-sm text-muted-foreground">בחר את הלקוח שאתה מבקר</p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לקוח..."
          className="pr-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>לא נמצאו לקוחות</p>
          </div>
        )}
        {filtered.map(customer => (
          <button
            key={customer.id}
            onClick={() => onSelect(customer)}
            className={cn(
              'w-full text-right flex items-center gap-3 p-4 rounded-xl border transition-all',
              selected?.id === customer.id
                ? 'border-primary bg-accent text-primary'
                : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{customer.name}</div>
              <div className="flex items-center gap-3 mt-0.5">
                {customer.contact_name && (
                  <span className="text-xs text-muted-foreground">{customer.contact_name}</span>
                )}
                {customer.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {customer.city}
                  </span>
                )}
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}