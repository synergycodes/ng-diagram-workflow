import type { Middleware } from 'ng-diagram';
import { isStartNode } from '../model/guards';

/**
 * Graph-level rule: a workflow starts in one place, so it may hold only one
 * Trigger. An update that would leave a second one on the canvas — a palette
 * drop, a paste, a programmatic add — is cancelled as a whole, the other nodes
 * of a pasted fragment included. `report` says why.
 *
 * A middleware because nothing earlier can stop it: ng-diagram has no per-type
 * node limit, the palette item cannot be disabled, and `paletteItemDropped`
 * fires once the node is already in the model.
 */
export function createOneTriggerMiddleware(
  report: (message: string) => void,
): Middleware<'one-trigger'> {
  return {
    name: 'one-trigger',
    execute: ({ helpers, nodesMap }, next, cancel) => {
      if (!helpers.anyNodesAdded()) {
        next();
        return;
      }
      // `nodesMap` already holds the update, so this counts the result.
      const triggers = [...nodesMap.values()].filter(isStartNode);
      if (triggers.length > 1) {
        report('A workflow can have only one Trigger.');
        cancel();
        return;
      }
      next();
    },
  };
}
