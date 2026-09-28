import { Directive, inject, input } from '@angular/core';
import type { Node } from 'ng-diagram';
import { ContextMenuService } from '../../../context-menu/context-menu.service';
import { EditorActionsService } from '../../editor-actions.service';

/**
 * Opens the node context menu on right-click. Applied to every node template
 * as a host directive, which forwards the template's `node` input.
 */
@Directive({
  selector: '[appNodeContextMenu]',
  host: { '(contextmenu)': 'onContextMenu($event)' },
})
export class NodeContextMenuDirective {
  private readonly contextMenu = inject(ContextMenuService);
  private readonly actions = inject(EditorActionsService);

  readonly node = input.required<Node>();

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.actions.selectOnly(this.node().id);
    this.contextMenu.openForNode(event.clientX, event.clientY);
  }
}
