import type { Edge, Node, Point } from 'ng-diagram';
import { isLabelEdge, isWorkflowNode } from '../diagram/model/guards';
import type { DecisionBranch, PropertyValue } from '../diagram/model/workflow-types';

/**
 * Serialized workflow: its steps plus the connections between their ports.
 * The JSON export downloads it and the execution backend runs it, so it is
 * the contract between the editor and whatever executes the workflow.
 */
export interface WorkflowDocument {
  format: 'ng-diagram-workflow';
  version: 1;
  name: string;
  generatedAt: string;
  nodes: WorkflowStep[];
  connections: WorkflowConnection[];
}

/** One step of the workflow: a node with its kind-specific settings. */
export interface WorkflowStep {
  id: string;
  kind: string;
  position: Point;
  label: string;
  description: string;
  properties: Record<string, PropertyValue>;
  branches?: DecisionBranch[];
}

/** A connection from a port of one step into another step. */
export interface WorkflowConnection {
  id: string;
  source: string;
  sourcePort?: string;
  target: string;
  targetPort?: string;
  label?: string;
}

/** Build the document for the given diagram contents. */
export function toWorkflowDocument(
  nodes: readonly Node[],
  edges: readonly Edge[],
  name: string,
): WorkflowDocument {
  return {
    format: 'ng-diagram-workflow',
    version: 1,
    name,
    generatedAt: new Date().toISOString(),
    nodes: nodes.filter(isWorkflowNode).map(({ id, position, data }) => ({
      id,
      kind: data.kind,
      position,
      label: data.label,
      description: data.description,
      properties: data.properties,
      ...(data.branches ? { branches: data.branches } : {}),
    })),
    connections: edges
      .filter(isLabelEdge)
      .map(({ id, source, sourcePort, target, targetPort, data }) => ({
        id,
        source,
        sourcePort,
        target,
        targetPort,
        ...(data.label ? { label: data.label } : {}),
      })),
  };
}
