import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NODE_CATALOG, PALETTE_ORDER } from '../diagram/model/node-catalog';
import { NodeIconComponent } from '../diagram/nodes/shared/node-icon.component';
import { TemplateSelectorService } from '../template-selector/template-selector.service';
import { PaletteTileComponent } from './components/palette-tile/palette-tile.component';

/**
 * Left "Nodes Library" panel: a searchable list of draggable node tiles and a
 * button that opens the template picker. The whole panel collapses to its header.
 */
@Component({
  selector: 'app-palette-sidebar',
  imports: [NodeIconComponent, PaletteTileComponent],
  templateUrl: './palette-sidebar.component.html',
  styleUrl: './palette-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteSidebarComponent {
  protected readonly templates = inject(TemplateSelectorService);
  protected readonly isExpanded = signal(true);
  protected readonly search = signal('');

  protected readonly kinds = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return PALETTE_ORDER;
    return PALETTE_ORDER.filter((kind) => {
      const def = NODE_CATALOG[kind];
      return def.label.toLowerCase().includes(term) || def.description.toLowerCase().includes(term);
    });
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected togglePanel(): void {
    this.isExpanded.update((v) => !v);
  }
}
