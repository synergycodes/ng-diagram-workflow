import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramPortComponent, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';
import { NODE_CATALOG } from '../../model/node-catalog';
import { branchPortId, PORT_IN, type WorkflowNodeData } from '../../model/workflow-types';
import { NodeContextMenuDirective } from '../shared/node-context-menu.directive';
import { NodeHeaderComponent } from '../shared/node-header.component';

/**
 * Decision card: routes the flow into one of several branches. It has a
 * single input port and one output port per branch, placed on the branch row,
 * so each branch can be wired to a different next step.
 */
@Component({
  selector: 'app-decision-node',
  imports: [NgDiagramPortComponent, NodeHeaderComponent],
  templateUrl: './decision-node.component.html',
  styleUrl: './decision-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeContextMenuDirective, inputs: ['node'] }],
  host: {
    class: 'ng-diagram-port-hoverable-over-node',
    '[class.selected]': 'node().selected',
  },
})
export class DecisionNodeComponent implements NgDiagramNodeTemplate<WorkflowNodeData> {
  readonly node = input.required<Node<WorkflowNodeData>>();
  /** Render without ports, e.g. as the palette drag preview outside the diagram. */
  readonly preview = input(false);

  protected readonly portIn = PORT_IN;
  protected readonly branchPortId = branchPortId;

  protected readonly data = computed(() => this.node().data);
  protected readonly def = computed(() => NODE_CATALOG[this.data().kind]);
  protected readonly branches = computed(() => this.data().branches ?? []);
}
