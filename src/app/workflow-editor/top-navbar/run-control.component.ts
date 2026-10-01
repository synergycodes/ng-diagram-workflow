import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutionService } from '../execution/execution.service';

const OUTCOME_LABEL = { succeeded: 'Run finished', failed: 'Run failed', stopped: 'Run stopped' };

/** Navbar Run / Stop / Reset for a simulated run of the current workflow. */
@Component({
  selector: 'app-run-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './run-control.component.html',
  styleUrl: './run-control.component.scss',
})
export class RunControlComponent {
  protected readonly execution = inject(ExecutionService);
  protected readonly outcomeLabel = OUTCOME_LABEL;
}
