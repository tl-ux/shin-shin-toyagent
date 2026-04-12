import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { key: 'new',         label: 'חדש',       color: 'border-t-blue-400' },
  { key: 'contacted',   label: 'נוצר קשר',  color: 'border-t-yellow-400' },
  { key: 'qualified',   label: 'מוכשר',     color: 'border-t-purple-400' },
  { key: 'converted',   label: 'הומר',      color: 'border-t-green-400' },
  { key: 'closed_lost', label: 'אבוד',      color: 'border-t-red-400' },
];

export default function CRMKanban({ contacts, onUpdate }) {
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    await base44.entities.CRMContact.update(draggableId, { status: destination.droppableId });
    onUpdate();
  };

  return (
    <div className="overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map(col => {
            const colContacts = contacts.filter(c => c.status === col.key);
            return (
              <div key={col.key} className="w-56 flex-shrink-0">
                <div className={cn('bg-muted rounded-t-xl border-t-4 px-3 py-2 flex items-center justify-between', col.color)}>
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-muted-foreground">{colContacts.length}</span>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'min-h-[200px] rounded-b-xl p-2 space-y-2 transition-colors',
                        snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/50'
                      )}
                    >
                      {colContacts.map((c, idx) => (
                        <Draggable key={c.id} draggableId={c.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'bg-card border border-border rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow',
                                snapshot.isDragging && 'shadow-lg rotate-1'
                              )}
                            >
                              <div className="font-semibold text-sm text-foreground leading-tight">{c.name}</div>
                              {c.company && <div className="text-xs text-muted-foreground mt-0.5">{c.company}</div>}
                              <div className="flex gap-2 mt-2">
                                {c.phone && (
                                  <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {c.email && (
                                  <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {c.source && <span className="text-xs text-muted-foreground mr-auto">{c.source}</span>}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}