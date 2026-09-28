import type { EdgeLabelPosition } from 'ng-diagram';

/**
 * ng-diagram template keys (the `node.type` / `edge.type` values). A node's
 * template decides its visual layout; what the node *does* lives in `data.kind`.
 */
export const WORKFLOW_NODE_TYPE = 'workflow';
export const DECISION_NODE_TYPE = 'decision';
export const AI_AGENT_NODE_TYPE = 'ai-agent';
export const LABEL_EDGE_TYPE = 'label-edge';

export type WorkflowNodeTemplate =
  typeof WORKFLOW_NODE_TYPE | typeof DECISION_NODE_TYPE | typeof AI_AGENT_NODE_TYPE;

/** Every node kind offered by the palette. */
export enum WorkflowNodeKind {
  Trigger = 'trigger',
  Action = 'action',
  Delay = 'delay',
  Decision = 'decision',
  Notification = 'notification',
  AiAgent = 'ai-agent',
  Approval = 'approval',
  Merge = 'merge',
}

/** Look of the node header icon box; `ai` draws it on the AI gradient. */
export type NodeHeaderVariant = 'default' | 'ai';

/** Value of a kind-specific property edited in the properties panel. */
export type PropertyValue = string | boolean;

export interface DecisionBranch {
  id: string;
  label: string;
}

/** Data carried by every workflow node, whatever its template. */
export interface WorkflowNodeData {
  kind: WorkflowNodeKind;
  label: string;
  description: string;
  /** Kind-specific settings, keyed by the catalog field `key`. */
  properties: Record<string, PropertyValue>;
  /** Branching nodes (Decision, Approval) only: one outgoing port per branch. */
  branches?: DecisionBranch[];
}

export interface WorkflowEdgeData {
  label?: string;
  positionOnEdge?: EdgeLabelPosition;
}

/** Port ids shared by the node templates. */
export const PORT_IN = 'in';
export const PORT_OUT = 'out';
export const branchPortId = (branchId: string) => `branch-${branchId}`;
