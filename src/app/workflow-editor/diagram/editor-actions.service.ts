import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NgDiagramClipboardService,
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type Point,
} from 'ng-diagram';

/**
 * Edit operations shared by the context menus: clipboard (copy / cut / paste)
 * and delete. Tracks whether the user has ever copied/cut, which gates the
 * Paste menu item. This is a one-way "has ever copied" hint, not live
 * clipboard state (ng-diagram does not expose a clipboard-content signal).
 */
@Injectable()
export class EditorActionsService {
  private readonly clipboard = inject(NgDiagramClipboardService);
  private readonly selection = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);

  /** Set once the user copies/cuts; gates the Paste menu item (one-way hint). */
  readonly hasEverCopied = signal(false);

  readonly hasSelection = computed(() => this.selection.selection().nodes.length > 0);

  copy(): void {
    if (!this.hasSelection()) return;
    this.clipboard.copy();
    this.hasEverCopied.set(true);
  }

  cut(): void {
    if (!this.hasSelection()) return;
    this.clipboard.cut();
    this.hasEverCopied.set(true);
  }

  /** Pastes the clipboard at a screen position (converted to flow coords). */
  pasteAt(clientPosition: Point): void {
    if (!this.hasEverCopied()) return;
    this.clipboard.paste(this.viewport.clientToFlowPosition(clientPosition));
  }

  deleteSelection(): void {
    this.selection.deleteSelection();
  }

  /** Ensures a node is the sole selection (used before context-menu actions). */
  selectOnly(nodeId: string): void {
    const already = this.selection.selection().nodes;
    if (already.length === 1 && already[0].id === nodeId) return;
    this.selection.deselectAll();
    if (this.modelService.getNodeById(nodeId)) {
      this.selection.select([nodeId]);
    }
  }
}
