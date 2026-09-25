import type { Edge, Node } from 'ng-diagram';
import { createNodeData, NODE_CATALOG } from './model/node-catalog';
import {
  branchPortId,
  LABEL_EDGE_TYPE,
  PORT_IN,
  PORT_OUT,
  WorkflowNodeKind,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from './model/workflow-types';

/**
 * Seed workflow shown on first load: an order-confirmation flow that branches
 * on order value. Positions sit on the 18px snapping grid.
 */
function node(
  id: string,
  kind: WorkflowNodeKind,
  x: number,
  y: number,
  overrides: Partial<WorkflowNodeData> = {},
): Node<WorkflowNodeData> {
  const base = createNodeData(kind);
  return {
    id,
    type: NODE_CATALOG[kind].template,
    position: { x, y },
    resizable: false,
    rotatable: false,
    data: {
      ...base,
      ...overrides,
      properties: { ...base.properties, ...overrides.properties },
    },
  };
}

function edge(
  source: string,
  sourcePort: string,
  target: string,
  label?: string,
): Edge<WorkflowEdgeData> {
  return {
    id: `${source}:${sourcePort}->${target}`,
    type: LABEL_EDGE_TYPE,
    source,
    sourcePort,
    target,
    targetPort: PORT_IN,
    data: label ? { label } : {},
  };
}

const nodes: Node<WorkflowNodeData>[] = [
  node('trigger', WorkflowNodeKind.Trigger, 0, 162, {
    label: 'New order placed',
    description: 'Starts on every checkout',
    properties: { type: 'eventBasedTrigger', eventMatcher: 'order.created' },
  }),
  node('confirm-email', WorkflowNodeKind.Action, 342, 162, {
    label: 'Send confirmation',
    description: 'Email the order summary',
    properties: { type: 'sendEmail', sendTo: '{{customer.email}}', subject: 'Thanks!' },
  }),
  node('order-value', WorkflowNodeKind.Decision, 684, 126, {
    label: 'Order value',
    description: 'Route by basket total',
    branches: [
      { id: 'vip', label: 'Total above $500' },
      { id: 'regular', label: 'Everything else' },
    ],
  }),
  node('notify-sales', WorkflowNodeKind.Notification, 1026, 0, {
    label: 'Notify sales team',
    description: 'Ping the account manager',
    properties: { type: 'slackMessage', recipient: '#vip-orders' },
  }),
  node('wait', WorkflowNodeKind.Delay, 1026, 288, {
    label: 'Wait 2 days',
    description: 'Give the parcel time to arrive',
    properties: { delayMs: '172800000' },
  }),
  node('draft-follow-up', WorkflowNodeKind.AiAgent, 1368, 234, {
    label: 'Draft follow-up',
    description: 'Write a personal review request',
    properties: { chatModel: 'claudeSonnet4.6', memory: 'system' },
  }),
  node('follow-up-email', WorkflowNodeKind.Action, 1710, 288, {
    label: 'Send follow-up',
    description: 'Ask for a product review',
    properties: { type: 'sendEmail', sendTo: '{{customer.email}}' },
  }),
];

const edges: Edge<WorkflowEdgeData>[] = [
  edge('trigger', PORT_OUT, 'confirm-email'),
  edge('confirm-email', PORT_OUT, 'order-value'),
  edge('order-value', branchPortId('vip'), 'notify-sales', 'VIP'),
  edge('order-value', branchPortId('regular'), 'wait', 'Regular'),
  edge('wait', PORT_OUT, 'draft-follow-up'),
  edge('draft-follow-up', PORT_OUT, 'follow-up-email'),
];

export const workflowModel = { nodes, edges };
