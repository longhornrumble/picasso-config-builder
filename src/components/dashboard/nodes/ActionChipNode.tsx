/**
 * Action Chip Node Component
 * Visual representation of action chips in the conversation flow
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, AlertCircle, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { FlowNodeData } from '../flowUtils';

interface ActionChipNodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

/**
 * Action Chip Node
 *
 * Represents an action chip entry point in the conversation flow.
 * Cyan-colored node with Zap icon.
 *
 * Features:
 * - Shows chip label/text
 * - Displays target_branch badge if set
 * - Validation status indicator
 * - Orphaned state indication (dashed border)
 *
 * @example
 * ```tsx
 * <ActionChipNode data={nodeData} />
 * ```
 */
export const ActionChipNode = memo<ActionChipNodeProps>(({ data, selected }) => {
  const { label, hasErrors, isOrphaned, validationStatus, metadata, brokenReferences } = data;

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

  return (
    <>
      {/* Target handle (top) - for incoming edges */}
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Card
        className={cn(
          'min-w-[200px] max-w-[220px] border-l-4 transition-all',
          // Base styling
          'bg-cyan-50 dark:bg-cyan-900/20',
          hasErrors ? 'border-red-500' : 'border-cyan-500',
          isOrphaned && 'border-dashed',
          // Selected state
          selected && 'ring-2 ring-cyan-500 ring-offset-2',
          // Hover effect
          'hover:shadow-md'
        )}
      >
        <div className="p-3 space-y-2">
          {/* Header with icon and validation */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-100 dark:bg-cyan-800">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
              </div>
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                Action Chip
              </span>
            </div>
            <ValidationIcon className={cn('w-4 h-4 flex-shrink-0', validationColor)} />
          </div>

          {/* Label */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {label}
          </div>

          {/* Metadata badges */}
          {metadata?.targetBranch && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" size="sm" className="text-xs">
                → {metadata.targetBranch}
              </Badge>
            </div>
          )}

          {/* Broken references indicator */}
          {brokenReferences && brokenReferences.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-3 h-3" />
                <span>{brokenReferences.length} broken reference(s)</span>
              </div>
            </div>
          )}

          {/* Orphaned indicator */}
          {isOrphaned && !brokenReferences?.length && (
            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>No incoming</span>
            </div>
          )}
        </div>
      </Card>

      {/* Source handle (bottom) - for outgoing edges */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  );
});

ActionChipNode.displayName = 'ActionChipNode';
