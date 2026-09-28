import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramDefaultEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';
import type { WorkflowEdgeData } from '../../model/workflow-types';

/**
 * Workflow connection: an orthogonal, rounded path without arrowheads and an
 * optional pill label at the midpoint (Workflow Builder `labelEdge`).
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
    <ng-diagram-base-edge class="label-edge" [edge]="edge()">
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
}
