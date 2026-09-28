import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NODE_CATALOG } from '../diagram/model/node-catalog';
import { NodeIconComponent } from '../diagram/nodes/shared/node-icon.component';
import { EdgePropertiesComponent } from './components/edge-properties/edge-properties.component';
import { NodePropertiesComponent } from './components/node-properties/node-properties.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { PropertiesSidebarService } from './properties-sidebar.service';

/**
 * Right "Properties" panel. Shows the form for the selected node (catalog
 * driven) or connection (label only), or a placeholder otherwise.
 */
@Component({
  selector: 'app-properties-sidebar',
  imports: [
    NodeIconComponent,
    NodePropertiesComponent,
    EdgePropertiesComponent,
    SidebarPlaceholderComponent,
  ],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.expanded]': 'isExpanded()' },
})
export class PropertiesSidebarComponent {
  private readonly service = inject(PropertiesSidebarService);

  protected readonly isExpanded = this.service.isExpanded;
  protected readonly isSelectionEmpty = this.service.isSelectionEmpty;
  protected readonly node = this.service.selectedNode;
  protected readonly edge = this.service.selectedEdge;

  protected readonly def = computed(() => {
    const node = this.node();
    return node ? NODE_CATALOG[node.data.kind] : undefined;
  });

  protected onToggle(): void {
    this.service.toggleSidebarVisibility();
  }
}
