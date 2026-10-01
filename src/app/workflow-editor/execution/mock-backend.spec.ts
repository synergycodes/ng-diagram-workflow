import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNode } from '../diagram/model/node-catalog';
import { WorkflowNodeKind } from '../diagram/model/workflow-types';
import {
  humanInTheLoopTemplate,
  parallelizationTemplate,
  reflectionLoopTemplate,
  routingTemplate,
} from '../diagram/templates/ai-patterns';
import type { WorkflowModel } from '../diagram/templates';
import { edge } from '../diagram/templates/workflow-template';
import type { RunEvent } from './execution-types';
import { MockWorkflowBackend } from './mock-backend';
import { toWorkflowDocument } from './workflow-document';

const { Action, AiAgent, Trigger } = WorkflowNodeKind;

function start(model: WorkflowModel, random = 0.5) {
  const backend = new MockWorkflowBackend();
  backend.random = () => random;
  const events: RunEvent[] = [];
  backend
    .start(toWorkflowDocument(model.nodes, model.edges, 'test'))
    .subscribe((e) => events.push(e));
  const statuses = (nodeId: string) =>
    events
      .filter((e) => e.type === 'node' && e.nodeId === nodeId)
      .map((e) => e.type === 'node' && e.status);
  const finished = () => events.find((e) => e.type === 'finished');
  return { backend, events, statuses, finished };
}

describe('MockWorkflowBackend', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs a chain step by step', () => {
    const run = start({
      nodes: [
        createNode('t', Trigger, { x: 0, y: 0 }),
        createNode('a', AiAgent, { x: 0, y: 0 }),
        createNode('b', Action, { x: 0, y: 0 }),
      ],
      edges: [edge('t', 'out', 'a'), edge('a', 'out', 'b')],
    });
    expect(run.statuses('t')).toEqual(['running']);
    expect(run.statuses('b')).toEqual([]);
    vi.runAllTimers();
    expect(run.statuses('b')).toEqual(['running', 'succeeded']);
    expect(run.finished()).toEqual({ type: 'finished', outcome: 'succeeded' });
  });

  it('routes every run down the same branch', () => {
    for (const random of [0, 0.99]) {
      const run = start(routingTemplate.model, random);
      vi.runAllTimers();
      expect(run.statuses('billing-agent')).toEqual(['running', 'succeeded']);
      expect(run.statuses('tech-agent')).toEqual([]);
      expect(run.statuses('handoff')).toEqual([]);
    }
  });

  it('waits at a Merge until every parallel branch has arrived', () => {
    const run = start(parallelizationTemplate.model);
    vi.runAllTimers();
    expect(run.statuses('join')).toEqual(['waiting', 'waiting', 'running', 'succeeded']);
    expect(run.statuses('comment')).toContain('succeeded');
  });

  it('revises once in a reflection loop, then approves', () => {
    const run = start(reflectionLoopTemplate.model);
    vi.runAllTimers();
    expect(run.statuses('generate').filter((s) => s === 'running')).toHaveLength(2);
    expect(run.statuses('open-pr')).toEqual(['running', 'succeeded']);
  });

  it('waits for a person at an Approval', () => {
    const run = start(humanInTheLoopTemplate.model);
    vi.runAllTimers();
    expect(run.statuses('sign-off').at(-1)).toBe('waiting');
    expect(run.finished()).toBeUndefined();

    run.backend.submitDecision('sign-off', 'rejected');
    vi.runAllTimers();
    expect(run.statuses('decline')).toEqual(['running', 'succeeded']);
    expect(run.statuses('issue')).toEqual([]);
    expect(run.finished()).toEqual({ type: 'finished', outcome: 'succeeded' });
  });

  it('fails a run with nothing to start from instead of reporting success', () => {
    const run = start({
      nodes: [createNode('a', Action, { x: 0, y: 0 }), createNode('b', Action, { x: 0, y: 0 })],
      edges: [edge('a', 'out', 'b'), edge('b', 'out', 'a')],
    });
    vi.runAllTimers();
    expect(run.statuses('a')).toEqual([]);
    expect(run.finished()).toEqual({ type: 'finished', outcome: 'failed' });
  });

  it('fails a step with simulateFailure, or retries it once when allowed', () => {
    const failing = (retryOnFailure: boolean) =>
      start({
        nodes: [
          createNode('t', Trigger, { x: 0, y: 0 }),
          createNode(
            'a',
            Action,
            { x: 0, y: 0 },
            { properties: { simulateFailure: true, retryOnFailure } },
          ),
        ],
        edges: [edge('t', 'out', 'a')],
      });

    const noRetry = failing(false);
    vi.runAllTimers();
    expect(noRetry.statuses('a')).toEqual(['running', 'failed']);
    expect(noRetry.finished()).toEqual({ type: 'finished', outcome: 'failed' });

    const retry = failing(true);
    vi.runAllTimers();
    expect(retry.statuses('a')).toEqual(['running', 'failed', 'running', 'succeeded']);
    expect(retry.finished()).toEqual({ type: 'finished', outcome: 'succeeded' });
  });
});
