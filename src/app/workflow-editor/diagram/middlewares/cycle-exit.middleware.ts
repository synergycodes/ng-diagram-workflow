import type { Edge, Middleware } from 'ng-diagram';
import { createsCycleWithoutExit } from '../model/cycles';

/** Message for the navbar when the rule turned connections down. */
const rejectedMessage = (count: number) =>
  count === 1
    ? 'Connection removed: a loop needs a Decision or an Approval to end it.'
    : `${count} connections removed: a loop needs a Decision or an Approval to end it.`;

/**
 * Graph-level rule: a connection may close a loop only if a Decision or an
 * Approval can end it. Runs for every way a connection appears or changes its
 * ends that the canvas cannot check up front — paste, loading a template,
 * programmatic edits. Connections being drawn are judged live in
 * `linking.validateConnection`, which is what gives the cursor feedback;
 * port-level rules live there too.
 *
 * Only the offending connections are refused, never the whole update: a new
 * one is removed, one whose ends were changed keeps its previous ends, and the
 * rest of the update goes through. `report` puts the refusal on screen, so it
 * does not happen in silence.
 */
export function createCycleExitMiddleware(
  report: (message: string) => void,
): Middleware<'cycle-needs-exit'> {
  return {
    name: 'cycle-needs-exit',
    execute: (context, next) => {
      const { helpers, nodesMap, edgesMap, initialEdgesMap } = context;
      // Both ways a connection can close a loop: a new edge, or an existing
      // one whose ends changed.
      const candidates = new Map<string, Edge>();
      for (const edge of helpers.getAddedEdges()) candidates.set(edge.id, edge);
      for (const id of helpers.getAffectedEdgeIds(['source', 'target'])) {
        const edge = edgesMap.get(id);
        if (edge) candidates.set(id, edge);
      }
      if (candidates.size === 0) {
        next();
        return;
      }

      // Judge one candidate at a time against what is already accepted, so a
      // single endless loop doesn't take the rest of the update down with it.
      const accepted = [...edgesMap.values()].filter((edge) => !candidates.has(edge.id));
      const rejected: Edge[] = [];
      for (const edge of candidates.values()) {
        if (createsCycleWithoutExit(nodesMap, accepted, edge)) rejected.push(edge);
        else accepted.push(edge);
      }
      if (rejected.length === 0) {
        next();
        return;
      }

      report(rejectedMessage(rejected.length));
      const added = rejected.filter((edge) => helpers.checkIfEdgeAdded(edge.id));
      // An existing connection goes back to the ends it had before the update.
      const restored = rejected
        .filter((edge) => !helpers.checkIfEdgeAdded(edge.id))
        .map((edge) => initialEdgesMap.get(edge.id))
        .filter((edge): edge is Edge => !!edge);
      next({
        edgesToRemove: added.map((edge) => edge.id),
        edgesToUpdate: restored,
      });
    },
  };
}
