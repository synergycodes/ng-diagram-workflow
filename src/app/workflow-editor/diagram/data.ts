import type { Edge, Node } from 'ng-diagram';
import { createNode } from './model/node-catalog';
import {
  branchPortId,
  LABEL_EDGE_TYPE,
  PORT_IN,
  PORT_OUT,
  WorkflowNodeKind,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from './model/workflow-types';

function edge(
  source: string,
  sourcePort: string,
  target: string,
  label?: string,
): Edge<WorkflowEdgeData> {
  return {
    id: `${source}:${sourcePort}__${target}`,
    type: LABEL_EDGE_TYPE,
    source,
    sourcePort,
    target,
    targetPort: PORT_IN,
    data: label ? { label } : {},
  };
}

const nodes: Node<WorkflowNodeData>[] = [
  createNode(
    'trigger',
    WorkflowNodeKind.Trigger,
    { x: 0, y: 162 },
    {
      label: 'New order placed',
      description: 'Starts on every checkout',
      properties: { type: 'eventBasedTrigger', eventMatcher: 'order.created' },
    },
  ),
  createNode(
    'confirm-email',
    WorkflowNodeKind.Action,
    { x: 342, y: 162 },
    {
      label: 'Send confirmation',
      description: 'Email the order summary',
      properties: { type: 'sendEmail', sendTo: '{{customer.email}}', subject: 'Thanks!' },
    },
  ),
  createNode(
    'order-value',
    WorkflowNodeKind.Decision,
    { x: 684, y: 126 },
    {
      label: 'Order value',
      description: 'Route by basket total',
      branches: [
        { id: 'vip', label: 'Total above $500' },
        { id: 'regular', label: 'Everything else' },
      ],
    },
  ),
  createNode(
    'notify-sales',
    WorkflowNodeKind.Notification,
    { x: 1026, y: 0 },
    {
      label: 'Notify sales team',
      description: 'Ping the account manager',
      properties: { type: 'slackMessage', recipient: '#vip-orders' },
    },
  ),
  createNode(
    'wait',
    WorkflowNodeKind.Delay,
    { x: 1026, y: 288 },
    {
      label: 'Wait 2 days',
      description: 'Give the parcel time to arrive',
      properties: { delayMs: '172800000' },
    },
  ),
  createNode(
    'draft-follow-up',
    WorkflowNodeKind.AiAgent,
    { x: 1368, y: 234 },
    {
      label: 'Draft follow-up',
      description: 'Write a personal review request',
      properties: { chatModel: 'claudeSonnet4.6', memory: 'system' },
    },
  ),
  createNode(
    'follow-up-email',
    WorkflowNodeKind.Action,
    { x: 1710, y: 288 },
    {
      label: 'Send follow-up',
      description: 'Ask for a product review',
      properties: { type: 'sendEmail', sendTo: '{{customer.email}}' },
    },
  ),
];

const edges: Edge<WorkflowEdgeData>[] = [
  edge('trigger', PORT_OUT, 'confirm-email'),
  edge('confirm-email', PORT_OUT, 'order-value'),
  edge('order-value', branchPortId('vip'), 'notify-sales', 'VIP'),
  edge('order-value', branchPortId('regular'), 'wait', 'Regular'),
  edge('wait', PORT_OUT, 'draft-follow-up'),
  edge('draft-follow-up', PORT_OUT, 'follow-up-email'),
];

/**
 * Seed workflow shown on first load: an order-confirmation flow that branches
 * on order value. Positions sit on the 18px snapping grid.
 */
export const workflowModel = { nodes, edges };
