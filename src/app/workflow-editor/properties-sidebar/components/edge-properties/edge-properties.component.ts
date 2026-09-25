import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { Edge } from 'ng-diagram';
import type { WorkflowEdgeData } from '../../../diagram/model/workflow-types';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { FormFieldComponent } from '../form-field/form-field.component';

/** Properties form for one connection: just its label (Signal Forms, like nodes). */
@Component({
  selector: 'app-edge-properties',
  imports: [FormField, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="group">
      <h3 class="h10 group-title">Connection</h3>
      <app-form-field label="Label" fieldId="prop-edge-label">
        <input
          id="prop-edge-label"
          class="field p10"
          type="text"
          placeholder="Add a label…"
          [formField]="form.label"
        />
      </app-form-field>
    </section>
    <div class="actions">
      <button class="remove-button p10" type="button" (click)="remove()">Delete connection</button>
    </div>
  `,
  styleUrl: '../node-properties/node-properties.component.scss',
})
export class EdgePropertiesComponent {
  private readonly service = inject(PropertiesSidebarService);

  readonly edge = input.required<Edge<WorkflowEdgeData>>();

  protected readonly model = linkedSignal(() => ({ label: this.edge().data.label ?? '' }));
  protected readonly form = form(this.model);

  constructor() {
    effect(() => {
      const { label } = this.model();
      const edge = this.edge();
      if (label !== (edge.data.label ?? '')) {
        this.service.updateEdgeData(edge.id, { ...edge.data, label });
      }
    });
  }

  protected remove(): void {
    this.service.removeEdge(this.edge().id);
  }
}
