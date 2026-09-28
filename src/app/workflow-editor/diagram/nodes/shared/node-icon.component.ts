import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Renders an icon reference from the catalog. Accepted formats:
 * - `ph-<name>`   — a Phosphor (regular) icon font glyph, follows `currentColor`
 * - `mask:<file>` — a monochrome SVG from `assets/`, tinted with `currentColor`
 *
 * Size follows the host `font-size`.
 */
@Component({
  selector: 'app-node-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (parsed().kind) {
      @case ('ph') {
        <i [class]="'ph ' + parsed().name" aria-hidden="true"></i>
      }
      @case ('mask') {
        <span
          class="mask-icon"
          [style.--icon-url]="'url(assets/' + parsed().name + '.svg)'"
          aria-hidden="true"
        ></span>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `,
})
export class NodeIconComponent {
  readonly icon = input.required<string>();

  protected readonly parsed = computed(() => {
    const icon = this.icon();
    const separator = icon.indexOf(':');
    if (separator === -1) return { kind: 'ph', name: icon };
    return { kind: icon.slice(0, separator), name: icon.slice(separator + 1) };
  });
}
