import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  NgDiagramViewportService,
  type Node,
} from 'ng-diagram';
import { NODE_CATALOG, toPaletteItem } from '../../../diagram/model/node-catalog';
import type { WorkflowNodeData, WorkflowNodeKind } from '../../../diagram/model/workflow-types';
import { NODE_TEMPLATE_COMPONENTS } from '../../../diagram/nodes/node-templates';
import { NodeHeaderComponent } from '../../../diagram/nodes/shared/node-header.component';
import { PaletteDragService } from '../../palette-drag.service';

/**
 * A draggable library tile. Like in Workflow Builder, the tile shows the node
 * header. Wraps ng-diagram's palette item so dropping it on the canvas creates
 * the matching node; while dragging, the drag image is the real node template
 * (ng-diagram does not show ports outside the canvas) so it looks exactly like
 * the node that will be created.
 */
@Component({
  selector: 'app-palette-tile',
  imports: [
    NgComponentOutlet,
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
    NodeHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown()',
    '(dragstart)': 'onDragStart($event)',
  },
  template: `
    <ng-diagram-palette-item [item]="item()">
      <div class="tile">
        <app-node-header
          [icon]="def().icon"
          [label]="def().label"
          [description]="def().description"
          [variant]="def().variant"
        />
      </div>
      <ng-diagram-palette-item-preview>
        <div class="preview">
          <ng-container *ngComponentOutlet="previewComponent(); inputs: { node: previewNode() }" />
        </div>
      </ng-diagram-palette-item-preview>
    </ng-diagram-palette-item>
  `,
  styleUrl: './palette-tile.component.scss',
})
export class PaletteTileComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly scale = inject(NgDiagramViewportService).scale;
  private readonly paletteDrag = inject(PaletteDragService);

  readonly kind = input.required<WorkflowNodeKind>();

  protected readonly item = computed(() => toPaletteItem(this.kind()));
  protected readonly def = computed(() => NODE_CATALOG[this.kind()]);

  /** The node the drop will create, rendered by its own template as the preview. */
  protected readonly previewComponent = computed(
    () => NODE_TEMPLATE_COMPONENTS[this.def().template],
  );
  protected readonly previewNode = computed<Node<WorkflowNodeData>>(() => ({
    id: `palette-preview-${this.kind()}`,
    type: this.item().type,
    position: { x: 0, y: 0 },
    data: this.item().data,
  }));

  /**
   * Every gesture starts without a centring offset. Only a mouse drag sets one
   * (in `onDragStart`); a touch drag has no `dragstart`, so its node is dropped
   * with the top-left corner at the finger, as ng-diagram places it.
   */
  protected onPointerDown(): void {
    this.paletteDrag.grabOffset = null;
  }

  /**
   * Centre the drag preview on the cursor, at the canvas zoom level. ng-diagram
   * sets the drag image with a top-left anchor (`setDragImage(node, 0, 0)`) on
   * the inner palette element; this handler runs later in the bubble phase and
   * re-sets it with a centred offset (the last `setDragImage` call during
   * dragstart wins). The clone is zoomed to the viewport scale so the preview
   * matches the size of the node dropped on the canvas. The centring offset is
   * shared with the canvas, which aligns the dropped node with the preview.
   */
  protected onDragStart(event: DragEvent): void {
    const transfer = event.dataTransfer;
    const preview = this.host.nativeElement.querySelector<HTMLElement>('.preview');
    if (!transfer || !preview) return;

    const ghost = preview.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.margin = '0';
    document.body.appendChild(ghost);

    // Unzoomed size = node size in flow units.
    const rect = ghost.getBoundingClientRect();
    const halfWidth = (rect.width || 258) / 2;
    const halfHeight = (rect.height || 64) / 2;
    this.paletteDrag.grabOffset = { x: halfWidth, y: halfHeight };

    const scale = this.scale();
    ghost.style.zoom = String(scale);
    transfer.setDragImage(ghost, halfWidth * scale, halfHeight * scale);
    requestAnimationFrame(() => ghost.remove());
  }
}
