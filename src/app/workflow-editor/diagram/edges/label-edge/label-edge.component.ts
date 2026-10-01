import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramDefaultEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';
import { ExecutionService } from '../../../execution/execution.service';
import type { WorkflowEdgeData } from '../../model/workflow-types';

/**
 * Workflow connection: an orthogonal, rounded path without arrowheads and an
 * optional pill label at the midpoint (Workflow Builder `labelEdge`). Lit up
 * once a run's flow has gone along it.
 */
@Component({
  selector: 'app-label-edge',
  imports: [
    NgDiagramBaseEdgeComponent,
    NgDiagramBaseEdgeLabelComponent,
    NgDiagramDefaultEdgeLabelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram-base-edge class="label-edge" [class.traversed]="traversed()" [edge]="edge()">
      @if (edge().data.label) {
        <ng-diagram-base-edge-label
          [id]="edge().id + '-label'"
          [positionOnEdge]="edge().data.positionOnEdge ?? 0.5"
        >
          <ng-diagram-default-edge-label>
            <span class="label-text p11">{{ edge().data.label }}</span>
          </ng-diagram-default-edge-label>
        </ng-diagram-base-edge-label>
      }
    </ng-diagram-base-edge>
  `,
  styleUrl: './label-edge.component.scss',
})
export class LabelEdgeComponent implements NgDiagramEdgeTemplate<WorkflowEdgeData> {
  readonly edge = input.required<Edge<WorkflowEdgeData>>();

  private readonly execution = inject(ExecutionService);
  protected readonly traversed = computed(() =>
    this.execution.traversedEdges().has(this.edge().id),
  );
}
