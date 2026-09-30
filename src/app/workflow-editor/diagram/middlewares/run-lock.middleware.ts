import type { Middleware } from 'ng-diagram';

/**
 * Everything the canvas may still do while a run is in progress. These are
 * `context.modelActionTypes` values: the `ModelActionType` union plus the
 * viewport actions the library reports as plain strings. Anything else
 * — adding, removing, editing, linking, resizing, rotating, pasting — is an
 * edit and gets cancelled. An allow-list rather than a list of blocked
 * actions, so an action added to the library later cannot slip through the
 * lock unnoticed.
 */
const ALLOWED_WHILE_RUNNING = new Set<string>([
  // Lifecycle and looking around.
  'init',
  'changeSelection',
  'selectEnd',
  'changeZOrder',
  'moveViewport',
  'zoom',
  'zoomToFit',
  'centerOnNode',
  'centerOnRect',
  'updateViewportSize',
  // Dragging nodes around is allowed; only their positions change.
  'moveNodes',
  'moveNodesBy',
  'moveNodesStart',
  'moveNodesStop',
  'cancelDrag',
  // Measurement, not editing: sizes of nodes, ports and edge labels are
  // reported by the renderer through these actions.
  'updateNodes',
  'addPortsBulk',
  'updatePortsBulk',
  'deletePortsBulk',
  'addEdgeLabelsBulk',
  'updateEdgeLabelsBulk',
  'deleteEdgeLabelsBulk',
]);

/**
 * Makes the workflow read-only while `isLocked()` (a run is in progress):
 * every model action that is not on the allow-list above is cancelled.
 * Selecting, panning, zooming and moving nodes around still work.
 */
export function createRunLockMiddleware(isLocked: () => boolean): Middleware<'run-lock'> {
  return {
    name: 'run-lock',
    execute: (context, next, cancel) => {
      const edited = context.modelActionTypes.some((type) => !ALLOWED_WHILE_RUNNING.has(type));
      if (edited && isLocked()) {
        cancel();
        return;
      }
      next();
    },
  };
}
