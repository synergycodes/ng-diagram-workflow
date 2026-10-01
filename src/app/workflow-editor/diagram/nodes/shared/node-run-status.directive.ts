import { computed, Directive, inject, input } from '@angular/core';
import type { Node } from 'ng-diagram';
import { ExecutionService } from '../../../execution/execution.service';

/**
 * Exposes what the backend reports for this node: `state()` for the template
 * and a `data-run-status` attribute on the host for the card styles.
 */
@Directive({
  selector: '[appNodeRunStatus]',
  host: { '[attr.data-run-status]': 'state()?.status' },
})
export class NodeRunStatusDirective {
  private readonly execution = inject(ExecutionService);
  readonly node = input.required<Node>();

  readonly state = computed(() => this.execution.statuses()[this.node().id]);
}
