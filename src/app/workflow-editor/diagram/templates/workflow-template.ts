import type { Edge, Node, Point } from 'ng-diagram';
import {
  LABEL_EDGE_TYPE,
  PORT_IN,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from '../model/workflow-types';

/** A ready-made workflow offered by the "Select a template" dialog. */
export interface WorkflowTemplate {
  id: string;
  name: string;
  /** Icon reference, see `NodeIconComponent` for the accepted formats. */
  icon: string;
  model: WorkflowModel;
}

/** The nodes and edges of a workflow, as the diagram model holds them. */
export interface WorkflowModel {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
}

/** A node position on the canvas; keeps seed nodes short in `createNode` calls. */
export function at(x: number, y: number): Point {
  return { x, y };
}

/** A label edge from a node's output port into another node's input port. */
export function edge(
  source: string,
  sourcePort: string,
  target: string,
  label?: string,
): Edge<WorkflowEdgeData> {
  return {
    id: `${source}:${sourcePort}__${target}`,
    type: LABEL_EDGE_TYPE,
    source,
    sourcePort,
    target,
    targetPort: PORT_IN,
    data: label ? { label } : {},
  };
}
