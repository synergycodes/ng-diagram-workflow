import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { NODE_CATALOG, selectedOption } from '../../model/node-catalog';
import { branchPortId, PORT_IN, type WorkflowNodeData } from '../../model/workflow-types';
import { NodeContextMenuDirective } from '../shared/node-context-menu.directive';
import { NodeHeaderComponent } from '../shared/node-header.component';
import { NodeIconComponent } from '../shared/node-icon.component';

/**
 * Branching card used by Decision and Approval: routes the flow into one of
 * several branches. It has a single input port and one output port per branch,
 * placed on the branch row, so each branch can be wired to a different next step.
 */
@Component({
  selector: 'app-decision-node',
  imports: [
    NgDiagramNodeSelectedDirective,
    NgDiagramPortComponent,
    NodeHeaderComponent,
    NodeIconComponent,
  ],
  templateUrl: './decision-node.component.html',
  styleUrl: './decision-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeContextMenuDirective, inputs: ['node'] }],
  host: { class: 'ng-diagram-port-hoverable-over-node' },
})
export class DecisionNodeComponent implements NgDiagramNodeTemplate<WorkflowNodeData> {
  readonly node = input.required<Node<WorkflowNodeData>>();

  protected readonly portIn = PORT_IN;
  protected readonly branchPortId = branchPortId;

  protected readonly data = computed(() => this.node().data);
  protected readonly def = computed(() => NODE_CATALOG[this.data().kind]);
  protected readonly branches = computed(() => this.data().branches ?? []);
  protected readonly summary = computed(() => selectedOption(this.data(), this.def().summaryKey));
}
