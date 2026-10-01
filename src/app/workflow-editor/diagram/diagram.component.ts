import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  createMiddlewares,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramSelectionService,
  type Edge,
  type NgDiagramConfig,
  type Node,
  type PaletteItemDroppedEvent,
  type Port,
  type SelectionGestureEndedEvent,
} from 'ng-diagram';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { EditorNoticeService } from '../editor-notice.service';
import { ExecutionService } from '../execution/execution.service';
import { PaletteDragService } from '../palette-sidebar/palette-drag.service';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { TemplateSelectorService } from '../template-selector/template-selector.service';
import { canvasFitPadding, WORKFLOW_EDITOR_CONFIG } from '../workflow-editor.config';
import { LabelEdgeComponent } from './edges/label-edge/label-edge.component';
import { createCycleExitMiddleware } from './middlewares/cycle-exit.middleware';
import { createRunLockMiddleware } from './middlewares/run-lock.middleware';
import { createsCycleWithoutExit } from './model/cycles';
import { isStartNode } from './model/guards';
import { LABEL_EDGE_TYPE } from './model/workflow-types';
import { NODE_TEMPLATE_COMPONENTS } from './nodes/node-templates';

/**
 * Workflow editor canvas.
 *
 * Hosts the ng-diagram surface with one template per node layout (the node
 * kind itself is carried in `data.kind`) and a labelled edge template. Nodes
 * are placed by dragging tiles from the palette.
 */
@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramComponent {
  private readonly config = inject(WORKFLOW_EDITOR_CONFIG);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly paletteDrag = inject(PaletteDragService);
  private readonly execution = inject(ExecutionService);
  private readonly notice = inject(EditorNoticeService);

  private readonly grid = { width: this.config.gridSize, height: this.config.gridSize };

  diagramConfig = {
    linking: {
      // Checked while the connection is being drawn, so an invalid target
      // simply refuses to snap: workflows flow forward (no self-loops, nothing
      // enters a start node) and a loop needs a Decision or an Approval to end
      // it. The graph rule runs as middleware too, for the ways an edge can
      // appear without being drawn.
      validateConnection: (
        source: Node | null,
        sourcePort: Port | null,
        target: Node | null,
        targetPort: Port | null,
      ) => {
        if (!source || !target || !sourcePort || !targetPort) return false;
        if (source.id === target.id) return false;
        if (isStartNode(target)) return false;
        return !this.closesEndlessLoop(source.id, target.id);
      },
      // Every drawn connection becomes a label edge without arrowheads.
      temporaryEdgeDataBuilder: withLabelEdge,
      finalEdgeDataBuilder: withLabelEdge,
    },
    // Orthogonal paths with rounded corners, like Workflow Builder's smooth-step edges.
    edgeRouting: {
      defaultRouting: 'orthogonal',
      orthogonal: { maxCornerRadius: 16, firstLastSegmentLength: 20 },
    },
    background: { dotSpacing: this.config.gridSize },
    snapping: {
      shouldSnapDragForNode: () => true,
      defaultDragSnap: this.grid,
    },
    zoom: {
      min: 0.1,
      max: 2,
      zoomToFit: {
        onInit: true,
        // Extra room on each side keeps the workflow clear of the overlay panels.
        padding: canvasFitPadding(this.config),
      },
    },
    watermarkPosition: 'bottom-left',
  } satisfies NgDiagramConfig;

  // Graph-level rules run as middleware on every model change. The run lock
  // goes first, so an edit it cancels never reaches the other middlewares.
  middlewares = createMiddlewares((defaults) => [
    createRunLockMiddleware(() => this.execution.isRunning()),
    ...defaults,
    createCycleExitMiddleware((message) => this.notice.report(message)),
  ]);

  nodeTemplateMap = new NgDiagramNodeTemplateMap(Object.entries(NODE_TEMPLATE_COMPONENTS));
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([[LABEL_EDGE_TYPE, LabelEdgeComponent]]);

  // The workflow to show: the starting template, then whatever the template picker loads.
  model = inject(TemplateSelectorService).model;

  /**
   * Align a freshly dropped node with the drag preview (centred on the cursor),
   * then select it and open its properties.
   */
  async onPaletteItemDropped(event: PaletteItemDroppedEvent): Promise<void> {
    const offset = this.paletteDrag.grabOffset;
    this.paletteDrag.grabOffset = null;
    if (offset) {
      // ng-diagram already snapped the drop point; shifting by whole grid cells keeps it snapped.
      const { position } = event.node;
      const snap = (value: number) =>
        Math.round(value / this.config.gridSize) * this.config.gridSize;
      await this.modelService.updateNode(event.node.id, {
        position: { x: position.x - snap(offset.x), y: position.y - snap(offset.y) },
      });
    }
    this.selectionService.select([event.node.id]);
    this.sidebarService.expandSidebar();
  }

  /** Open the properties sidebar whenever something is selected. */
  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    if (event.nodes.length > 0 || event.edges.length > 0) {
      this.sidebarService.expandSidebar();
    }
  }

  /** True when connecting `source` to `target` would close a loop nothing can end. */
  private closesEndlessLoop(source: string, target: string): boolean {
    return createsCycleWithoutExit(
      (id) => this.modelService.getNodeById(id),
      this.modelService.edges(),
      { source, target },
    );
  }

  /** Right-click on empty canvas → background context menu (paste only). */
  onBackgroundContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu.openForBackground(event.clientX, event.clientY);
  }
}

function withLabelEdge(edge: Edge): Edge {
  return {
    ...edge,
    type: LABEL_EDGE_TYPE,
    targetArrowhead: undefined,
  };
}
