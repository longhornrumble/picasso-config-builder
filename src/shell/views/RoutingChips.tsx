/**
 * Drag-reorderable action-chip list (Overview routing). Chips are stored as a
 * dictionary whose key order is the widget render order; dragging rebuilds that
 * order via reorderChips (which registers as a pending change). Design §1 Routing.
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Zap } from 'lucide-react';
import type { ActionChip } from '@/types/config';
import { useShellStore } from '../shellStore';
import { reorderChips } from '../editors/chipOps';

function ChipRow({ id, chip }: { id: string; chip: ActionChip }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const select = useShellStore((s) => s.select);
  const selection = useShellStore((s) => s.selection);
  const selected = selection?.kind === 'chip' && selection.id === id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderColor: selected ? '#50C878' : '#E2E8F0',
        background: selected ? '#F7FDFA' : '#fff',
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-center gap-1.5 rounded-tile border px-2 py-2"
    >
      <button type="button" className="cursor-grab text-slate-300 hover:text-slate-500" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical size={13} />
      </button>
      <button type="button" onClick={() => select({ kind: 'chip', id })} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Zap size={12} className="flex-shrink-0" style={{ color: '#F59E0B' }} />
        <span className="truncate font-semibold" style={{ fontSize: '12px' }}>{chip.label || id}</span>
        {chip.target_branch && (
          <span className="ml-auto truncate font-mono" style={{ fontSize: '10px', color: '#64748B' }}>→ {chip.target_branch}</span>
        )}
      </button>
    </div>
  );
}

export function RoutingChips({ chips }: { chips: Record<string, ActionChip> }) {
  const ids = Object.keys(chips);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderChips(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5">
          {ids.map((id) => (
            <ChipRow key={id} id={id} chip={chips[id]} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
