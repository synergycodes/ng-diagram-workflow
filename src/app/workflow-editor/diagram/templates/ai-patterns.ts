import { createNode } from '../model/node-catalog';
import { branchPortId, PORT_OUT, WorkflowNodeKind } from '../model/workflow-types';
import { edge, type WorkflowTemplate } from './workflow-template';

const { Action, AiAgent, Approval, Decision, Merge, Notification, Trigger } = WorkflowNodeKind;
const claude = { chatModel: 'claudeSonnet4.6', memory: 'system' };
const gpt = { chatModel: 'gpt5.4', memory: 'system' };
const gemini = { chatModel: 'gemini3.1pro', memory: 'system' };

/*
 * One seed per agentic workflow pattern, so each can be opened without drawing
 * it. Columns are 342px apart and every position sits on the 18px grid.
 */

/** Chaining: each agent's output is the next agent's input. */
export const chainingTemplate: WorkflowTemplate = {
  id: 'chaining',
  name: 'Prompt chaining',
  icon: 'ph-link-simple',
  model: {
    nodes: [
      createNode(
        'brief',
        Trigger,
        { x: 0, y: 0 },
        {
          label: 'Blog brief received',
          description: 'A new brief lands in the CMS',
          properties: { type: 'eventBasedTrigger', eventMatcher: 'brief.created' },
        },
      ),
      createNode(
        'outline',
        AiAgent,
        { x: 342, y: 0 },
        {
          label: 'Outline',
          description: 'Turn the brief into sections',
          properties: gpt,
        },
      ),
      createNode(
        'draft',
        AiAgent,
        { x: 684, y: 0 },
        {
          label: 'Draft',
          description: 'Write each section',
          properties: claude,
        },
      ),
      createNode(
        'polish',
        AiAgent,
        { x: 1026, y: 0 },
        {
          label: 'Polish',
          description: 'Tone, grammar and SEO pass',
          properties: gemini,
        },
      ),
      createNode(
        'publish',
        Action,
        { x: 1368, y: 0 },
        {
          label: 'Publish post',
          description: 'Save as a CMS draft',
          properties: { type: 'createDocument' },
        },
      ),
    ],
    edges: [
      edge('brief', PORT_OUT, 'outline'),
      edge('outline', PORT_OUT, 'draft', 'Outline'),
      edge('draft', PORT_OUT, 'polish', 'Draft'),
      edge('polish', PORT_OUT, 'publish'),
    ],
  },
};

/** Routing: a classifier picks which specialised step handles the input. */
export const routingTemplate: WorkflowTemplate = {
  id: 'routing',
  name: 'Routing',
  icon: 'ph-signpost',
  model: {
    nodes: [
      createNode(
        'ticket',
        Trigger,
        { x: 0, y: 324 },
        {
          label: 'Support ticket',
          description: 'A customer opens a ticket',
          properties: { type: 'eventBasedTrigger', eventMatcher: 'ticket.created' },
        },
      ),
      createNode(
        'classify',
        AiAgent,
        { x: 342, y: 288 },
        {
          label: 'Classify ticket',
          description: 'Label the intent',
          properties: gpt,
        },
      ),
      createNode(
        'route',
        Decision,
        { x: 684, y: 270 },
        {
          label: 'Route by intent',
          description: 'Pick the right specialist',
          branches: [
            { id: 'billing', label: 'Billing' },
            { id: 'tech', label: 'Technical' },
            { id: 'other', label: 'Anything else' },
          ],
        },
      ),
      createNode(
        'billing-agent',
        AiAgent,
        { x: 1026, y: 0 },
        {
          label: 'Billing agent',
          description: 'Answers invoice questions',
          properties: claude,
        },
      ),
      createNode(
        'tech-agent',
        AiAgent,
        { x: 1026, y: 288 },
        {
          label: 'Tech support agent',
          description: 'Troubleshoots with the docs',
          properties: gemini,
        },
      ),
      createNode(
        'handoff',
        Notification,
        { x: 1026, y: 576 },
        {
          label: 'Hand to a person',
          description: 'Post to the support channel',
          properties: { type: 'slackMessage', recipient: '#support' },
        },
      ),
    ],
    edges: [
      edge('ticket', PORT_OUT, 'classify'),
      edge('classify', PORT_OUT, 'route'),
      edge('route', branchPortId('billing'), 'billing-agent'),
      edge('route', branchPortId('tech'), 'tech-agent'),
      edge('route', branchPortId('other'), 'handoff'),
    ],
  },
};

