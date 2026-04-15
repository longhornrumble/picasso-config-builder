/**
 * SortableChipList - Drag-and-drop reorderable action chip list
 *
 * Uses @dnd-kit/sortable to allow reordering action chips via drag-and-drop.
 * Since chips are stored as a dictionary, reordering rebuilds the object
 * with keys in the new order.
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@/components/ui';
import { ActionChipCardContent } from './ActionChipCardContent';
import type { ActionChipEntity } from './types';

interface SortableChipItemProps {
  chip: ActionChipEntity;
  index: number;
  onEdit: (chip: ActionChipEntity) => void;
  onDelete: (chip: ActionChipEntity) => void;
}

const SortableChipItem: React.FC<SortableChipItemProps> = ({ chip, index, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chip.chipId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}>
        <CardHeader>
          <div className="flex items-start gap-2">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Reorder ${chip.label}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                  #{index + 1}
                </span>
                <CardTitle className="text-lg">{chip.label}</CardTitle>
              </div>
              <CardDescription>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {chip.chipId}
                </code>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ActionChipCardContent entity={chip} />
        </CardContent>

        <CardFooter className="flex gap-2 justify-end border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(chip)}
            className="flex items-center gap-1.5"
            aria-label={`Edit ${chip.label}`}
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(chip)}
            className="flex items-center gap-1.5"
            aria-label={`Delete ${chip.label}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

interface SortableChipListProps {
  chips: ActionChipEntity[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onEdit: (chip: ActionChipEntity) => void;
  onDelete: (chip: ActionChipEntity) => void;
}

export const SortableChipList: React.FC<SortableChipListProps> = ({
  chips,
  onReorder,
  onEdit,
  onDelete,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chips.findIndex((c) => c.chipId === active.id);
    const newIndex = chips.findIndex((c) => c.chipId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  const chipIds = chips.map((c) => c.chipId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={chipIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {chips.map((chip, index) => (
            <SortableChipItem
              key={chip.chipId}
              chip={chip}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
