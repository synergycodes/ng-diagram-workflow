import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NODE_CATALOG, selectedOption } from '../../model/node-catalog';
import type { WorkflowNodeData } from '../../model/workflow-types';
import { NodeIconComponent } from './node-icon.component';

/** Summary chip on the node card: the option picked in the kind's `summaryKey` select field. */
@Component({
  selector: 'app-node-summary',
  imports: [NodeIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './node-summary.component.html',
  styleUrl: './node-summary.component.scss',
})
export class NodeSummaryComponent {
  readonly data = input.required<WorkflowNodeData>();

  protected readonly option = computed(() =>
    selectedOption(this.data(), NODE_CATALOG[this.data().kind].summaryKey),
  );
}
