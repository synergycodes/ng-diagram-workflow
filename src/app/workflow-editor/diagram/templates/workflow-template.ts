import type { Edge, Node } from 'ng-diagram';
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
  model: { nodes: Node<WorkflowNodeData>[]; edges: Edge<WorkflowEdgeData>[] };
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
