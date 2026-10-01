import { describe, expect, it, vi } from 'vitest';
import type { Edge, MiddlewareContext, Node } from 'ng-diagram';
import { createNode } from '../model/node-catalog';
import { WorkflowNodeKind } from '../model/workflow-types';
import { createCycleExitMiddleware } from './cycle-exit.middleware';

const { AiAgent, Decision, Trigger } = WorkflowNodeKind;

function link(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target, data: {} };
}

/**
 * The slice of `MiddlewareContext` this middleware reads: the state after the
 * update, plus which edges the update added or changed the ends of.
 */
function context(options: {
  kinds: Record<string, WorkflowNodeKind>;
  edges: Edge[];
  added?: string[];
  endsChanged?: string[];
  before?: Edge[];
}): MiddlewareContext {
  const { kinds, edges, added = [], endsChanged = [], before = [] } = options;
  const nodesMap = new Map<string, Node>(
    Object.entries(kinds).map(([id, kind]) => [id, createNode(id, kind, { x: 0, y: 0 })]),
  );
  return {
    nodesMap,
    edgesMap: new Map(edges.map((edge) => [edge.id, edge])),
    initialEdgesMap: new Map(before.map((edge) => [edge.id, edge])),
    helpers: {
      getAddedEdges: () => edges.filter((edge) => added.includes(edge.id)),
      getAffectedEdgeIds: () => endsChanged,
      checkIfEdgeAdded: (id: string) => added.includes(id),
    },
  } as unknown as MiddlewareContext;
}

describe('cycle-needs-exit middleware', () => {
  it('lets an update through when no connection closes an endless loop', () => {
    const next = vi.fn();
    const report = vi.fn();
    createCycleExitMiddleware(report).execute(
      context({
        kinds: { t: Trigger, a: AiAgent },
        edges: [link('t', 'a')],
        added: ['t->a'],
      }),
      next,
      vi.fn(),
    );
    expect(next).toHaveBeenCalledWith();
    expect(report).not.toHaveBeenCalled();
  });

  /** An update with one bad connection: the good ones must survive. */
  it('removes only the connections that close an endless loop', () => {
    const next = vi.fn();
    const report = vi.fn();
    createCycleExitMiddleware(report).execute(
      context({
        kinds: { t: Trigger, a: AiAgent, b: AiAgent },
        edges: [link('t', 'a'), link('a', 'b'), link('b', 'a')],
        added: ['t->a', 'a->b', 'b->a'],
      }),
      next,
      vi.fn(),
    );
    expect(next).toHaveBeenCalledWith({ edgesToRemove: ['b->a'], edgesToUpdate: [] });
    expect(report).toHaveBeenCalledOnce();
  });

  it('allows a loop a Decision can end', () => {
    const next = vi.fn();
    createCycleExitMiddleware(vi.fn()).execute(
      context({
        kinds: { gen: AiAgent, check: Decision },
        edges: [link('gen', 'check'), link('check', 'gen')],
        added: ['gen->check', 'check->gen'],
      }),
      next,
      vi.fn(),
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('restores the previous ends of a connection whose new ends close an endless loop', () => {
    const next = vi.fn();
    const report = vi.fn();
    const before = { ...link('b', 'a'), id: 'changed', source: 'b', target: 'c' };
    const changed = { ...before, target: 'a' };
    createCycleExitMiddleware(report).execute(
      context({
        kinds: { t: Trigger, a: AiAgent, b: AiAgent, c: AiAgent },
        edges: [link('t', 'a'), link('a', 'b'), changed],
        endsChanged: ['changed'],
        before: [before],
      }),
      next,
      vi.fn(),
    );
    expect(next).toHaveBeenCalledWith({ edgesToRemove: [], edgesToUpdate: [before] });
    expect(report).toHaveBeenCalledOnce();
  });
});
