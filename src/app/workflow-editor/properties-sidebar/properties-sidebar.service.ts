import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Edge, type Node } from 'ng-diagram';
import { isLabelEdge, isWorkflowNode } from '../diagram/model/guards';
import {
  branchPortId,
  type WorkflowEdgeData,
  type WorkflowNodeData,
} from '../diagram/model/workflow-types';

type SidebarState = 'empty' | 'node' | 'edge' | 'multi';

/**
 * Drives the properties sidebar: tracks panel visibility, exposes the current
 * single selection (a node or an edge) and applies edits back to the model.
 */
@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);

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

  readonly sidebarState = computed<SidebarState>(() => {
    if (this.selectedNode()) return 'node';
    if (this.selectedEdge()) return 'edge';
    const count = this.selectedNodes().length + this.selectedEdges().length;
    return count === 0 ? 'empty' : 'multi';
  });

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }

  /**
   * Writes a node's data back to the model. When decision branches were
   * removed, the connections leaving their ports are removed too so no edge is
   * left pointing at a port that no longer exists.
   */
  updateNodeData(nodeId: string, data: WorkflowNodeData): void {
    const node = this.modelService.getNodeById<WorkflowNodeData>(nodeId);
    if (!node) return;

    const removedPorts = new Set(
      (node.data.branches ?? [])
        .filter((old) => !data.branches?.some((branch) => branch.id === old.id))
        .map((branch) => branchPortId(branch.id)),
    );
    if (removedPorts.size > 0) {
      const orphans = this.modelService
        .edges()
        .filter((edge) => edge.source === nodeId && removedPorts.has(edge.sourcePort ?? ''))
        .map((edge) => edge.id);
      this.modelService.deleteEdges(orphans);
    }

    this.modelService.updateNodeData<WorkflowNodeData>(nodeId, data);
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
