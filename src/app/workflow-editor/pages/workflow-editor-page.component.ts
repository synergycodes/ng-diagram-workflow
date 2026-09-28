import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { EditorActionsService } from '../diagram/editor-actions.service';
import { WorkflowBackend } from '../execution/execution-types';
import { ExecutionService } from '../execution/execution.service';
import { MockWorkflowBackend } from '../execution/mock-backend';
import { ExportService } from '../export/export.service';
import { MinimapBarComponent } from '../minimap-bar/minimap-bar.component';
import { PaletteDragService } from '../palette-sidebar/palette-drag.service';
import { PaletteSidebarComponent } from '../palette-sidebar/palette-sidebar.component';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { TemplateSelectorComponent } from '../template-selector/template-selector.component';
import { TemplateSelectorService } from '../template-selector/template-selector.service';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

/**
 * Top-level workflow editor screen: a full-bleed diagram canvas with the
 * navbar, nodes library, properties panel, zoom/minimap bar, context menu and
 * template picker overlaid on top.
 */
@Component({
  selector: 'app-workflow-editor-page',
  imports: [
    DiagramComponent,
    PaletteSidebarComponent,
    PropertiesSidebarComponent,
    TopNavbarComponent,
    MinimapBarComponent,
    ContextMenuComponent,
    TemplateSelectorComponent,
  ],
  templateUrl: './workflow-editor-page.component.html',
  styleUrl: './workflow-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.props-expanded]': 'propsExpanded()' },
  providers: [
    provideNgDiagram(),
    PropertiesSidebarService,
    EditorActionsService,
    ExportService,
    ContextMenuService,
    PaletteDragService,
    TemplateSelectorService,
    ExecutionService,
    // Swap in a real backend client here; the canvas only sees `RunEvent`s.
    { provide: WorkflowBackend, useClass: MockWorkflowBackend },
  ],
})
export class WorkflowEditorPageComponent {
  protected readonly propsExpanded = inject(PropertiesSidebarService).isExpanded;
}
