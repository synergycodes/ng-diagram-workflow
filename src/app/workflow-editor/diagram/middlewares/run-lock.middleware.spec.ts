import { describe, expect, it, vi } from 'vitest';
import type { MiddlewareContext, ModelActionTypes } from 'ng-diagram';
import { createRunLockMiddleware } from './run-lock.middleware';

function run(modelActionTypes: ModelActionTypes, isLocked: boolean) {
  const next = vi.fn();
  const cancel = vi.fn();
  createRunLockMiddleware(() => isLocked).execute(
    { modelActionTypes } as unknown as MiddlewareContext,
    next,
    cancel,
  );
  return { next, cancel };
}

describe('run-lock middleware', () => {
  it('cancels every edit while a run is in progress', () => {
    const edits: ModelActionTypes = [
      'addNodes',
      'deleteNodes',
      'deleteSelection',
      'updateNode',
      'addEdges',
      'updateEdge',
      'deleteEdges',
      'finishLinking',
      'paste',
      'paletteDropNode',
      'resizeNode',
      'rotateNodeTo',
    ];
    for (const action of edits) {
      expect(run([action], true).cancel, action).toHaveBeenCalledOnce();
    }
  });

  it('leaves selecting, panning, moving and measurement alone', () => {
    const allowed: ModelActionTypes = [
      'init',
      'changeSelection',
      'selectEnd',
      'moveViewport',
      'zoom',
      'zoomToFit',
      'moveNodesBy',
      'moveNodesStop',
      'updateNodes',
      'updatePortsBulk',
      'updateEdgeLabelsBulk',
    ];
    for (const action of allowed) {
      expect(run([action], true).next, action).toHaveBeenCalledOnce();
    }
  });

  it('cancels a transaction that mixes an edit into allowed actions', () => {
    expect(run(['transaction', 'changeSelection', 'addNodes'], true).cancel).toHaveBeenCalledOnce();
  });

  it('allows everything when no run is in progress', () => {
    expect(run(['addNodes'], false).next).toHaveBeenCalledOnce();
  });
});
