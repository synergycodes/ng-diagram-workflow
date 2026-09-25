import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NODE_CATALOG, PALETTE_ORDER } from '../diagram/model/node-catalog';
import { PaletteTileComponent } from './components/palette-tile/palette-tile.component';

/**
 * Left "Nodes Library" panel: a searchable list of draggable node tiles. The
 * whole panel collapses to its header.
 */
@Component({
  selector: 'app-palette-sidebar',
  imports: [PaletteTileComponent],
  templateUrl: './palette-sidebar.component.html',
  styleUrl: './palette-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteSidebarComponent {
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
