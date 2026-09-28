import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { form, FormField, type FieldTree } from '@angular/forms/signals';
import type { Node } from 'ng-diagram';
import { isFieldVisible } from '../../../diagram/model/field-definitions';
import { NODE_CATALOG } from '../../../diagram/model/node-catalog';
import type { WorkflowNodeData } from '../../../diagram/model/workflow-types';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { FormFieldComponent } from '../form-field/form-field.component';
import { IconSelectComponent } from '../icon-select/icon-select.component';

/**
 * Properties form for one node, built with Signal Forms.
 *
 * The node's data is copied into a local signal (`model`) that `form()` wraps;
 * every control edits that signal and an effect writes changes back to the
 * diagram. The copy re-syncs whenever the node itself changes (another node
 * gets selected, or the model is updated from elsewhere).
 */
@Component({
  selector: 'app-node-properties',
  imports: [FormField, FormFieldComponent, IconSelectComponent],
  templateUrl: './node-properties.component.html',
  styleUrl: './node-properties.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePropertiesComponent {
  private readonly service = inject(PropertiesSidebarService);

  readonly node = input.required<Node<WorkflowNodeData>>();

  protected readonly model = linkedSignal(() => this.node().data);
  protected readonly form = form(this.model);

  protected readonly def = computed(() => NODE_CATALOG[this.model().kind]);
  protected readonly hasBranches = computed(() => !!this.def().initialBranches);
  protected readonly visibleFields = computed(() =>
    this.def().fields.filter((field) => isFieldVisible(field, this.model().properties)),
  );

  constructor() {
    effect(() => {
      const data = this.model();
      const node = this.node();
      if (data !== node.data) {
        this.service.updateNodeData(node.id, data);
      }
    });
  }

  /** Typed view of a string property (the catalog guarantees the value type). */
  protected textField(key: string): FieldTree<string> {
    return this.form.properties[key] as unknown as FieldTree<string>;
  }

  /** Typed view of a boolean property. */
  protected switchField(key: string): FieldTree<boolean> {
    return this.form.properties[key] as unknown as FieldTree<boolean>;
  }

  protected branchLabel(index: number): FieldTree<string> {
    const branches = this.form.branches as unknown as FieldTree<{ label: string }[]>;
    return branches[index].label;
  }

  protected addBranch(): void {
    this.model.update((data) => {
      const branches = data.branches ?? [];
      const id = crypto.randomUUID().slice(0, 8);
      return {
        ...data,
        branches: [...branches, { id, label: `Branch ${branches.length + 1}` }],
      };
    });
  }

  protected removeBranch(id: string): void {
    this.model.update((data) => ({
      ...data,
      branches: (data.branches ?? []).filter((branch) => branch.id !== id),
    }));
  }

  protected remove(): void {
    this.service.removeNode(this.node().id);
  }
}
