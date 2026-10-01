import { inject, Injectable } from '@angular/core';
import { toCanvas } from 'html-to-image';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { toWorkflowDocument } from '../execution/workflow-document';
import { ProjectNameService } from '../top-navbar/project-name.service';

/** Downloads the current workflow as JSON (the model) or JPEG (a raster of the canvas). */
@Injectable()
export class ExportService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);
  private readonly projectName = inject(ProjectNameService);

  exportJson(): void {
    const doc = toWorkflowDocument(
      this.modelService.nodes(),
      this.modelService.edges(),
      this.projectName.name(),
    );
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
