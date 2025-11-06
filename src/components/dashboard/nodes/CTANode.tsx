/**
 * CTA Node Component
 * Visual representation of call-to-action buttons in the flow
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  MousePointerClick,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Circle,
  FileText,
  ExternalLink,
  Info,
  GitBranch,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { FlowNodeData } from '../flowUtils';

interface CTANodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

/**
 * CTA Node
 *
 * Represents a call-to-action button in the conversation flow.
 * Purple-colored node with action type indication.
 *
 * Features:
 * - Shows CTA label/button text
 * - Displays action type badge
 * - Shows target (form or branch name)
 * - Validation status indicator
 * - Orphaned state indication
 *
 * @example
 * ```tsx
 * <CTANode data={nodeData} />
 * ```
 */
export const CTANode = memo<CTANodeProps>(({ data, selected }) => {
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

  // Action type icon and label
  const actionTypeConfig = {
    start_form: {
      icon: FileText,
      label: 'Start Form',
      color: 'text-purple-600 dark:text-purple-300',
    },
    external_link: {
      icon: ExternalLink,
      label: 'External Link',
      color: 'text-blue-600 dark:text-blue-300',
    },
    show_info: {
      icon: Info,
      label: 'Show Info',
      color: 'text-indigo-600 dark:text-indigo-300',
    },
    target_branch: {
      icon: GitBranch,
      label: 'To Branch',
      color: 'text-orange-600 dark:text-orange-300',
    },
  };

  const actionType = metadata?.actionType || 'show_info';
  const ActionTypeIcon = actionTypeConfig[actionType as keyof typeof actionTypeConfig]?.icon || Info;
  const actionLabel = actionTypeConfig[actionType as keyof typeof actionTypeConfig]?.label || actionType;

  // Get target display name
  const getTargetDisplay = () => {
    if (actionType === 'start_form' && entityData?.formId) {
      return entityData.formId;
    }
    if (actionType === 'target_branch' && entityData?.target_branch) {
      return entityData.target_branch;
    }
    if (actionType === 'external_link' && entityData?.url) {
      const url = entityData.url;
      try {
        return new URL(url).hostname;
      } catch {
        return url.substring(0, 20) + '...';
      }
    }
    return null;
  };

  const targetDisplay = getTargetDisplay();

  return (
    <>
      {/* Target handle (top) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Card
        className={cn(
          'min-w-[200px] max-w-[220px] border-l-4 transition-all',
          // Base styling
          'bg-purple-50 dark:bg-purple-900/20',
          hasErrors ? 'border-red-500' : 'border-purple-500',
          isOrphaned && 'border-dashed',
          // Selected state
          selected && 'ring-2 ring-purple-500 ring-offset-2',
          // Hover effect
          'hover:shadow-md'
        )}
      >
        <div className="p-3 space-y-2">
          {/* Header with icon and validation */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-800">
                <MousePointerClick className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              </div>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                CTA
              </span>
            </div>
            <ValidationIcon className={cn('w-4 h-4 flex-shrink-0', validationColor)} />
          </div>

          {/* Label */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {label}
          </div>

          {/* Action type badge */}
          <div className="flex items-center gap-1">
            <ActionTypeIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{actionLabel}</span>
          </div>

          {/* Target display */}
          {targetDisplay && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" size="sm" className="text-xs truncate max-w-full">
                → {targetDisplay}
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

CTANode.displayName = 'CTANode';
