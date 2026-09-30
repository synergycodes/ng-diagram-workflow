import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgDiagramModelService, NgDiagramService, NgDiagramViewportService } from 'ng-diagram';
import { TEMPLATE_QUERY_PARAM, type WorkflowTemplate } from '../diagram/templates';
import { ExecutionService } from '../execution/execution.service';
import { ProjectNameService } from '../top-navbar/project-name.service';
import { canvasFitPadding, WORKFLOW_EDITOR_CONFIG } from '../workflow-editor.config';

/**
 * Opens the "Select a template" dialog and swaps the canvas for the picked
 * template in place (like Workflow Builder: no reload, no confirmation).
 */
@Injectable()
export class TemplateSelectorService {
  private readonly diagram = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);
  private readonly projectName = inject(ProjectNameService);
  private readonly config = inject(WORKFLOW_EDITOR_CONFIG);
  private readonly execution = inject(ExecutionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  /** Replace the whole workflow with `template`, or clear it for `null` (Empty Canvas). */
  async load(template: WorkflowTemplate | null): Promise<void> {
    this.close();
    this.execution.reset();
    const { nodes, edges } = structuredClone(template?.model ?? { nodes: [], edges: [] });
    await this.diagram.transaction(
      async () => {
        // `deleteNodes` takes the connections of the deleted nodes with it.
        await this.modelService.deleteNodes(this.modelService.nodes().map((n) => n.id));
        await this.modelService.addNodes(nodes);
        await this.modelService.addEdges(edges);
      },
      { waitForMeasurements: true },
    );
    this.projectName.rename(template?.name ?? '');
    // Keep the choice in the URL so a reload (or a bookmark) opens the same template.
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [TEMPLATE_QUERY_PARAM]: template?.id ?? null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (nodes.length > 0) await this.viewport.zoomToFit({ padding: canvasFitPadding(this.config) });
  }
}
