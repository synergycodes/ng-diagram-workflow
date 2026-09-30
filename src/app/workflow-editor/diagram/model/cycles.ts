import type { Edge, Node } from 'ng-diagram';
import { isLoopExit } from './guards';

/** The ends of a connection, drawn or already in the model. */
export type Connection = Pick<Edge, 'source' | 'target'>;

/**
 * True when `edge` closes a loop that no branching node can end, i.e. the
 * flow could go round forever. Loops through a Decision or Approval are fine
 * (reflection loop, review-and-revise). Walks forward from the edge's target
 * without passing through exits and checks whether it gets back to the source.
 *
 * Takes only the ends of the connection, so the rule can judge a connection
 * being drawn (`linking.validateConnection`) as well as one already in a
 * model update (the `cycle-needs-exit` middleware).
 */
export function createsCycleWithoutExit(
  nodes: ReadonlyMap<string, Node>,
  edges: Iterable<Connection>,
  edge: Connection,
): boolean {
  const isExit = (id: string) => isLoopExit(nodes.get(id));
  if (isExit(edge.source) || isExit(edge.target)) return false;

  const next = new Map<string, string[]>();
  for (const { source, target } of edges) {
    next.set(source, [...(next.get(source) ?? []), target]);
  }

  const seen = new Set([edge.target]);
  const queue = [edge.target];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === edge.source) return true;
    for (const target of next.get(id) ?? []) {
      if (seen.has(target) || isExit(target)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return false;
}
