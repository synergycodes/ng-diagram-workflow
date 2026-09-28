import { computed, inject, Injectable } from '@angular/core';
import {
  NgDiagramClipboardService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  type Point,
} from 'ng-diagram';

/**
 * Edit operations shared by the context menus: clipboard (copy / cut / paste)
 * and delete. Paste availability follows the diagram's clipboard state, so it
 * also reflects copies made with keyboard shortcuts.
 */
@Injectable()
export class EditorActionsService {
  private readonly clipboard = inject(NgDiagramClipboardService);
  private readonly selection = inject(NgDiagramSelectionService);
  private readonly diagram = inject(NgDiagramService);
  private readonly viewport = inject(NgDiagramViewportService);

  /** True while the diagram clipboard holds at least one node. */
  readonly canPaste = computed(() => !!this.diagram.actionState().copyPaste?.copiedNodes.length);

  readonly hasSelection = computed(() => this.selection.selection().nodes.length > 0);

  copy(): void {
    if (!this.hasSelection()) return;
    this.clipboard.copy();
  }

  cut(): void {
    if (!this.hasSelection()) return;
    this.clipboard.cut();
  }

  /** Pastes the clipboard at a screen position (converted to flow coords). */
  pasteAt(clientPosition: Point): void {
    if (!this.canPaste()) return;
    this.clipboard.paste(this.viewport.clientToFlowPosition(clientPosition));
  }

  deleteSelection(): void {
    this.selection.deleteSelection();
  }

  /** Makes a node the sole selection (used before context-menu actions). */
  selectOnly(nodeId: string): void {
    this.selection.select([nodeId]);
  }
}
