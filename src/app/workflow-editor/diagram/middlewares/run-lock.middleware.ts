import type { Middleware, MiddlewareHelpers } from 'ng-diagram';

/** Edge properties that say which steps, and which of their ports, a connection joins. */
const CONNECTION_ENDS = ['source', 'target', 'sourcePort', 'targetPort'];

/**
 * True when the update changes the workflow itself: steps or connections added
 * or removed, their settings (`data`), or where a connection attaches. Layout
 * (position, size, rotation, z-order), selection, the viewport and the sizes the
 * renderer measures are not edits.
 */
function editsWorkflow(helpers: MiddlewareHelpers): boolean {
  return (
    helpers.anyNodesAdded() ||
    helpers.anyNodesRemoved() ||
    helpers.anyEdgesAdded() ||
    helpers.anyEdgesRemoved() ||
    helpers.checkIfAnyNodePropsChanged(['data']) ||
    helpers.checkIfAnyEdgePropsChanged(['data', ...CONNECTION_ENDS])
  );
}

/**
 * Makes the workflow read-only while `isLocked()` (a run is in progress): an
 * update that edits the workflow is cancelled, everything else goes through,
 * so selecting, panning, zooming and moving nodes around still work.
 *
 * Judges what the update changes rather than which action asked for it,
 * because one action type can be both: `updateNodes` carries the node sizes
 * the renderer measures and is also `NgDiagramModelService.updateNodes`, the
 * public bulk update. Actions added to the library later are judged the same way.
 */
export function createRunLockMiddleware(isLocked: () => boolean): Middleware<'run-lock'> {
  return {
    name: 'run-lock',
    execute: ({ helpers }, next, cancel) => {
      if (isLocked() && editsWorkflow(helpers)) {
        cancel();
        return;
      }
      next();
    },
  };
}
