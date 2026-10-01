import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { NODE_CATALOG } from '../../model/node-catalog';
import { PORT_IN, PORT_OUT, type WorkflowNodeData } from '../../model/workflow-types';
import { NodeContextMenuDirective } from '../shared/node-context-menu.directive';
import { NodeHeaderComponent } from '../shared/node-header.component';
import { NodeRunStatusDirective } from '../shared/node-run-status.directive';
import { NodeStatusComponent } from '../shared/node-status.component';
import { NodeSummaryComponent } from '../shared/node-summary.component';

/**
 * Default workflow card used by Trigger, Action, Delay, Notification and
 * Merge: the header plus a chip showing the chosen sub-type. One input
 * port on the left (omitted for start nodes) and one output port on the right.
 */
@Component({
  selector: 'app-workflow-node',
  imports: [
    NgDiagramNodeSelectedDirective,
    NgDiagramPortComponent,
    NodeHeaderComponent,
    NodeStatusComponent,
    NodeSummaryComponent,
  ],
  templateUrl: './workflow-node.component.html',
  styleUrl: './workflow-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeContextMenuDirective, inputs: ['node'] },
    { directive: NodeRunStatusDirective, inputs: ['node'] },
  ],
  host: { class: 'ng-diagram-port-hoverable-over-node' },
})
export class WorkflowNodeComponent implements NgDiagramNodeTemplate<WorkflowNodeData> {
  readonly node = input.required<Node<WorkflowNodeData>>();

  protected readonly portIn = PORT_IN;
  protected readonly portOut = PORT_OUT;

  protected readonly data = computed(() => this.node().data);
  protected readonly def = computed(() => NODE_CATALOG[this.data().kind]);
}
