/**
 * Flow Details Panel Component
 * Displays detailed information about selected flow nodes
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Node, Edge } from 'reactflow';
import {
  X,
  ExternalLink,
  ArrowRight,
  Tag,
  FileText,
  MousePointerClick,
  GitBranch,
  Zap,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import type { FlowNodeData } from './flowUtils';
import { useConfigStore } from '@/store';

interface FlowDetailsPanelProps {
  selectedNode: Node<FlowNodeData> | null;
  onClose: () => void;
  allNodes: Node<FlowNodeData>[];
  allEdges: Edge[];
}

/**
 * Flow Details Panel
 *
 * Slide-in panel showing detailed information about selected flow nodes.
 * Displays entity-specific information, connections, errors, and provides
 * quick navigation to editors.
 *
 * Features:
 * - Entity-specific layouts for Action Chips, Branches, CTAs, Forms
 * - Shows connections with arrows pointing to target entities
 * - Error/warning display with fix buttons
 * - "Edit" button navigating to appropriate editor
 * - Slide-in animation from right side
 *
 * @example
 * ```tsx
 * <FlowDetailsPanel
 *   selectedNode={node}
 *   onClose={() => setSelectedNode(null)}
 *   allNodes={nodes}
 *   allEdges={edges}
 * />
 * ```
 */
