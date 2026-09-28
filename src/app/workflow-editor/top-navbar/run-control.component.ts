import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutionService } from '../execution/execution.service';

const OUTCOME_LABEL = { succeeded: 'Run finished', failed: 'Run failed', stopped: 'Run stopped' };

/** Navbar Run / Stop / Reset for a simulated run of the current workflow. */
@Component({
  selector: 'app-run-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (execution.state()) {
      @case ('running') {
        <span class="p10 note">Editing locked</span>
        <button class="button h10" type="button" (click)="execution.stop()">
          <i class="ph ph-stop" aria-hidden="true"></i>
          Stop
        </button>
      }
      @case ('finished') {
        @if (execution.outcome(); as outcome) {
          <span class="p10 note" [class]="outcome" role="status">{{ outcomeLabel[outcome] }}</span>
        }
        <button class="button h10" type="button" (click)="execution.reset()">
          <i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>
          Reset
        </button>
        <button class="button h10" type="button" (click)="execution.run()">
          <i class="ph ph-play" aria-hidden="true"></i>
          Run again
        </button>
      }
      @default {
        <button class="button h10" type="button" (click)="execution.run()">
          <i class="ph ph-play" aria-hidden="true"></i>
          Run
        </button>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid var(--wf-stroke);
      border-radius: 8px;
      background: var(--wf-bg-panel);
      color: var(--wf-text-primary);
      cursor: pointer;

      &:hover {
        background: var(--wf-bg-secondary);
      }
    }

    .note {
      color: var(--wf-text-tertiary);

      &.succeeded {
        color: var(--wf-status-succeeded);
      }
      &.failed {
        color: var(--wf-status-failed);
      }
    }
  `,
})
export class RunControlComponent {
  protected readonly execution = inject(ExecutionService);
  protected readonly outcomeLabel = OUTCOME_LABEL;
}
