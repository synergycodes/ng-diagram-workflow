import { describe, expect, it, vi } from 'vitest';
import type { MiddlewareContext, Node } from 'ng-diagram';
import { createNode } from '../model/node-catalog';
import { WorkflowNodeKind } from '../model/workflow-types';
import { createOneTriggerMiddleware } from './one-trigger.middleware';

const { AiAgent, Trigger } = WorkflowNodeKind;

/**
 * Runs the middleware on the state after an update (`kinds`), telling it
 * whether the update added any nodes.
 */
function run(kinds: Record<string, WorkflowNodeKind>, nodesAdded: boolean) {
  const nodesMap = new Map<string, Node>(
    Object.entries(kinds).map(([id, kind]) => [id, createNode(id, kind, { x: 0, y: 0 })]),
  );
  const next = vi.fn();
  const cancel = vi.fn();
  const report = vi.fn();
  createOneTriggerMiddleware(report).execute(
    { nodesMap, helpers: { anyNodesAdded: () => nodesAdded } } as unknown as MiddlewareContext,
    next,
    cancel,
  );
  return { next, cancel, report };
}

describe('one-trigger middleware', () => {
  it('ignores updates that add no nodes', () => {
    const { next, cancel, report } = run({ t1: Trigger, t2: Trigger }, false);
    expect(next).toHaveBeenCalledWith();
    expect(cancel).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });

  it('lets a step other than a Trigger through', () => {
    const { next, cancel } = run({ t: Trigger, a: AiAgent }, true);
    expect(next).toHaveBeenCalledWith();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('lets the first Trigger into an empty workflow', () => {
    const { next, cancel } = run({ t: Trigger }, true);
    expect(next).toHaveBeenCalledWith();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels an update that adds a second Trigger and says why', () => {
    const { next, cancel, report } = run({ t1: Trigger, a: AiAgent, t2: Trigger }, true);
    expect(cancel).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith('A workflow can have only one Trigger.');
  });
});
