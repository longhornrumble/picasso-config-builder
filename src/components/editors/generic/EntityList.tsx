/**
 * EntityList - Generic List Display Component
 *
 * Displays a grid of entity cards with edit/delete actions.
 */

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent as CardContentUI, CardFooter, Button } from '@/components/ui';
import { ValidationSummaryBadge } from '@/components/validation/ValidationAlert';
import type { BaseEntity, CardContentProps, IdExtractor, NameExtractor } from '@/lib/crud/types';

export interface EntityListProps<T extends BaseEntity> {
  entities: T[];
  CardContent: React.ComponentType<CardContentProps<T>>;
  getId: IdExtractor<T>;
  getName: NameExtractor<T>;
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;
}

export function EntityList<T extends BaseEntity>({
  entities,
  CardContent,
  getId,
  getName,
  onEdit,
  onDelete,
}: EntityListProps<T>): React.ReactElement {
  return (
    <div className="grid-responsive-1-2-3">
      {entities.map((entity) => (
        <Card key={getId(entity)} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{getName(entity)}</CardTitle>
                <CardDescription>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {getId(entity)}
                  </code>
                </CardDescription>
              </div>
              <ValidationSummaryBadge entityId={getId(entity)} />
            </div>
          </CardHeader>

          <CardContentUI>
            <CardContent entity={entity} />
          </CardContentUI>

          {(onEdit || onDelete) && (
            <CardFooter className="flex gap-2 justify-end border-t pt-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(entity)}
                  className="flex items-center gap-1.5"
                  aria-label={`Edit ${getName(entity)}`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(entity)}
                  className="flex items-center gap-1.5"
                  aria-label={`Delete ${getName(entity)}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
