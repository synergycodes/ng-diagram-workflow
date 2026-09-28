import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { WORKFLOW_TEMPLATES } from '../diagram/templates';
import { NodeIconComponent } from '../diagram/nodes/shared/node-icon.component';
import { TemplateSelectorService } from './template-selector.service';

/**
 * "Select a template" dialog: one tile per ready-made workflow plus an empty
 * canvas. A native `<dialog>`, so Escape and focus trapping come for free.
 */
@Component({
  selector: 'app-template-selector',
  imports: [NodeIconComponent],
  templateUrl: './template-selector.component.html',
  styleUrl: './template-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSelectorComponent {
  protected readonly selector = inject(TemplateSelectorService);
  protected readonly templates = WORKFLOW_TEMPLATES;

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.selector.isOpen() && !dialog.open) dialog.showModal();
      if (!this.selector.isOpen() && dialog.open) dialog.close();
    });
  }

  /** A click on the dialog element itself (not its content) is a backdrop click. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.selector.close();
  }
}
