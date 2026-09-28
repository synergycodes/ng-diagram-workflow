import type { NgDiagramPaletteItem, Node, Point } from 'ng-diagram';
import type { FieldDefinition, SelectOption } from './field-definitions';
import {
  AI_AGENT_NODE_TYPE,
  DECISION_NODE_TYPE,
  WORKFLOW_NODE_TYPE,
  WorkflowNodeKind,
  type DecisionBranch,
  type NodeHeaderVariant,
  type PropertyValue,
  type WorkflowNodeData,
  type WorkflowNodeTemplate,
} from './workflow-types';

/**
 * Everything the editor knows about a node kind. One entry drives three
 * things: the palette tile, the node card (template + icon + summary chip) and
 * the properties form (fields + defaults).
 */
export interface NodeDefinition {
  kind: WorkflowNodeKind;
  label: string;
  description: string;
  /** Icon reference, see `NodeIconComponent` for the accepted formats. */
  icon: string;
  /** Which ng-diagram node template renders this kind. */
  template: WorkflowNodeTemplate;
  /** Look of the header icon box (canvas card, palette tile). */
  variant?: NodeHeaderVariant;
  /** A start node has no input port (nothing can connect into it). */
  isStart?: boolean;
  /** Kind-specific fields shown below the common Title / Description. */
  fields: readonly FieldDefinition[];
  /** Initial values for `fields`. */
  defaults: Readonly<Record<string, PropertyValue>>;
  /** Select field whose chosen option is shown as a chip on the node card. */
  summaryKey?: string;
  /**
   * Branches a new node starts with. A kind that has them routes the flow:
   * one output port per branch, edited in the properties panel.
   */
  initialBranches?: readonly DecisionBranch[];
}

const EMAIL_FIELDS: readonly FieldDefinition[] = [
  { kind: 'text', key: 'sendTo', label: 'Send To', placeholder: 'user@example.com' },
  { kind: 'text', key: 'subject', label: 'Subject', placeholder: 'Subject line' },
  { kind: 'textarea', key: 'body', label: 'Body', placeholder: 'Write your message…' },
];

export const NODE_CATALOG: Record<WorkflowNodeKind, NodeDefinition> = {
  [WorkflowNodeKind.Trigger]: {
    kind: WorkflowNodeKind.Trigger,
    label: 'Trigger',
    description: 'Initiate workflows',
    icon: 'ph-lightning',
    template: WORKFLOW_NODE_TYPE,
    isStart: true,
    summaryKey: 'type',
    fields: [
      {
        kind: 'select',
        key: 'type',
        label: 'Trigger Type',
        options: [
          { value: 'timeBasedTrigger', label: 'Time-based Trigger', icon: 'ph-clock-countdown' },
          { value: 'eventBasedTrigger', label: 'Event-based Trigger', icon: 'ph-calendar-check' },
        ],
      },
      {
        kind: 'text',
        key: 'cron',
        label: 'CRON Expression',
        placeholder: '0 9 * * 1-5',
        showIf: { key: 'type', values: ['timeBasedTrigger'] },
      },
      {
        kind: 'text',
        key: 'eventMatcher',
        label: 'Event Matcher',
        placeholder: 'order.created',
        showIf: { key: 'type', values: ['eventBasedTrigger'] },
      },
    ],
    defaults: { type: 'timeBasedTrigger', cron: '0 9 * * *', eventMatcher: '' },
  },

  [WorkflowNodeKind.Action]: {
    kind: WorkflowNodeKind.Action,
    label: 'Action',
    description: 'Perform actions based on triggers',
    icon: 'ph-play-circle',
    template: WORKFLOW_NODE_TYPE,
    summaryKey: 'type',
    fields: [
      {
        kind: 'select',
        key: 'type',
        label: 'Action Type',
        options: [
          { value: 'sendEmail', label: 'Send Email', icon: 'ph-envelope-simple' },
          { value: 'updateRecord', label: 'Update Record', icon: 'ph-cloud-arrow-up' },
          { value: 'makeApiCall', label: 'Make API Call', icon: 'ph-webhooks-logo' },
          { value: 'createRecord', label: 'Create Record', icon: 'ph-rows-plus-top' },
          { value: 'executeScript', label: 'Execute Script', icon: 'ph-code' },
          { value: 'createDocument', label: 'Create New Document', icon: 'ph-file-plus' },
        ],
      },
      ...EMAIL_FIELDS.map((field) => ({
        ...field,
        showIf: { key: 'type', values: ['sendEmail'] },
      })),
      {
        kind: 'text',
        key: 'apiUrl',
        label: 'API URL',
        placeholder: 'https://api.example.com',
        showIf: { key: 'type', values: ['makeApiCall'] },
      },
      {
        kind: 'select',
        key: 'httpMethod',
        label: 'HTTP Method',
        showIf: { key: 'type', values: ['makeApiCall'] },
        options: [
          { value: 'get', label: 'GET' },
          { value: 'post', label: 'POST' },
          { value: 'put', label: 'PUT' },
          { value: 'delete', label: 'DELETE' },
        ],
      },
      {
        kind: 'switch',
        key: 'retryOnFailure',
        label: 'Retry on failure',
      },
    ],
    defaults: {
      type: 'sendEmail',
      sendTo: '',
      subject: '',
      body: '',
      apiUrl: 'https://api.example.com/update_status',
      httpMethod: 'post',
      retryOnFailure: false,
    },
  },

  [WorkflowNodeKind.Delay]: {
    kind: WorkflowNodeKind.Delay,
    label: 'Delay',
    description: 'Pause the workflow',
    icon: 'ph-timer',
    template: WORKFLOW_NODE_TYPE,
    fields: [{ kind: 'text', key: 'delayMs', label: 'Delay (ms)', placeholder: '5000' }],
    defaults: { delayMs: '5000' },
  },

  [WorkflowNodeKind.Decision]: {
    kind: WorkflowNodeKind.Decision,
    label: 'Decision',
    description: 'Route the workflow',
    icon: 'ph-arrows-split',
    template: DECISION_NODE_TYPE,
    initialBranches: [
      { id: 'b1', label: 'Branch 1' },
      { id: 'b2', label: 'Branch 2' },
    ],
    // Branches are edited by a dedicated list editor, not a catalog field.
    fields: [],
    defaults: {},
  },

  [WorkflowNodeKind.Notification]: {
    kind: WorkflowNodeKind.Notification,
    label: 'Notification',
    description: 'Send alerts or notifications',
    icon: 'ph-paper-plane-right',
    template: WORKFLOW_NODE_TYPE,
    summaryKey: 'type',
    fields: [
      {
        kind: 'select',
        key: 'type',
        label: 'Notification Type',
        options: [
          { value: 'email', label: 'Email', icon: 'ph-envelope-simple' },
          { value: 'sms', label: 'SMS', icon: 'ph-chat-teardrop-dots' },
          { value: 'pushNotification', label: 'Push Notification', icon: 'ph-bell' },
          { value: 'webhook', label: 'Webhook', icon: 'ph-webhooks-logo' },
          { value: 'slackMessage', label: 'Slack Message', icon: 'ph-slack-logo' },
        ],
      },
      { kind: 'text', key: 'recipient', label: 'Recipient', placeholder: 'Who gets notified?' },
      { kind: 'textarea', key: 'message', label: 'Message', placeholder: 'Notification text…' },
    ],
    defaults: { type: 'email', recipient: '', message: '' },
  },

  [WorkflowNodeKind.AiAgent]: {
    kind: WorkflowNodeKind.AiAgent,
    label: 'AI Agent',
    description: 'Delegate tasks',
    icon: 'mask:ai-agent',
    template: AI_AGENT_NODE_TYPE,
    variant: 'ai',
    fields: [
      {
        kind: 'select',
        key: 'chatModel',
        label: 'Chat Model',
        placeholder: 'Add Chat Model',
        options: [
          { value: 'gpt5.4', label: 'GPT-5.4', icon: 'mask:openai-logo' },
          { value: 'gemini3.1pro', label: 'Gemini 3.1 Pro', icon: 'mask:gemini-logo' },
          { value: 'claudeSonnet4.6', label: 'Claude Sonnet 4.6', icon: 'mask:claude-logo' },
        ],
      },
      {
        kind: 'select',
        key: 'memory',
        label: 'Memory',
        placeholder: 'Add memory',
        options: [{ value: 'system', label: 'Window-based Memory', icon: 'ph-database' }],
      },
      {
        kind: 'textarea',
        key: 'systemPrompt',
        label: 'System Prompt',
        placeholder: 'You are a helpful assistant…',
      },
    ],
    defaults: { chatModel: '', memory: '', systemPrompt: '' },
  },
};

