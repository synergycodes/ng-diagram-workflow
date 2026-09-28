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
    NodeIconComponent,
  ],
  templateUrl: './ai-agent-node.component.html',
  styleUrl: './ai-agent-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NodeContextMenuDirective, inputs: ['node'] }],
  host: { class: 'ng-diagram-port-hoverable-over-node' },
})
export class AiAgentNodeComponent implements NgDiagramNodeTemplate<WorkflowNodeData> {
  readonly node = input.required<Node<WorkflowNodeData>>();

  protected readonly portIn = PORT_IN;
  protected readonly portOut = PORT_OUT;

  protected readonly data = computed(() => this.node().data);
  protected readonly def = computed(() => NODE_CATALOG[this.data().kind]);

  protected readonly sections = computed(() =>
    [
      { key: 'chatModel', title: 'Chat Model', placeholder: 'Add Chat Model' },
      { key: 'memory', title: 'Memory', placeholder: 'Add Memory' },
    ].map((section) => ({ ...section, option: selectedOption(this.data(), section.key) })),
  );
}
