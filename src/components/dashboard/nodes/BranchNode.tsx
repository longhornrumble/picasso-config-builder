/**
 * Branch Node Component
 * Visual representation of conversation branches in the flow
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, AlertCircle, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { FlowNodeData } from '../flowUtils';

interface BranchNodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

/**
 * Branch Node
 *
 * Represents a conversation branch in the flow.
 * Orange-colored node with GitBranch icon.
 *
 * Features:
 * - Shows branch name
 * - Displays keyword count
 * - Shows CTA count
 * - Validation status indicator
 * - Orphaned state indication
 *
 * @example
 * ```tsx
 * <BranchNode data={nodeData} />
 * ```
 */
export const BranchNode = memo<BranchNodeProps>(({ data, selected }) => {
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
      {/* Target handle (top) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Card
        className={cn(
          'min-w-[200px] max-w-[220px] border-l-4 transition-all',
          // Base styling
          'bg-orange-50 dark:bg-orange-900/20',
          hasErrors ? 'border-red-500' : 'border-orange-500',
          isOrphaned && 'border-dashed',
          // Selected state
          selected && 'ring-2 ring-orange-500 ring-offset-2',
          // Hover effect
          'hover:shadow-md'
        )}
      >
        <div className="p-3 space-y-2">
          {/* Header with icon and validation */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-800">
                <GitBranch className="w-4 h-4 text-orange-600 dark:text-orange-300" />
              </div>
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                Branch
              </span>
            </div>
            <ValidationIcon className={cn('w-4 h-4 flex-shrink-0', validationColor)} />
          </div>

          {/* Label */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {label}
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-1">
            {metadata?.keywordCount !== undefined && (
              <Badge variant="secondary" size="sm" className="text-xs">
                {metadata.keywordCount} keywords
              </Badge>
            )}
            {metadata?.ctaCount !== undefined && metadata.ctaCount > 0 && (
              <Badge variant="secondary" size="sm" className="text-xs">
                {metadata.ctaCount} CTAs
              </Badge>
            )}
          </div>

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
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="w-3 h-3" />
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

BranchNode.displayName = 'BranchNode';