/** Palette order (matches the Workflow Builder demo). */
export const PALETTE_ORDER: readonly WorkflowNodeKind[] = [
  WorkflowNodeKind.Trigger,
  WorkflowNodeKind.Action,
  WorkflowNodeKind.Delay,
  WorkflowNodeKind.Decision,
  WorkflowNodeKind.Notification,
  WorkflowNodeKind.AiAgent,
];

/**
 * Fresh node data for a kind, with catalog defaults applied. `overrides`
 * replace top-level fields, except `properties`, which are merged into the
 * defaults.
 */
export function createNodeData(
  kind: WorkflowNodeKind,
  overrides: Partial<WorkflowNodeData> = {},
): WorkflowNodeData {
  const def = NODE_CATALOG[kind];
  return {
    kind,
    label: def.label,
    description: def.description,
    ...(def.initialBranches
      ? { branches: def.initialBranches.map((branch) => ({ ...branch })) }
      : {}),
    ...overrides,
    properties: { ...def.defaults, ...overrides.properties },
  };
}

/** A diagram node of a kind, rendered by the kind's catalog template. */
export function createNode(
  id: string,
  kind: WorkflowNodeKind,
  position: Point,
  overrides: Partial<WorkflowNodeData> = {},
): Node<WorkflowNodeData> {
  return { id, type: NODE_CATALOG[kind].template, position, data: createNodeData(kind, overrides) };
}

/** ng-diagram palette item for a kind; dropping it creates the matching node. */
export function toPaletteItem(kind: WorkflowNodeKind): NgDiagramPaletteItem<WorkflowNodeData> {
  return {
    type: NODE_CATALOG[kind].template,
    data: createNodeData(kind),
  };
}

/** The option currently chosen in a select field, if any. */
export function selectedOption(
  data: WorkflowNodeData,
  key: string | undefined,
): SelectOption | undefined {
  if (!key) return undefined;
  const field = NODE_CATALOG[data.kind].fields.find((f) => f.key === key);
  if (field?.kind !== 'select') return undefined;
  return field.options.find((option) => option.value === data.properties[key]);
}
