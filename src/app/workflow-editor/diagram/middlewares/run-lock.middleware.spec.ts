import { describe, expect, it, vi } from 'vitest';
import type { MiddlewareContext } from 'ng-diagram';
import { createRunLockMiddleware } from './run-lock.middleware';

/** What an update changes, as the middleware helpers report it. */
interface Changes {
  nodesAdded?: boolean;
  nodesRemoved?: boolean;
  edgesAdded?: boolean;
  edgesRemoved?: boolean;
  nodeProps?: string[];
  edgeProps?: string[];
}

function run(changes: Changes, isLocked: boolean) {
  const changed = (props: string[], changedProps: string[] = []) =>
    props.some((prop) => changedProps.includes(prop));
  const helpers = {
    anyNodesAdded: () => !!changes.nodesAdded,
    anyNodesRemoved: () => !!changes.nodesRemoved,
    anyEdgesAdded: () => !!changes.edgesAdded,
    anyEdgesRemoved: () => !!changes.edgesRemoved,
    checkIfAnyNodePropsChanged: (props: string[]) => changed(props, changes.nodeProps),
    checkIfAnyEdgePropsChanged: (props: string[]) => changed(props, changes.edgeProps),
  };
  const next = vi.fn();
  const cancel = vi.fn();
  createRunLockMiddleware(() => isLocked).execute(
    { helpers } as unknown as MiddlewareContext,
    next,
    cancel,
  );
  return { next, cancel };
}

describe('run-lock middleware', () => {
  it('cancels every edit of the workflow while a run is in progress', () => {
    const edits: Record<string, Changes> = {
      'step added (palette drop, paste)': { nodesAdded: true },
      'step deleted': { nodesRemoved: true },
      'connection drawn': { edgesAdded: true },
      'connection deleted': { edgesRemoved: true },
      'step settings edited': { nodeProps: ['data'] },
      'connection label edited': { edgeProps: ['data'] },
      'connection attached elsewhere': { edgeProps: ['target', 'targetPort'] },
    };
    for (const [edit, changes] of Object.entries(edits)) {
      const { next, cancel } = run(changes, true);
      expect(cancel, edit).toHaveBeenCalledOnce();
      expect(next, edit).not.toHaveBeenCalled();
    }
  });

  it('leaves layout, selection, the viewport and measurement alone', () => {
    const allowed: Record<string, Changes> = {
      'step dragged': { nodeProps: ['position'] },
      'selection changed': { nodeProps: ['selected'], edgeProps: ['selected'] },
      'step measured': { nodeProps: ['size', 'measuredPorts'] },
      'connection routed and its label measured': {
        edgeProps: ['points', 'sourcePosition', 'targetPosition', 'measuredLabels'],
      },
      'z-order changed': { nodeProps: ['zOrder', 'computedZIndex'] },
      'viewport moved': {},
    };
    for (const [change, changes] of Object.entries(allowed)) {
      expect(run(changes, true).next, change).toHaveBeenCalledOnce();
    }
  });

  it('cancels an update that mixes an edit into allowed changes', () => {
    expect(run({ nodeProps: ['position', 'data'] }, true).cancel).toHaveBeenCalledOnce();
  });

  it('allows everything when no run is in progress', () => {
    expect(run({ nodesAdded: true, nodeProps: ['data'] }, false).next).toHaveBeenCalledOnce();
  });
});
