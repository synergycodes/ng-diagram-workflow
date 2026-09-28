import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { NodeRunState } from '../../../execution/execution.service';

const LOOK = {
  running: { icon: 'ph-circle-notch', label: 'Running' },
  waiting: { icon: 'ph-hourglass-medium', label: 'Waiting' },
  succeeded: { icon: 'ph-check-circle', label: 'Done' },
  failed: { icon: 'ph-x-circle', label: 'Failed' },
} as const;

/** Pill above the node card with the step's live run status. */
@Component({
  selector: 'app-node-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (look(); as look) {
      <span class="pill p11" [class]="state()!.status" role="status">
        <i class="ph {{ look.icon }}" aria-hidden="true"></i>
        {{ state()!.message || look.label }}
      </span>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 1;
      top: -0.875rem;
      right: 0.75rem;
      pointer-events: none;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      max-width: 13rem;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      background: var(--status-color);
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .running {
      --status-color: var(--wf-status-running);
      i {
        animation: spin 0.9s linear infinite;
      }
    }
    .waiting {
      --status-color: var(--wf-status-waiting);
    }
    .succeeded {
      --status-color: var(--wf-status-succeeded);
    }
    .failed {
      --status-color: var(--wf-status-failed);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class NodeStatusComponent {
  readonly state = input<NodeRunState | undefined>();

  protected readonly look = computed(() => {
    const state = this.state();
    return state ? LOOK[state.status] : undefined;
  });
}
