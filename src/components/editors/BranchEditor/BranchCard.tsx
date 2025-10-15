/**
 * BranchCard Component
 * Displays an individual branch in a card format with edit/delete actions
 */

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@/components/ui';
import type { ConversationBranch, CTADefinition } from '@/types/config';

export interface BranchCardProps {
  /**
   * The branch ID
   */
  branchId: string;
  /**
   * The branch to display
   */
  branch: ConversationBranch;
  /**
   * Record of available CTAs
   */
  ctas: Record<string, CTADefinition>;
  /**
   * Callback when edit button is clicked
   */
  onEdit: () => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: () => void;
}

/**
 * BranchCard - Individual branch card display
 *
 * @example
 * ```tsx
 * <BranchCard
 *   branchId="volunteer_branch"
 *   branch={branch}
 *   ctas={ctas}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const BranchCard: React.FC<BranchCardProps> = ({
  branchId,
  branch,
  ctas,
  onEdit,
  onDelete,
}) => {
  // Get CTA labels for display
  const primaryCTALabel = branch.available_ctas.primary
    ? ctas[branch.available_ctas.primary]?.label || branch.available_ctas.primary
    : null;

  const secondaryCTALabels = branch.available_ctas.secondary
    .map((ctaId) => ctas[ctaId]?.label || ctaId)
    .filter(Boolean);

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{branchId}</CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="info" className="text-xs">
                {branch.detection_keywords.length}{' '}
                {branch.detection_keywords.length === 1 ? 'keyword' : 'keywords'}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Keywords */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Detection Keywords
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {branch.detection_keywords.slice(0, 5).map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {branch.detection_keywords.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{branch.detection_keywords.length - 5} more
              </Badge>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assigned CTAs
          </h4>
          <div className="space-y-1.5">
            {primaryCTALabel && (
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  Primary
                </Badge>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {primaryCTALabel}
                </span>
              </div>
            )}
            {secondaryCTALabels.length > 0 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs shrink-0">
                  Secondary
                </Badge>
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {secondaryCTALabels.map((label, idx) => (
                    <span
                      key={idx}
                      className="text-sm text-gray-600 dark:text-gray-400 truncate"
                    >
                      {label}
                      {idx < secondaryCTALabels.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!primaryCTALabel && secondaryCTALabels.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No CTAs assigned
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center gap-1.5"
          aria-label={`Edit branch ${branchId}`}
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-1.5"
          aria-label={`Delete branch ${branchId}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
