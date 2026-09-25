import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent } from 'ng-diagram';
import { NODE_CATALOG, toPaletteItem } from '../../../diagram/model/node-catalog';
import type { WorkflowNodeKind } from '../../../diagram/model/workflow-types';
import { NodeHeaderComponent } from '../../../diagram/nodes/shared/node-header.component';

/**
 * A draggable library tile. Like in Workflow Builder, the tile *is* a preview
 * of the node card (without ports). Wraps ng-diagram's palette item so
 * dropping it on the canvas creates the matching node; the preview element is
 * used as the drag image.
 */
@Component({
  selector: 'app-palette-tile',
  imports: [
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
    NodeHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(dragstart)': 'onDragStart($event)' },
  template: `
    <ng-diagram-palette-item [item]="item()">
      <div class="tile">
        <app-node-header
          [icon]="def().icon"
          [label]="def().label"
          [description]="def().description"
          [variant]="variant()"
        />
      </div>
      <ng-diagram-palette-item-preview>
        <div class="tile preview">
          <app-node-header
            [icon]="def().icon"
            [label]="def().label"
            [description]="def().description"
            [variant]="variant()"
          />
        </div>
      </ng-diagram-palette-item-preview>
    </ng-diagram-palette-item>
  `,
  styleUrl: './palette-tile.component.scss',
})
export class PaletteTileComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly kind = input.required<WorkflowNodeKind>();

  protected readonly item = computed(() => toPaletteItem(this.kind()));
  protected readonly def = computed(() => NODE_CATALOG[this.kind()]);
  protected readonly variant = computed(() =>
    this.def().template === 'ai-agent' ? 'ai' : 'default',
  );

  /**
   * Centre the drag preview on the cursor. ng-diagram sets the drag image with a
   * top-left anchor (`setDragImage(node, 0, 0)`) on the inner palette element;
   * this handler runs later in the bubble phase and re-sets it with a centred
   * offset (the last `setDragImage` call during dragstart wins).
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

    const rect = ghost.getBoundingClientRect();
    transfer.setDragImage(ghost, (rect.width || 258) / 2, (rect.height || 64) / 2);
    requestAnimationFrame(() => ghost.remove());
  }
}
