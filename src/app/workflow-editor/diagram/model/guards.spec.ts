import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'ng-diagram';
import { createNodeData } from './node-catalog';
import { isLabelEdge, isStartNode, isWorkflowNode } from './guards';
import { LABEL_EDGE_TYPE, WORKFLOW_NODE_TYPE, WorkflowNodeKind } from './workflow-types';

function node(kind: WorkflowNodeKind, type: string = WORKFLOW_NODE_TYPE): Node {
  return { id: 'n', type, position: { x: 0, y: 0 }, data: createNodeData(kind) };
}

describe('isWorkflowNode', () => {
  it('accepts workflow nodes and rejects others / nullish', () => {
    expect(isWorkflowNode(node(WorkflowNodeKind.Action))).toBe(true);
    expect(isWorkflowNode(node(WorkflowNodeKind.Action, 'unknown'))).toBe(false);
    expect(isWorkflowNode({ id: 'x', position: { x: 0, y: 0 }, data: {} })).toBe(false);
    expect(isWorkflowNode(null)).toBe(false);
  });
});

describe('isStartNode', () => {
  it('is true only for triggers', () => {
    expect(isStartNode(node(WorkflowNodeKind.Trigger))).toBe(true);
    expect(isStartNode(node(WorkflowNodeKind.Delay))).toBe(false);
    expect(isStartNode(undefined)).toBe(false);
  });
});

describe('isLabelEdge', () => {
  it('accepts label edges only', () => {
    const edge = { id: 'e', source: 'a', target: 'b', data: {} } as Edge;
    expect(isLabelEdge({ ...edge, type: LABEL_EDGE_TYPE })).toBe(true);
    expect(isLabelEdge(edge)).toBe(false);
    expect(isLabelEdge(null)).toBe(false);
  });
});
