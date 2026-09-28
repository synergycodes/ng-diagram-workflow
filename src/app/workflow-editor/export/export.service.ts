import { inject, Injectable } from '@angular/core';
import { toCanvas } from 'html-to-image';
import { NgDiagramModelService, NgDiagramViewportService, type Point } from 'ng-diagram';
import { isLabelEdge, isWorkflowNode } from '../diagram/model/guards';
import type { DecisionBranch, PropertyValue } from '../diagram/model/workflow-types';
import { ProjectNameService } from '../top-navbar/project-name.service';

/** Serialized workflow: its steps plus the connections between their ports. */
interface WorkflowDocument {
  format: 'ng-diagram-workflow';
  version: 1;
  name: string;
  generatedAt: string;
  nodes: {
    id: string;
    kind: string;
    position: Point;
    label: string;
    description: string;
    properties: Record<string, PropertyValue>;
    branches?: DecisionBranch[];
  }[];
  connections: {
    id: string;
    source: string;
    sourcePort?: string;
    target: string;
    targetPort?: string;
    label?: string;
  }[];
}

/** Downloads the current workflow as JSON (the model) or JPEG (a raster of the canvas). */
@Injectable()
export class ExportService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);
  private readonly projectName = inject(ProjectNameService);

  exportJson(): void {
    const doc = this.buildDocument();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    this.download(blob, `${this.projectName.fileName()}.json`);
  }

  async exportJpeg(): Promise<void> {
    const element = document.querySelector<HTMLElement>('ng-diagram');
    if (!element) return;

    // Fit the whole workflow into view, then give the browser a couple of
    // frames to paint the fitted transform before the DOM is cloned. The
    // user's viewport is restored once the image is captured.
    const { x, y, scale } = this.viewport.viewport();
    let canvas: HTMLCanvasElement;
    try {
      await this.viewport.zoomToFit({ padding: [40, 40, 40, 40] });
      await nextFrame();

      const background = readVar('--wf-bg-canvas') || '#edeff3';
      // html-to-image inlines the fonts used on the canvas (Poppins and the
      // Phosphor icon font), because the rendered image cannot load the page's
      // fonts. The Google Fonts <link> is CORS-enabled so its rules are readable.
      canvas = await toCanvas(element, { pixelRatio: 2, backgroundColor: background });
    } finally {
      await this.viewport.setViewport(x, y, scale);
    }

    const blob = await toJpegBlob(canvas, 0.95);
    if (blob) this.download(blob, `${this.projectName.fileName()}.jpeg`);
  }

  private buildDocument(): WorkflowDocument {
    return {
      format: 'ng-diagram-workflow',
      version: 1,
      name: this.projectName.name(),
      generatedAt: new Date().toISOString(),
      nodes: this.modelService
        .nodes()
        .filter(isWorkflowNode)
        .map(({ id, position, data }) => ({
          id,
          kind: data.kind,
          position,
          label: data.label,
          description: data.description,
          properties: data.properties,
          ...(data.branches ? { branches: data.branches } : {}),
        })),
      connections: this.modelService
        .edges()
        .filter(isLabelEdge)
        .map(({ id, source, sourcePort, target, targetPort, data }) => ({
          id,
          source,
          sourcePort,
          target,
          targetPort,
          ...(data.label ? { label: data.label } : {}),
        })),
    };
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

function toJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}
