/**
 * EntityNode Component
 * Individual node in the flow diagram with rich metadata, status icons, and expandable sections
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Briefcase,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  Layout,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
} from 'lucide-react';
import { Badge, TooltipProvider, Tooltip } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { EntityNodeProps, BranchMetadata, CTAMetadata, FormMetadata, ProgramMetadata, ActionChipMetadata, ShowcaseMetadata } from './types';
import { getEntityMetadata, getValidationMetadata, getEntityNavigationUrl } from './utils';

/**
 * Icon mapping for entity types
 */
const ICON_MAP = {
  Briefcase,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  Layout,
} as const;

/**
 * Icon mapping for validation status
 */
const STATUS_ICON_MAP = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  none: MinusCircle,
} as const;

/**
 * Get action type badge colors
 */
function getActionTypeBadge(actionType: 'form_trigger' | 'bedrock_query' | 'external_link') {
  switch (actionType) {
    case 'form_trigger':
      return { icon: '📋', color: 'bg-green-800 text-green-100' };
    case 'bedrock_query':
      return { icon: '🤖', color: 'bg-blue-800 text-blue-100' };
    case 'external_link':
      return { icon: '🔗', color: 'bg-orange-800 text-orange-100' };
  }
}

/**
 * EntityNode Component
 *
 * Displays an individual entity node with:
 * - Color-coded card based on entity type
 * - Rich metadata specific to entity type
 * - Status icon row with tooltips
 * - Expandable CTA lists for branches
 * - Click-to-navigate functionality
 * - Nested depth indication via left padding
 *
 * @example
 * ```tsx
 * <EntityNode
 *   node={programNode}
 *   depth={0}
 *   isExpanded={true}
 *   onToggle={(id) => toggleNode(id)}
 *   onNavigate={(node) => navigateToEntity(node)}
 * />
 * ```
 */
