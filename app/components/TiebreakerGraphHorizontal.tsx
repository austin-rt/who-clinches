'use client';

import { useMemo } from 'react';
import { ReactFlow, type Node, type Edge, Position, ReactFlowProvider } from '@xyflow/react';
import dagre from 'dagre';
import type { TieFlowGraph } from '@/app/store/api';
import RootNodeH from './flow-nodes/RootNodeH';
import RuleNodeH from './flow-nodes/RuleNodeH';
import ResultNodeH from './flow-nodes/ResultNodeH';
import TeamEdge from './flow-nodes/TeamEdge';

import '@xyflow/react/dist/style.css';

const nodeTypes = { root: RootNodeH, rule: RuleNodeH, result: ResultNodeH };
const edgeTypes = { team: TeamEdge };

const NODE_WIDTH = 160;
const NODE_HEIGHT_ROOT = 120;
const NODE_HEIGHT_RULE = 80;
const NODE_HEIGHT_RESULT = 90;

const getNodeHeight = (type: string) => {
  if (type === 'root') return NODE_HEIGHT_ROOT;
  if (type === 'result') return NODE_HEIGHT_RESULT;
  return NODE_HEIGHT_RULE;
};

const PADDING = 20;

const buildLayout = (graph: TieFlowGraph) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 20, nodesep: 30, marginx: 0, marginy: 0 });

  const nodes: Node[] = graph.nodes.map((n) => {
    const height = getNodeHeight(n.type);
    const width = n.type === 'root' ? Math.max(NODE_WIDTH, n.teamIds.length * 60 + 40) : NODE_WIDTH;
    g.setNode(n.id, { width, height });
    const incomingEdge = graph.edges.find((e) => e.target === n.id);
    return {
      id: n.id,
      type: n.type,
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        detail: n.detail,
        teamIds: n.teamIds,
        teams: graph.teams,
        edgeLabel: n.type === 'result' ? incomingEdge?.label || '' : '',
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => {
    g.setEdge(e.source, e.target);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'team',
      data: {
        label: e.label,
        teamIds: e.teamIds,
        teams: graph.teams,
      },
    };
  });

  dagre.layout(g);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    const height = getNodeHeight(node.type!);
    const nodeW = dagreNode.width;
    const left = dagreNode.x - nodeW / 2;
    const top = dagreNode.y - height / 2;
    const right = dagreNode.x + nodeW / 2;
    const bottom = dagreNode.y + height / 2;
    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  const LAST_OFFSET = 60;

  const resultNodes = nodes.filter((n) => n.type === 'result');
  const siblingGroups = new Map<string, typeof nodes>();
  for (const edge of edges) {
    const node = resultNodes.find((n) => n.id === edge.target);
    if (node) {
      if (!siblingGroups.has(edge.source)) siblingGroups.set(edge.source, []);
      siblingGroups.get(edge.source)!.push(node);
    }
  }

  const lastPairIds = new Set<string>();
  for (const [, siblings] of siblingGroups) {
    if (siblings.length === 2 && siblings.every((s) => s.type === 'result')) {
      const ranks = siblings.map((s) => {
        const gn = graph.nodes.find((n) => n.id === s.id)!;
        return { node: s, rank: parseInt(gn.label.replace('#', ''), 10) };
      });
      ranks.sort((a, b) => a.rank - b.rank);
      lastPairIds.add(ranks[1].node.id);
    }
  }

  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    const nodeW = dagreNode.width;
    const height = getNodeHeight(node.type!);
    const extraX = lastPairIds.has(node.id) ? LAST_OFFSET : 0;
    node.position = {
      x: dagreNode.x - nodeW / 2 - minX + PADDING + extraX,
      y: dagreNode.y - height / 2 - minY,
    };
    node.sourcePosition = Position.Right;
    node.targetPosition = Position.Left;

    if (extraX > 0) {
      const right = dagreNode.x + nodeW / 2 + extraX;
      if (right > maxX) maxX = right;
    }
  }

  const graphWidth = maxX - minX + PADDING * 2;
  const graphHeight = maxY - minY;

  return { nodes, edges, graphWidth, graphHeight };
};

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getBaseRank = (graph: TieFlowGraph): number => {
  const firstResult = graph.nodes.find((n) => n.type === 'result');
  return firstResult ? parseInt(firstResult.label.replace('#', ''), 10) : 1;
};

const FlowChartInner = ({ graph }: { graph: TieFlowGraph }) => {
  const { nodes, edges, graphWidth, graphHeight } = useMemo(() => buildLayout(graph), [graph]);

  return (
    <div className="overflow-x-auto">
      <div style={{ width: `${graphWidth}px`, height: `${graphHeight}px` }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          panOnScroll={false}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </div>
  );
};

interface TiebreakerGraphHorizontalProps {
  tieFlowGraphs: TieFlowGraph[];
}

const TiebreakerGraphHorizontal = ({ tieFlowGraphs }: TiebreakerGraphHorizontalProps) => {
  if (!tieFlowGraphs || tieFlowGraphs.length === 0) return null;

  return (
    <div className="collapse collapse-arrow bg-base-300">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title min-h-0 py-2 text-sm font-semibold">Tiebreaker Details</div>
      <div className="collapse-content">
        <div className="flex flex-col gap-4 pt-2">
          {tieFlowGraphs.map((graph, index) => {
            const rank = getBaseRank(graph);
            const rootNode = graph.nodes.find((n) => n.type === 'root');
            const title = `Tied for ${ordinal(rank)} — ${rootNode?.label || ''}`;

            return (
              <div key={index} className="collapse collapse-arrow rounded-xl bg-base-200">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title min-h-0 py-2 text-sm font-semibold">{title}</div>
                <div className="collapse-content">
                  <div className="pt-2">
                    <ReactFlowProvider>
                      <FlowChartInner graph={graph} />
                    </ReactFlowProvider>
                    {graph.summary.length > 0 && (
                      <div className="collapse collapse-arrow mt-3 bg-base-300">
                        <input type="checkbox" />
                        <div className="collapse-title min-h-0 py-2 text-xs font-semibold">
                          Summary
                        </div>
                        <div className="collapse-content">
                          {graph.summary.map((line, i) => (
                            <p key={i} className="text-base-content/60 text-xs leading-relaxed">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TiebreakerGraphHorizontal;
