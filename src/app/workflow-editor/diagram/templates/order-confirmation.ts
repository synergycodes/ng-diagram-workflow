import type { Edge, Node } from 'ng-diagram';
import { createNode } from '../model/node-catalog';
import {
  branchPortId,
  PORT_OUT,
  WorkflowNodeKind,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from '../model/workflow-types';
import { at, edge, type WorkflowTemplate } from './workflow-template';

const nodes: Node<WorkflowNodeData>[] = [
  createNode('trigger', WorkflowNodeKind.Trigger, at(0, 162), {
    label: 'New order placed',
    description: 'Starts on every checkout',
    properties: { type: 'eventBasedTrigger', eventMatcher: 'order.created' },
  }),
  createNode('confirm-email', WorkflowNodeKind.Action, at(342, 162), {
    label: 'Send confirmation',
    description: 'Email the order summary',
    properties: { type: 'sendEmail', sendTo: '{{customer.email}}', subject: 'Thanks!' },
  }),
  createNode('order-value', WorkflowNodeKind.Decision, at(684, 126), {
    label: 'Order value',
    description: 'Route by basket total',
    branches: [
      { id: 'vip', label: 'Total above $500' },
      { id: 'regular', label: 'Everything else' },
    ],
  }),
  createNode('notify-sales', WorkflowNodeKind.Notification, at(1026, 0), {
    label: 'Notify sales team',
    description: 'Ping the account manager',
    properties: { type: 'slackMessage', recipient: '#vip-orders' },
  }),
  createNode('wait', WorkflowNodeKind.Delay, at(1026, 288), {
    label: 'Wait 2 days',
    description: 'Give the parcel time to arrive',
    properties: { delayMs: '172800000' },
  }),
  createNode('draft-follow-up', WorkflowNodeKind.AiAgent, at(1368, 234), {
    label: 'Draft follow-up',
    description: 'Write a personal review request',
    properties: { chatModel: 'claudeSonnet4.6', memory: 'system' },
  }),
  createNode('follow-up-email', WorkflowNodeKind.Action, at(1710, 288), {
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

/**
 * The default seed: an order-confirmation flow that branches on order value.
 * Positions sit on the 18px snapping grid.
 */
export const orderConfirmationTemplate: WorkflowTemplate = {
  id: 'order-confirmation',
  name: 'Order confirmation',
  icon: 'ph-shopping-cart',
  model: { nodes, edges },
};
