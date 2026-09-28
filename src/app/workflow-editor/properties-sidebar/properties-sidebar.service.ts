import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  type Edge,
  type Node,
} from 'ng-diagram';
import { isLabelEdge, isWorkflowNode } from '../diagram/model/guards';
import {
  branchPortId,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from '../diagram/model/workflow-types';

/**
 * Drives the properties sidebar: tracks panel visibility, exposes the current
 * single selection (a node or an edge) and applies edits back to the model.
 */
@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  readonly isExpanded = signal(false);

  private readonly selectedNodes = computed<Node<WorkflowNodeData>[]>(() =>
    this.selectionService.selection().nodes.filter(isWorkflowNode),
  );

  private readonly selectedEdges = computed<Edge<WorkflowEdgeData>[]>(() =>
    this.selectionService.selection().edges.filter(isLabelEdge),
  );

  readonly selectedNode = computed(() =>
    this.selectedNodes().length === 1 ? this.selectedNodes()[0] : undefined,
  );

  readonly selectedEdge = computed(() =>
    this.selectedNodes().length === 0 && this.selectedEdges().length === 1
      ? this.selectedEdges()[0]
      : undefined,
  );

  readonly isSelectionEmpty = computed(
    () => this.selectedNodes().length === 0 && this.selectedEdges().length === 0,
  );

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }

  /**
   * Writes a node's data back to the model. When decision branches were
   * removed, the connections leaving their ports are removed in the same
   * transaction, so no edge is left pointing at a port that no longer exists.
   */
  updateNodeData(nodeId: string, data: WorkflowNodeData): void {
    const node = this.modelService.getNodeById<WorkflowNodeData>(nodeId);
    if (!node) return;

    const removedPorts = new Set(
      (node.data.branches ?? [])
        .filter((old) => !data.branches?.some((branch) => branch.id === old.id))
        .map((branch) => branchPortId(branch.id)),
    );
    if (removedPorts.size === 0) {
      this.modelService.updateNodeData<WorkflowNodeData>(nodeId, data);
      return;
    }

    const orphans = this.modelService
      .getConnectedEdges(nodeId)
      .filter((edge) => edge.source === nodeId && removedPorts.has(edge.sourcePort ?? ''))
      .map((edge) => edge.id);
    this.diagramService.transaction(() => {
      this.modelService.deleteEdges(orphans);
      this.modelService.updateNodeData<WorkflowNodeData>(nodeId, data);
    });
  }

  updateEdgeData(edgeId: string, data: WorkflowEdgeData): void {
    this.modelService.updateEdgeData<WorkflowEdgeData>(edgeId, data);
  }

  removeNode(nodeId: string): void {
    this.modelService.deleteNodes([nodeId]);
  }

  removeEdge(edgeId: string): void {
    this.modelService.deleteEdges([edgeId]);
  }
}
