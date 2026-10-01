import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'ng-diagram';
import { WORKFLOW_TEMPLATES } from '../templates';
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
  return { nodeById: (id: string) => nodes.get(id), edges, last: edges[edges.length - 1] };
}

describe('createsCycleWithoutExit', () => {
  it('rejects a loop between agents', () => {
    const { nodeById, edges, last } = graph({ a: AiAgent, b: AiAgent }, [
      ['a', 'b'],
      ['b', 'a'],
    ]);
    expect(createsCycleWithoutExit(nodeById, edges, last)).toBe(true);
  });

  it('accepts the same loop when a Decision or an Approval can end it', () => {
    for (const exit of [Decision, Approval]) {
      const { nodeById, edges, last } = graph({ gen: AiAgent, evaluate: AiAgent, check: exit }, [
        ['gen', 'evaluate'],
        ['evaluate', 'check'],
        ['check', 'gen'],
      ]);
      expect(createsCycleWithoutExit(nodeById, edges, last), exit).toBe(false);
    }
  });

  it('rejects a loop that bypasses a Decision elsewhere in the flow', () => {
    const { nodeById, edges, last } = graph({ d: Decision, a: AiAgent, b: AiAgent }, [
      ['d', 'a'],
      ['a', 'b'],
      ['b', 'a'],
    ]);
    expect(createsCycleWithoutExit(nodeById, edges, last)).toBe(true);
  });

  /** Every seed workflow has to survive the rule that runs when it is loaded. */
  it('accepts every connection in the shipped templates', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      const nodes = new Map<string, Node>(template.model.nodes.map((node) => [node.id, node]));
      for (const edge of template.model.edges) {
        expect(
          createsCycleWithoutExit((id) => nodes.get(id), template.model.edges, edge),
          `${template.id}: ${edge.id}`,
        ).toBe(false);
      }
    }
  });

  it('accepts flows without a cycle, including a parallel fan-out and merge', () => {
    const { nodeById, edges, last } = graph({ t: Trigger, a: AiAgent, b: AiAgent, m: Merge }, [
      ['t', 'a'],
      ['t', 'b'],
      ['a', 'm'],
      ['b', 'm'],
    ]);
    expect(createsCycleWithoutExit(nodeById, edges, last)).toBe(false);
  });
});
