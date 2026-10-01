import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  initializeModel,
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
} from 'ng-diagram';
import { templateById, TEMPLATE_QUERY_PARAM, type WorkflowTemplate } from '../diagram/templates';
import { ExecutionService } from '../execution/execution.service';
import { ProjectNameService } from '../top-navbar/project-name.service';
import { canvasFitPadding, WORKFLOW_EDITOR_CONFIG } from '../workflow-editor.config';

/**
 * Owns the workflow on the canvas: the template it starts from (`?template=<id>`,
 * the order flow by default) and the "Select a template" dialog that swaps it
 * for another one in place (like Workflow Builder: no reload, no confirmation).
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

  private readonly initial = templateById(
    this.route.snapshot.queryParamMap.get(TEMPLATE_QUERY_PARAM),
  );

  /** The model the canvas starts with; `load` replaces its contents. */
  readonly model = initializeModel(structuredClone(this.initial.model));

  readonly isOpen = signal(false);

  constructor() {
    this.projectName.rename(this.initial.name);
  }

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
    // Cleared in its own update: a transaction applies additions before removals,
    // so nodes whose ids are already on the canvas (the same template picked
    // again) would be added and then removed. `deleteNodes` takes their
    // connections with them.
    const current = this.modelService.nodes().map((node) => node.id);
    if (current.length > 0) await this.modelService.deleteNodes(current);
    await this.diagram.transaction(
      () => {
        this.modelService.addNodes(nodes);
        this.modelService.addEdges(edges);
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
