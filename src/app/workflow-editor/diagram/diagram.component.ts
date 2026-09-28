import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type Edge,
  type NgDiagramConfig,
  type Node,
  type PaletteItemDroppedEvent,
  type Port,
  type SelectionGestureEndedEvent,
} from 'ng-diagram';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { PaletteDragService } from '../palette-sidebar/palette-drag.service';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { WORKFLOW_EDITOR_CONFIG } from '../workflow-editor.config';
import { workflowModel } from './data';
import { LabelEdgeComponent } from './edges/label-edge/label-edge.component';
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
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly paletteDrag = inject(PaletteDragService);

  private readonly grid = { width: this.config.gridSize, height: this.config.gridSize };

  diagramConfig = {
    linking: {
      // Workflows flow forward: no self-loops and nothing may enter a start node.
      validateConnection: (
        source: Node | null,
        sourcePort: Port | null,
        target: Node | null,
        targetPort: Port | null,
      ) => {
        if (!source || !target || !sourcePort || !targetPort) return false;
        if (source.id === target.id) return false;
        if (targetPort.type === 'source') return false;
        return !isStartNode(target);
      },
      // Every drawn connection becomes a label edge without arrowheads.
      temporaryEdgeDataBuilder: (edge: Edge) => withLabelEdge(edge),
      finalEdgeDataBuilder: (edge: Edge) => withLabelEdge(edge),
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
    zoom: { min: 0.1, max: 2 },
    zIndex: { elevateOnSelection: true },
    watermarkPosition: 'bottom-left',
  } satisfies NgDiagramConfig;

  nodeTemplateMap = new NgDiagramNodeTemplateMap(Object.entries(NODE_TEMPLATE_COMPONENTS));
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([[LABEL_EDGE_TYPE, LabelEdgeComponent]]);

  model = initializeModel(workflowModel);

  onDiagramInit(): void {
    const pad = this.config.viewport.zoomToFitPadding;
    // Extra room on each side keeps the workflow clear of the overlay panels.
    void this.viewportService.zoomToFit({ padding: [pad + 72, pad + 72, pad + 72, pad + 340] });
  }

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
    data: edge.data ?? {},
    sourceArrowhead: undefined,
    targetArrowhead: undefined,
  };
}
