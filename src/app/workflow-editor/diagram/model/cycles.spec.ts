import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'ng-diagram';
import { createNode } from './node-catalog';
import { createsCycleWithoutExit } from './cycles';
import { WorkflowNodeKind } from './workflow-types';

const { AiAgent, Approval, Decision, Merge, Trigger } = WorkflowNodeKind;

function graph(kinds: Record<string, WorkflowNodeKind>, links: [string, string][]) {
  const nodes = new Map<string, Node>(
    Object.entries(kinds).map(([id, kind]) => [id, createNode(id, kind, { x: 0, y: 0 })]),
  );
  const edges: Edge[] = links.map(([source, target]) => ({
    id: `${source}->${target}`,
    source,
    target,
    data: {},
  }));
  return { nodes, edges, last: edges[edges.length - 1] };
}

describe('createsCycleWithoutExit', () => {
  it('rejects a loop between agents', () => {
    const { nodes, edges, last } = graph({ a: AiAgent, b: AiAgent }, [
      ['a', 'b'],
      ['b', 'a'],
    ]);
    expect(createsCycleWithoutExit(nodes, edges, last)).toBe(true);
  });

  it('accepts the same loop when a Decision or an Approval can end it', () => {
    for (const exit of [Decision, Approval]) {
      const { nodes, edges, last } = graph({ gen: AiAgent, evaluate: AiAgent, check: exit }, [
        ['gen', 'evaluate'],
        ['evaluate', 'check'],
        ['check', 'gen'],
      ]);
      expect(createsCycleWithoutExit(nodes, edges, last), exit).toBe(false);
    }
  });

  it('rejects a loop that bypasses a Decision elsewhere in the flow', () => {
    const { nodes, edges, last } = graph({ d: Decision, a: AiAgent, b: AiAgent }, [
      ['d', 'a'],
      ['a', 'b'],
      ['b', 'a'],
    ]);
    expect(createsCycleWithoutExit(nodes, edges, last)).toBe(true);
  });

  it('accepts flows without a cycle, including a parallel fan-out and merge', () => {
    const { nodes, edges, last } = graph({ t: Trigger, a: AiAgent, b: AiAgent, m: Merge }, [
      ['t', 'a'],
      ['t', 'b'],
      ['a', 'm'],
      ['b', 'm'],
    ]);
    expect(createsCycleWithoutExit(nodes, edges, last)).toBe(false);
  });
});
