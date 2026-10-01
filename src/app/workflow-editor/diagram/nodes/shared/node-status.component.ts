import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NodeRunStatusDirective } from './node-run-status.directive';

const LOOK = {
  running: { icon: 'ph-circle-notch', label: 'Running' },
  waiting: { icon: 'ph-hourglass-medium', label: 'Waiting' },
  succeeded: { icon: 'ph-check-circle', label: 'Done' },
  failed: { icon: 'ph-x-circle', label: 'Failed' },
} as const;

/**
 * Pill above the node card with the step's live run status. Reads it from the
 * `NodeRunStatusDirective` on the node template's host, whose
 * `data-run-status` attribute also sets the `--run-status-color` it is drawn in.
 */
@Component({
  selector: 'app-node-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './node-status.component.html',
  styleUrl: './node-status.component.scss',
})
export class NodeStatusComponent {
  private readonly state = inject(NodeRunStatusDirective).state;

  /** Everything the pill renders, or `undefined` when there is nothing to show. */
  protected readonly pill = computed(() => {
    const state = this.state();
    if (!state) return undefined;
    const { icon, label } = LOOK[state.status];
    return { status: state.status, icon, label: state.message || label };
  });
}
