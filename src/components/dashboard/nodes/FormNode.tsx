/**
 * Form Node Component
 * Visual representation of conversational forms in the flow
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ClipboardList, AlertCircle, AlertTriangle, CheckCircle, Circle, Tag } from 'lucide-react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { FlowNodeData } from '../flowUtils';

interface FormNodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

/**
 * Form Node
 *
 * Represents a conversational form in the flow.
 * Green-colored node with ClipboardList icon.
 *
 * Features:
 * - Shows form name
 * - Displays field count
 * - Shows program reference if exists
 * - Shows completion branch target
 * - Validation status indicator
 * - Orphaned state indication
 *
 * @example
 * ```tsx
 * <FormNode data={nodeData} />
 * ```
 */
export const FormNode = memo<FormNodeProps>(({ data, selected }) => {
  const { label, hasErrors, isOrphaned, validationStatus, metadata, entityData, brokenReferences } = data;

  // Validation icon
  const ValidationIcon = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    none: Circle,
  }[validationStatus];

  const validationColor = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    none: 'text-gray-400',
  }[validationStatus];

  const programId = entityData?.program_id;

  return (
    <>
      {/* Target handle (top) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Card
        className={cn(
          'min-w-[480px] max-w-[500px] border-l-4 transition-all',
          // Base styling
          'bg-green-50 dark:bg-green-900/20',
          hasErrors ? 'border-red-500' : 'border-green-500',
          isOrphaned && 'border-dashed',
          // Selected state
          selected && 'ring-2 ring-green-500 ring-offset-2',
          // Hover effect
          'hover:shadow-md'
        )}
      >
        <div className="p-4 space-y-3">
          {/* Header with icon and validation */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-green-100 dark:bg-green-800">
                <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <span className="text-base font-semibold text-green-700 dark:text-green-300">
                Form
              </span>
            </div>
            <ValidationIcon className={cn('w-4 h-4 flex-shrink-0', validationColor)} />
          </div>

          {/* Label */}
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {label}
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-1">
            {metadata?.fieldCount !== undefined && (
              <Badge variant="secondary" size="sm" className="text-sm">
                {metadata.fieldCount} fields
              </Badge>
            )}
          </div>

          {/* Program reference */}
          {programId && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Tag className="w-4 h-4" />
              <span className="truncate">{programId}</span>
            </div>
          )}

          {/* Completion branch */}
          {metadata?.targetBranch && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" size="sm" className="text-sm">
                → {metadata.targetBranch}
              </Badge>
            </div>
          )}

          {/* Broken references indicator */}
          {brokenReferences && brokenReferences.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span>{brokenReferences.length} broken reference(s)</span>
              </div>
            </div>
          )}

          {/* Orphaned indicator */}
          {isOrphaned && !brokenReferences?.length && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-1 text-sm text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Orphaned - No incoming connections</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Source handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  );
});

FormNode.displayName = 'FormNode';
