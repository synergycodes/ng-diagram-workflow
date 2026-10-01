import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { NODE_CATALOG, selectedOption } from '../../model/node-catalog';
import { PORT_IN, PORT_OUT, type WorkflowNodeData } from '../../model/workflow-types';
import { NodeContextMenuDirective } from '../shared/node-context-menu.directive';
import { NodeHeaderComponent } from '../shared/node-header.component';
import { NodeRunStatusDirective } from '../shared/node-run-status.directive';
import { NodeStatusComponent } from '../shared/node-status.component';
import { NodeIconComponent } from '../shared/node-icon.component';

/**
 * AI Agent card: gradient icon plus "Chat Model" and "Memory" sections that
 * reflect the choices made in the properties panel (or show a dashed
 * placeholder until one is picked).
 */
@Component({
  selector: 'app-ai-agent-node',
  imports: [
    NgDiagramNodeSelectedDirective,
    NgDiagramPortComponent,
    NodeHeaderComponent,
    NodeStatusComponent,
    NodeIconComponent,
  ],
  templateUrl: './ai-agent-node.component.html',
  styleUrl: './ai-agent-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeContextMenuDirective, inputs: ['node'] },
    { directive: NodeRunStatusDirective, inputs: ['node'] },
  ],
  host: { class: 'ng-diagram-port-hoverable-over-node' },
})
export class AiAgentNodeComponent implements NgDiagramNodeTemplate<WorkflowNodeData> {
  readonly node = input.required<Node<WorkflowNodeData>>();

  protected readonly portIn = PORT_IN;
  protected readonly portOut = PORT_OUT;

  protected readonly data = computed(() => this.node().data);
  protected readonly def = computed(() => NODE_CATALOG[this.data().kind]);

  /** One section per select field of the catalog entry (chat model, memory). */
  protected readonly sections = computed(() =>
    this.def()
      .fields.filter((field) => field.kind === 'select')
      .map((field) => ({
        key: field.key,
        title: field.label,
        placeholder: field.placeholder ?? '',
        option: selectedOption(this.data(), field.key),
      })),
  );
}