/** Parallelization: independent agents run at once, a Merge joins them. */
export const parallelizationTemplate: WorkflowTemplate = {
  id: 'parallelization',
  name: 'Parallelization',
  icon: 'ph-git-fork',
  model: {
    nodes: [
      createNode(
        'pr',
        Trigger,
        { x: 0, y: 288 },
        {
          label: 'Pull request opened',
          description: 'Review every new PR',
          properties: { type: 'eventBasedTrigger', eventMatcher: 'pull_request.opened' },
        },
      ),
      createNode(
        'security',
        AiAgent,
        { x: 342, y: 0 },
        {
          label: 'Security review',
          description: 'Look for vulnerabilities',
          properties: claude,
        },
      ),
      createNode(
        'performance',
        AiAgent,
        { x: 342, y: 288 },
        {
          label: 'Performance review',
          description: 'Spot slow paths',
          properties: gpt,
        },
      ),
      createNode(
        'style',
        AiAgent,
        { x: 342, y: 576 },
        {
          label: 'Style review',
          description: 'Check naming and conventions',
          properties: gemini,
        },
      ),
      createNode(
        'join',
        Merge,
        { x: 684, y: 288 },
        {
          label: 'Collect reviews',
          description: 'Wait for every reviewer',
          properties: { waitFor: 'all' },
        },
      ),
      createNode(
        'summarize',
        AiAgent,
        { x: 1026, y: 288 },
        {
          label: 'Summarize',
          description: 'One comment from three reviews',
          properties: claude,
        },
      ),
      createNode(
        'comment',
        Action,
        { x: 1368, y: 288 },
        {
          label: 'Comment on PR',
          description: 'Post the summary',
          properties: { type: 'makeApiCall', apiUrl: 'https://api.github.com/…/comments' },
        },
      ),
    ],
    edges: [
      edge('pr', PORT_OUT, 'security'),
      edge('pr', PORT_OUT, 'performance'),
      edge('pr', PORT_OUT, 'style'),
      edge('security', PORT_OUT, 'join'),
      edge('performance', PORT_OUT, 'join'),
      edge('style', PORT_OUT, 'join'),
      edge('join', PORT_OUT, 'summarize'),
      edge('summarize', PORT_OUT, 'comment'),
    ],
  },
};

/**
 * Reflection loop: an evaluator sends the draft back until it passes. The
 * Decision sits below the agents so the backward "Revise" edge is routed under
 * them instead of through them.
 */
export const reflectionLoopTemplate: WorkflowTemplate = {
  id: 'reflection-loop',
  name: 'Reflection loop',
  icon: 'ph-arrows-clockwise',
  model: {
    nodes: [
      createNode(
        'request',
        Trigger,
        { x: 0, y: 0 },
        {
          label: 'Feature request',
          description: 'Generate code for a spec',
          properties: { type: 'eventBasedTrigger', eventMatcher: 'spec.ready' },
        },
      ),
      createNode(
        'generate',
        AiAgent,
        { x: 342, y: 0 },
        {
          label: 'Generate',
          description: 'Write or revise the code',
          properties: claude,
        },
      ),
      createNode(
        'evaluate',
        AiAgent,
        { x: 684, y: 0 },
        {
          label: 'Evaluate',
          description: 'Run tests and critique',
          properties: gpt,
        },
      ),
      createNode(
        'good-enough',
        Decision,
        { x: 1026, y: 396 },
        {
          label: 'Good enough?',
          description: 'Evaluator verdict',
          branches: [
            { id: 'approved', label: 'Approved' },
            { id: 'revise', label: 'Revise' },
          ],
        },
      ),
      createNode(
        'open-pr',
        Action,
        { x: 1368, y: 432 },
        {
          label: 'Open pull request',
          description: 'Ship the accepted version',
          properties: { type: 'makeApiCall', apiUrl: 'https://api.github.com/…/pulls' },
        },
      ),
    ],
    edges: [
      edge('request', PORT_OUT, 'generate'),
      edge('generate', PORT_OUT, 'evaluate', 'Code'),
      edge('evaluate', PORT_OUT, 'good-enough'),
      edge('good-enough', branchPortId('approved'), 'open-pr'),
      edge('good-enough', branchPortId('revise'), 'generate', 'Feedback'),
    ],
  },
};

/** Human-in-the-loop: the flow waits for a person before acting. */
export const humanInTheLoopTemplate: WorkflowTemplate = {
  id: 'human-in-the-loop',
  name: 'Human-in-the-loop',
  icon: 'ph-user-check',
  model: {
    nodes: [
      createNode(
        'refund',
        Trigger,
        { x: 0, y: 0 },
        {
          label: 'Refund requested',
          description: 'Customer asks for money back',
          properties: { type: 'eventBasedTrigger', eventMatcher: 'refund.requested' },
        },
      ),
      createNode(
        'assess',
        AiAgent,
        { x: 342, y: 0 },
        {
          label: 'Assess refund',
          description: 'Check policy, draft a reply',
          properties: claude,
        },
      ),
      createNode(
        'sign-off',
        Approval,
        { x: 684, y: 0 },
        {
          label: 'Manager sign-off',
          description: 'A person approves the refund',
          properties: { approver: 'Support lead', channel: 'slackMessage', timeout: '4h' },
        },
      ),
      createNode(
        'issue',
        Action,
        { x: 1026, y: 0 },
        {
          label: 'Issue refund',
          description: 'Pay back and send the reply',
          properties: { type: 'makeApiCall', apiUrl: 'https://api.example.com/refunds' },
        },
      ),
      createNode(
        'decline',
        Notification,
        { x: 1026, y: 216 },
        {
          label: 'Explain decision',
          description: 'Tell the customer why not',
          properties: { type: 'email', recipient: '{{customer.email}}' },
        },
      ),
    ],
    edges: [
      edge('refund', PORT_OUT, 'assess'),
      edge('assess', PORT_OUT, 'sign-off', 'Draft'),
      edge('sign-off', branchPortId('approved'), 'issue'),
      edge('sign-off', branchPortId('rejected'), 'decline'),
    ],
  },
};
