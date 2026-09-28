import type { Middleware } from 'ng-diagram';
import { createsCycleWithoutExit } from '../model/cycles';

/**
 * Graph-level rule, checked while the workflow is being drawn: a new
 * connection may close a loop only if a Decision or Approval can end it.
 * Runs for every way an edge appears (drawing, paste, loading a template).
 * Port-level rules stay in `linking.validateConnection`.
 */
export const cycleExitMiddleware: Middleware<'cycle-needs-exit'> = {
  name: 'cycle-needs-exit',
  execute: (context, next, cancel) => {
    if (context.helpers.anyEdgesAdded()) {
      const edges = [...context.edgesMap.values()];
      const endless = context.helpers
        .getAddedEdges()
        .some((edge) => createsCycleWithoutExit(context.nodesMap, edges, edge));
      if (endless) {
        cancel();
        return;
      }
    }
    next();
  },
};