export const EntityNode = React.memo<EntityNodeProps>(
  ({ node, depth, isExpanded, onToggle, onNavigate }) => {
    const navigate = useNavigate();
    const metadata = getEntityMetadata(node.type);
    const validationMeta = getValidationMetadata(node.validationStatus);
    const hasChildren = node.children.length > 0;

    // Local state for expandable sections (e.g., CTA lists)
    const [ctaListExpanded, setCtaListExpanded] = useState(false);

    // Get validation messages from store
    const errors = useConfigStore((state) => state.validation.errors[node.id] || []);
    const warnings = useConfigStore((state) => state.validation.warnings[node.id] || []);

    // Get icon components
    const EntityIcon = ICON_MAP[metadata.icon as keyof typeof ICON_MAP];
    const StatusIcon = STATUS_ICON_MAP[node.validationStatus];

    /**
     * Handle node click - navigate to entity editor
     */
    const handleClick = () => {
      const url = getEntityNavigationUrl(node);
      navigate(url);
      onNavigate(node);
    };

    /**
     * Handle expand/collapse toggle
     */
    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    };

    /**
     * Build tooltip content for validation messages
     */
    const buildTooltipContent = () => {
      const allMessages = [...errors, ...warnings];
      if (allMessages.length === 0) return null;

      const displayMessages = allMessages.slice(0, 3);
      const remainingCount = allMessages.length - displayMessages.length;

      return (
        <div className="space-y-1 max-w-[300px]">
          {displayMessages.map((msg, idx) => (
            <div key={idx} className="text-xs">
              • {msg.message}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-xs italic">...and {remainingCount} more</div>
          )}
        </div>
      );
    };

    /**
     * Render rich metadata based on entity type
     */
    const renderRichMetadata = () => {
      if (!node.richMetadata) return null;

      switch (node.type) {
        case 'branch': {
          const branchMeta = node.richMetadata as BranchMetadata;
          return (
            <div className="mt-2 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {branchMeta.keywordCount} keyword{branchMeta.keywordCount !== 1 ? 's' : ''} • {branchMeta.ctaCount} CTA{branchMeta.ctaCount !== 1 ? 's' : ''}
              </div>
              {(branchMeta.primaryCTA || branchMeta.secondaryCTAs.length > 0) && (
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCtaListExpanded(!ctaListExpanded);
                    }}
                    className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {ctaListExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="font-medium">CTAs</span>
                  </button>
                  {ctaListExpanded && (
                    <div className="ml-4 space-y-2">
                      {branchMeta.primaryCTA && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            PRIMARY CTA
                          </div>
                          <CTABadge
                            id={branchMeta.primaryCTA.id}
                            label={branchMeta.primaryCTA.label}
                            actionType={branchMeta.primaryCTA.actionType}
                          />
                        </div>
                      )}
                      {branchMeta.secondaryCTAs.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            SECONDARY CTAS
                          </div>
                          <div className="space-y-1">
                            {branchMeta.secondaryCTAs.map((cta) => (
                              <CTABadge
                                key={cta.id}
                                id={cta.id}
                                label={cta.label}
                                actionType={cta.actionType}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        case 'cta': {
          const ctaMeta = node.richMetadata as CTAMetadata;
          return (
            <div className="mt-2 space-y-1">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Action: {ctaMeta.actionTypeLabel}
              </div>
              {ctaMeta.target && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  → {ctaMeta.targetLabel || ctaMeta.target}
                </div>
              )}
              {ctaMeta.additionalInfo && (
                <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {ctaMeta.additionalInfo}
                </div>
              )}
            </div>
          );
        }

        case 'form': {
          const formMeta = node.richMetadata as FormMetadata;
          return (
            <div className="mt-2 space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formMeta.fieldCount} field{formMeta.fieldCount !== 1 ? 's' : ''}
                {formMeta.hasCompositeFields && ' (includes composite fields)'}
              </div>
              {formMeta.programName && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  → Program: {formMeta.programName}
                </div>
              )}
            </div>
          );
        }

        case 'program': {
          const programMeta = node.richMetadata as ProgramMetadata;
          return (
            <div className="mt-2 space-y-1">
              {programMeta.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {programMeta.description}
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {programMeta.formCount} form{programMeta.formCount !== 1 ? 's' : ''} using this program
              </div>
            </div>
          );
        }

        case 'actionChip': {
          const chipMeta = node.richMetadata as ActionChipMetadata;
          return (
            <div className="mt-2 space-y-1">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {chipMeta.routingType === 'explicit_route' ? 'Explicit Route' : 'Smart Routing'}
              </div>
              {chipMeta.routingTarget && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  → {chipMeta.routingTarget}
                </div>
              )}
            </div>
          );
        }

        case 'showcase': {
          const showcaseMeta = node.richMetadata as ShowcaseMetadata;
          return (
            <div className="mt-2 space-y-1">
              {showcaseMeta.categoryTags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {showcaseMeta.categoryTags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {showcaseMeta.ctaCount} CTA{showcaseMeta.ctaCount !== 1 ? 's' : ''}
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    };

    /**
     * Render status icons
     */
    const renderStatusIcons = () => {
      if (!node.statusIcons || node.statusIcons.length === 0) return null;

      return (
        <div className="flex items-center gap-2">
          {node.statusIcons.map((statusIcon, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip content={statusIcon.tooltip} side="top">
                <span
                  className="text-base cursor-help"
                  style={{ fontSize: '16px' }}
                  title={statusIcon.tooltip}
                >
                  {statusIcon.icon}
                </span>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      );
    };

    return (
      <div
        className={`
          flex flex-col gap-2 p-3 sm:p-4 rounded-lg border cursor-pointer
          transition-all duration-200 hover:shadow-md touch-manipulation
          ${metadata.color.bg} ${metadata.color.border}
        `}
        style={{ marginLeft: `${Math.min(depth * 24, 48)}px` }}
        onClick={handleClick}
      >
        {/* Header Row */}
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={handleToggle}
              className={`
                flex-shrink-0 mt-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
                transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0
                flex items-center justify-center touch-manipulation
              `}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Spacer for nodes without children - hide on mobile */}
          {!hasChildren && <div className="hidden sm:block sm:w-6" />}

          {/* Entity Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <EntityIcon className={`w-5 h-5 ${metadata.color.text}`} />
          </div>

          {/* Entity Content */}
          <div className="flex-1 min-w-0">
            {/* Label and Type Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm sm:text-base ${metadata.color.text}`}>{node.label}</h4>
              {renderStatusIcons()}
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {metadata.label}
              </Badge>
              {hasChildren && (
                <Badge variant="outline" className="flex-shrink-0 text-xs">
                  {node.children.length}
                </Badge>
              )}
            </div>

            {/* Description */}
            {node.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{node.description}</p>
            )}

            {/* Entity ID (subtle) */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: {node.id}</p>

            {/* Rich Metadata */}
            {renderRichMetadata()}
          </div>

          {/* Validation Status */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
            {/* Status Icon with Tooltip */}
            <TooltipProvider>
              <Tooltip
                content={buildTooltipContent()}
                disabled={node.errorCount === 0 && node.warningCount === 0}
                side="top"
              >
                <div
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md
                    ${validationMeta.bgColor}
                  `}
                >
                  <StatusIcon className={`w-4 h-4 ${validationMeta.color}`} />
                  <span className={`text-xs font-medium ${validationMeta.color} hidden sm:inline`}>
                    {validationMeta.label}
                  </span>
                </div>
              </Tooltip>
            </TooltipProvider>

            {/* Error/Warning Count Badges */}
            {(node.errorCount > 0 || node.warningCount > 0) && (
              <div className="flex items-center gap-1">
                {node.errorCount > 0 && (
                  <Badge variant="error" className="flex-shrink-0 text-xs">
                    {node.errorCount}
                  </Badge>
                )}
                {node.warningCount > 0 && (
                  <Badge
                    variant="warning"
                    className="flex-shrink-0 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800"
                  >
                    {node.warningCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EntityNode.displayName = 'EntityNode';

/**
 * CTA Badge Component
 * Displays a clickable CTA badge with action type indicator
 */
const CTABadge: React.FC<{
  id: string;
  label: string;
  actionType: 'form_trigger' | 'bedrock_query' | 'external_link';
}> = ({ id, actionType }) => {
  const navigate = useNavigate();
  const badge = getActionTypeBadge(actionType);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/ctas?selected=${encodeURIComponent(id)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
        transition-all hover:shadow-md hover:scale-105 touch-manipulation
        min-h-[36px] sm:min-h-0
        ${badge.color}
      `}
    >
      <span>{badge.icon}</span>
      <span>{id}</span>
    </button>
  );
};