export const FlowDetailsPanel: React.FC<FlowDetailsPanelProps> = ({
  selectedNode,
  onClose,
  allNodes,
  allEdges,
}) => {
  const navigate = useNavigate();

  // Get entity data from store for lookups
  const branches = useConfigStore((state) => state.branches.branches);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const forms = useConfigStore((state) => state.forms.forms);
  const programs = useConfigStore((state) => state.programs.programs);

  if (!selectedNode) return null;

  const { data } = selectedNode;

  // Helper to get entity name by ID and type
  const getEntityName = (id: string, type: 'branch' | 'cta' | 'form' | 'program'): string => {
    switch (type) {
      case 'branch':
        return (branches[id] as any)?.name || id;
      case 'cta':
        return ctas[id]?.label || (ctas[id] as any)?.button_text || id;
      case 'form':
        return (forms[id] as any)?.form_name || forms[id]?.title || id;
      case 'program':
        return programs[id]?.program_name || id;
      default:
        return id;
    }
  };

  // Helper to navigate to editor with selected entity
  const handleEdit = () => {
    const entityId = selectedNode.id.split('-')[1]; // Remove prefix (e.g., 'branch-', 'cta-')

    const routes: Record<string, string> = {
      actionChip: '/action-chips',
      branch: `/branches?selected=${entityId}`,
      cta: `/ctas?selected=${entityId}`,
      form: `/forms?selected=${entityId}`,
    };

    const route = routes[data.entityType];
    if (route) {
      navigate(route);
    }
  };

  // Get outgoing edges (connections from this node)
  const outgoingEdges = allEdges.filter((edge) => edge.source === selectedNode.id);

  // Get incoming edges (connections to this node)
  const incomingEdges = allEdges.filter((edge) => edge.target === selectedNode.id);

  // Helper to get target node label
  const getTargetLabel = (targetId: string): string => {
    const targetNode = allNodes.find((n) => n.id === targetId);
    return targetNode?.data.label || targetId;
  };

  // Entity type icon
  const EntityIcon = {
    actionChip: Zap,
    branch: GitBranch,
    cta: MousePointerClick,
    form: ClipboardList,
  }[data.entityType];

  // Entity type color
  const entityColor = {
    actionChip: 'cyan',
    branch: 'orange',
    cta: 'purple',
    form: 'green',
  }[data.entityType];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Details panel */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800',
          'shadow-xl z-50 overflow-y-auto',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-2 rounded',
                  `bg-${entityColor}-100 dark:bg-${entityColor}-900/30`
                )}
              >
                <EntityIcon
                  className={cn('w-5 h-5', `text-${entityColor}-600 dark:text-${entityColor}-300`)}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.label}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {data.entityType.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Edit button */}
          <div className="px-4 pb-3">
            <Button onClick={handleEdit} className="w-full" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Edit in Editor
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Validation Errors/Warnings */}
          {data.brokenReferences && data.brokenReferences.length > 0 && (
            <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Issues Found ({data.brokenReferences.length})
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      This entity has broken references or validation errors.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 mb-3">
                  {data.brokenReferences.map((ref, i) => (
                    <li
                      key={i}
                      className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
                    >
                      <span className="text-red-500 font-bold">•</span>
                      <span>{ref.issue}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleEdit} className="w-full" variant="danger" size="sm">
                  Fix in Editor
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Orphan Warning */}
          {data.isOrphaned && data.entityType !== 'actionChip' && (
            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Orphaned Entity
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This entity has no incoming connections. It may be unreachable in the
                      conversation flow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entity-specific sections */}
          {data.entityType === 'actionChip' && (
            <ActionChipDetails data={data} getEntityName={getEntityName} />
          )}

          {data.entityType === 'branch' && (
            <BranchDetails
              data={data}
              getEntityName={getEntityName}
              outgoingEdges={outgoingEdges}
              getTargetLabel={getTargetLabel}
            />
          )}

          {data.entityType === 'cta' && (
            <CTADetails
              data={data}
              getEntityName={getEntityName}
              incomingEdges={incomingEdges}
              getTargetLabel={getTargetLabel}
            />
          )}

          {data.entityType === 'form' && (
            <FormDetails
              data={data}
              getEntityName={getEntityName}
              outgoingEdges={outgoingEdges}
              getTargetLabel={getTargetLabel}
            />
          )}

          {/* Connections Section */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Incoming connections */}
              {incomingEdges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Incoming ({incomingEdges.length})
                  </h4>
                  <div className="space-y-1">
                    {incomingEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span className="truncate">{getTargetLabel(edge.source)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing connections */}
              {outgoingEdges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Outgoing ({outgoingEdges.length})
                  </h4>
                  <div className="space-y-1">
                    {outgoingEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span className="truncate">{getTargetLabel(edge.target)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No connections */}
              {incomingEdges.length === 0 && outgoingEdges.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No connections
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// Entity-Specific Detail Components
// ============================================================================

interface EntityDetailsProps {
  data: FlowNodeData;
  getEntityName: (id: string, type: 'branch' | 'cta' | 'form' | 'program') => string;
}

interface ConnectionDetailsProps extends EntityDetailsProps {
  outgoingEdges?: Edge[];
  incomingEdges?: Edge[];
  getTargetLabel?: (targetId: string) => string;
}

/**
 * Action Chip Details
 */
const ActionChipDetails: React.FC<EntityDetailsProps> = ({ data, getEntityName }) => {
  const { entityData } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle size="sm">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Label/Text */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Label
          </h4>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {entityData?.label || entityData?.text || 'N/A'}
          </p>
        </div>

        {/* Target Branch */}
        {entityData?.target_branch && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Target Branch
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {getEntityName(entityData.target_branch, 'branch')}
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Branch Details
 */
const BranchDetails: React.FC<ConnectionDetailsProps> = ({
  data,
  getEntityName,
}) => {
  const { entityData } = data;
  const ctas = useConfigStore((state) => state.ctas.ctas);

  const primaryCTAs = entityData?.available_ctas?.primary || [];
  const secondaryCTAs = entityData?.available_ctas?.secondary || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle size="sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Branch Name */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Name
            </h4>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {(entityData as any)?.name || 'N/A'}
            </p>
          </div>

          {/* Keywords */}
          {entityData?.keywords && entityData.keywords.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Detection Keywords ({entityData.keywords.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {entityData.keywords.map((keyword: string, i: number) => (
                  <Badge key={i} variant="secondary" size="sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTAs */}
      {(primaryCTAs.length > 0 || secondaryCTAs.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle size="sm">Call-to-Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary CTAs */}
            {primaryCTAs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Primary CTA{primaryCTAs.length > 1 ? 's' : ''}
                </h4>
                <div className="space-y-2">
                  {primaryCTAs.map((ctaId: string) => {
                    const cta = ctas[ctaId];
                    if (!cta) return null;

                    const targetName = cta.formId
                      ? getEntityName(cta.formId, 'form')
                      : cta.target_branch
                      ? getEntityName(cta.target_branch, 'branch')
                      : null;

                    return (
                      <div key={ctaId} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{cta.action}</Badge>
                        <span className="text-gray-900 dark:text-gray-100">
                          {cta.label || (cta as any).button_text}
                        </span>
                        {targetName && (
                          <>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {targetName}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary CTAs */}
            {secondaryCTAs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Secondary CTA{secondaryCTAs.length > 1 ? 's' : ''}
                </h4>
                <div className="space-y-2">
                  {secondaryCTAs.map((ctaId: string) => {
                    const cta = ctas[ctaId];
                    if (!cta) return null;

                    const targetName = cta.formId
                      ? getEntityName(cta.formId, 'form')
                      : cta.target_branch
                      ? getEntityName(cta.target_branch, 'branch')
                      : null;

                    return (
                      <div key={ctaId} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{cta.action}</Badge>
                        <span className="text-gray-900 dark:text-gray-100">
                          {cta.label || (cta as any).button_text}
                        </span>
                        {targetName && (
                          <>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {targetName}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

/**
 * CTA Details
 */
const CTADetails: React.FC<ConnectionDetailsProps> = ({
  data,
  getEntityName,
}) => {
  const { entityData } = data;
  const branches = useConfigStore((state) => state.branches.branches);

  // Find which branch(es) reference this CTA
  const referencingBranches = Object.entries(branches)
    .filter(([_, branch]) => {
      const primaryCTAs = branch.available_ctas?.primary || [];
      const secondaryCTAs = branch.available_ctas?.secondary || [];
      const ctaId = data.entityData?.cta_id || data.label;
      return [...primaryCTAs, ...secondaryCTAs].includes(ctaId);
    })
    .map(([branchId, branch]) => ({ id: branchId, name: (branch as any).name }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle size="sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Label/Button Text */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Button Text
            </h4>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {entityData?.label || entityData?.button_text || 'N/A'}
            </p>
          </div>

          {/* Action Type */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Action Type
            </h4>
            <Badge variant="secondary">{entityData?.action || 'N/A'}</Badge>
          </div>

          {/* Target Entity */}
          {(entityData?.formId || entityData?.target_branch || entityData?.url) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Target
              </h4>
              <div className="flex items-center gap-2">
                {entityData.formId && (
                  <>
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {getEntityName(entityData.formId, 'form')}
                    </span>
                  </>
                )}
                {entityData.target_branch && (
                  <>
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {getEntityName(entityData.target_branch, 'branch')}
                    </span>
                  </>
                )}
                {entityData.url && (
                  <>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {entityData.url}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Associated Branches */}
      {referencingBranches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm">Associated Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {referencingBranches.map((branch) => (
                <div key={branch.id} className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{branch.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

/**
 * Form Details
 */
const FormDetails: React.FC<ConnectionDetailsProps> = ({
  data,
  getEntityName,
}) => {
  const { entityData } = data;

  const fields = entityData?.fields || [];
  const eligibilityGates = fields.filter((f: any) => f.eligibility_gate);

  // Group fields by type
  const fieldTypes = fields.reduce((acc: Record<string, number>, field: any) => {
    acc[field.type] = (acc[field.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle size="sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Form Name */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Form Name
            </h4>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {(entityData as any)?.form_name || entityData?.title || 'N/A'}
            </p>
          </div>

          {/* Program Reference */}
          {(entityData?.program_id || entityData?.program) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Program
              </h4>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {getEntityName(entityData.program_id || entityData.program, 'program')}
                </span>
              </div>
            </div>
          )}

          {/* Field Count */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Fields ({fields.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(fieldTypes).map(([type, count]) => (
                <Badge key={type} variant="secondary" size="sm">
                  {count as number}x {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Eligibility Gates */}
          {eligibilityGates.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Eligibility Gates ({eligibilityGates.length})
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This form has eligibility requirements that may prevent submission.
              </p>
            </div>
          )}

          {/* On Completion Branch */}
          {entityData?.on_completion_branch && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                On Completion
              </h4>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {getEntityName(entityData.on_completion_branch, 'branch')}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post-Submission Actions */}
      {entityData?.post_submission?.actions && entityData.post_submission.actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm">Post-Submission Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entityData.post_submission.actions.map((action: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{action.action}</Badge>
                  <span className="text-gray-900 dark:text-gray-100">{action.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
