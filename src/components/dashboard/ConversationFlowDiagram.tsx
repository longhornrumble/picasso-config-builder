/**
 * Conversation Flow Diagram Component
 * ReactFlow-based visual representation of conversation journey
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useConfigStore } from '@/store';
import {
  buildConversationFlow,
  getLayoutedElements,
  detectOrphanedNodes,
  detectBrokenReferences,
  markOrphanedNodes,
  markBrokenReferences,
  type FlowNodeData,
} from './flowUtils';
import { ActionChipNode } from './nodes/ActionChipNode';
import { BranchNode } from './nodes/BranchNode';
import { CTANode } from './nodes/CTANode';
import { FormNode } from './nodes/FormNode';
import { FlowDetailsPanel } from './FlowDetailsPanel';
import { useNavigate } from 'react-router-dom';

// Define custom node types for ReactFlow
const nodeTypes: NodeTypes = {
  actionChip: ActionChipNode,
  branch: BranchNode,
  cta: CTANode,
  form: FormNode,
};

/**
 * Conversation Flow Diagram
 *
 * Visual representation of conversation journey using ReactFlow.
 * Shows the flow: Action Chips → Branches → CTAs → Forms/Actions
 *
 * Features:
 * - Auto-layout using dagre algorithm
 * - Interactive zoom and pan
 * - Mini-map for navigation
 * - Validation status indicators
 * - Orphaned node detection
 * - Broken reference detection
 * - Color-coded entity types
 * - Click to navigate to editor
 *
 * @example
 * ```tsx
 * <ConversationFlowDiagram />
 * ```
 */
export const ConversationFlowDiagram: React.FC = () => {
  const navigate = useNavigate();

  // Get config data from store
  const actionChips = useConfigStore((state) => state.config.baseConfig?.action_chips?.default_chips || {});
  const branches = useConfigStore((state) => state.branches.branches);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const forms = useConfigStore((state) => state.forms.forms);
  const programs = useConfigStore((state) => state.programs.programs);
  const validationErrors = useConfigStore((state) => state.validation.errors);
  const validationWarnings = useConfigStore((state) => state.validation.warnings);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayouted, setIsLayouted] = useState(false);

  // Selected node for details panel
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);

  // Build and layout the flow graph
  useEffect(() => {
    // Build initial graph
    const { nodes: initialNodes, edges: initialEdges } = buildConversationFlow(
      actionChips,
      branches,
      ctas,
      forms,
      validationErrors,
      validationWarnings
    );

    // Detect orphaned nodes
    const orphanIds = detectOrphanedNodes(initialNodes, initialEdges);

    // Detect broken references
    const brokenRefs = detectBrokenReferences(initialNodes, initialEdges, {
      actionChips,
      branches,
      ctas,
      forms,
      programs,
    });

    // Mark orphaned nodes
    const nodesWithOrphans = markOrphanedNodes(initialNodes, orphanIds);

    // Mark broken references
    const nodesWithErrors = markBrokenReferences(nodesWithOrphans, brokenRefs);

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodesWithErrors,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setIsLayouted(true);
  }, [actionChips, branches, ctas, forms, programs, validationErrors, validationWarnings, setNodes, setEdges]);

  // Node click handler - Open details panel
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node);
  }, []);

  // Node double-click handler - Navigate to editor
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node<FlowNodeData>) => {
    const entityId = node.id.split('-')[1]; // Remove prefix (e.g., 'branch-', 'cta-')

    const routes: Record<string, string> = {
      actionChip: '/action-chips',
      branch: `/branches?selected=${entityId}`,
      cta: `/ctas?selected=${entityId}`,
      form: `/forms?selected=${entityId}`,
    };

    const route = routes[node.data.entityType];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  // Close details panel
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const orphanIds = detectOrphanedNodes(nodes, edges);
    const brokenRefs = detectBrokenReferences(nodes, edges, {
      actionChips,
      branches,
      ctas,
      forms,
      programs,
    });

    const errorCount = nodes.filter((n) => n.data.validationStatus === 'error' || (n.data.brokenReferences && n.data.brokenReferences.length > 0)).length;
    const warningCount = nodes.filter((n) => n.data.validationStatus === 'warning').length;
    const successCount = nodes.filter((n) => n.data.validationStatus === 'success' && (!n.data.brokenReferences || n.data.brokenReferences.length === 0)).length;

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      orphanedNodes: orphanIds.size,
      brokenReferences: brokenRefs.length,
      errorCount,
      warningCount,
      successCount,
    };
  }, [nodes, edges, actionChips, branches, ctas, forms, programs]);

  // Mini-map node color based on type
  const nodeColor = (node: Node<FlowNodeData>) => {
    if (node.data.hasErrors) return '#ef4444'; // red-500

    switch (node.type) {
      case 'actionChip':
        return '#06b6d4'; // cyan-500
      case 'branch':
        return '#f97316'; // orange-500
      case 'cta':
        return '#a855f7'; // purple-500
      case 'form':
        return '#22c55e'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Show loading state while layout is being calculated
  if (!isLayouted && nodes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Building flow diagram...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no nodes
  if (nodes.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                No conversation flow data
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Create action chips, branches, CTAs, and forms to visualize the conversation journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Statistics Panel */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle size="sm">Flow Statistics</CardTitle>
              <CardDescription>Overview of conversation flow entities</CardDescription>
            </div>
            {/* Future: Export button */}
            {/* <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total nodes */}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalNodes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Nodes</div>
            </div>

            {/* Total edges */}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalEdges}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Connections</div>
            </div>

            {/* Errors */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {stats.errorCount}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Errors</div>
            </div>

            {/* Warnings */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.warningCount}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Warnings</div>
            </div>

            {/* Success */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.successCount}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Valid</div>
            </div>

            {/* Orphaned */}
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {stats.orphanedNodes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Orphaned</div>
            </div>

            {/* Broken refs */}
            <div className="text-center">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {stats.brokenReferences}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Broken Refs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              attributionPosition="bottom-left"
            >
              {/* Background pattern */}
              <Background color="#aaa" gap={16} />

              {/* Navigation controls */}
              <Controls />

              {/* Mini-map */}
              <MiniMap
                nodeColor={nodeColor}
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              />

              {/* Legend Panel */}
              <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Entity Types
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Action Chips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Branches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">CTAs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Forms</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border-2 border-dashed border-gray-400"></div>
                    <span className="text-gray-700 dark:text-gray-300">Orphaned</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Details Panel */}
    <FlowDetailsPanel
      selectedNode={selectedNode}
      onClose={handleClosePanel}
      allNodes={nodes}
      allEdges={edges}
    />
  </>
  );
};
