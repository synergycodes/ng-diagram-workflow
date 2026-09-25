import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { SelectOption } from '../../../diagram/model/field-definitions';
import { NodeIconComponent } from '../../../diagram/nodes/shared/node-icon.component';

/**
 * Dropdown whose options carry icons (a native `<select>` can't show them).
 * Implements Signal Forms' `FormValueControl`, so it binds with
 * `[formField]` exactly like a native input.
 */
@Component({
  selector: 'app-icon-select',
  imports: [NodeIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-select.component.html',
  styleUrl: './icon-select.component.scss',
})
export class IconSelectComponent implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly options = input.required<readonly SelectOption[]>();
  readonly placeholder = input('Select…');
  readonly controlId = input<string>();

  protected readonly isOpen = signal(false);
  protected readonly selected = computed(() =>
    this.options().find((option) => option.value === this.value()),
  );

  protected toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected choose(option: SelectOption): void {
    this.value.set(option.value);
    this.close();
  }
}
