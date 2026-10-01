import type { Edge, Node } from 'ng-diagram';
import { NODE_CATALOG } from './node-catalog';
import { LABEL_EDGE_TYPE, type WorkflowEdgeData, type WorkflowNodeData } from './workflow-types';

const TEMPLATE_TYPES = new Set<string>(Object.values(NODE_CATALOG).map((def) => def.template));

export function isWorkflowNode(node: Node | null | undefined): node is Node<WorkflowNodeData> {
  return !!node && !!node.type && TEMPLATE_TYPES.has(node.type) && 'kind' in node.data;
}

export function isLabelEdge(edge: Edge | null | undefined): edge is Edge<WorkflowEdgeData> {
  return !!edge && edge.type === LABEL_EDGE_TYPE;
}

/** True for nodes that start a workflow (nothing may connect into them). */
export function isStartNode(node: Node | null | undefined): boolean {
  return isWorkflowNode(node) && !!NODE_CATALOG[node.data.kind].isStart;
}

/** True for branching nodes (Decision, Approval): a loop through one can end. */
export function isLoopExit(node: Node | null | undefined): boolean {
  return isWorkflowNode(node) && !!NODE_CATALOG[node.data.kind].initialBranches;
}
