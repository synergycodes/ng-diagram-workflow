import type { Middleware } from 'ng-diagram';

/**
 * Makes the workflow read-only while `isLocked()` (a run is in progress):
 * adding, removing or editing nodes and connections is cancelled. Selecting,
 * panning, zooming and moving nodes around still work.
 */
export function createRunLockMiddleware(isLocked: () => boolean): Middleware<'run-lock'> {
  return {
    name: 'run-lock',
    execute: (context, next, cancel) => {
      const { helpers } = context;
      const edited =
        helpers.anyNodesAdded() ||
        helpers.anyNodesRemoved() ||
        helpers.anyEdgesAdded() ||
        helpers.anyEdgesRemoved() ||
        helpers.checkIfAnyNodePropsChanged(['data']) ||
        helpers.checkIfAnyEdgePropsChanged(['data']);
      if (edited && isLocked()) {
        cancel();
        return;
      }
      next();
    },
  };
}
