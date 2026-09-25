import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramService,
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
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram-base-edge class="label-edge" [edge]="edge()">
      @if (edge().data.label && isInitialized()) {
        <ng-diagram-base-edge-label
          [id]="edge().id + '-label'"
          [positionOnEdge]="edge().data.positionOnEdge ?? 0.5"
        >
          <span class="label p11" [class.selected]="edge().selected">{{ edge().data.label }}</span>
        </ng-diagram-base-edge-label>
      }
    </ng-diagram-base-edge>
  `,
  styleUrl: './label-edge.component.scss',
})
export class LabelEdgeComponent implements NgDiagramEdgeTemplate<WorkflowEdgeData> {
  readonly edge = input.required<Edge<WorkflowEdgeData>>();

  /**
   * A label registers itself with the diagram when it is created; one created
   * while the diagram is still initializing is never measured (and so stays
   * hidden). Rendering labels only once the diagram is ready avoids that for
   * edges that come with the initial model.
   */
  protected readonly isInitialized = inject(NgDiagramService).isInitialized;
}
