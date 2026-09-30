import { InjectionToken } from '@angular/core';

export interface WorkflowEditorConfig {
  /** Viewport behavior. */
  viewport: {
    /** Extra padding (px) around all sides when fitting the workflow in view. */
    zoomToFitPadding: number;
    /** Scale increment per zoom-in / zoom-out click. */
    zoomStep: number;
  };
  /** Grid step (px) nodes snap to while dragging. */
  gridSize: number;
  /**
   * Room (px) the overlay panels take on each side of the canvas: navbar on
   * top, properties panel on the right, zoom bar at the bottom, nodes library
   * on the left. Zoom-to-fit keeps the workflow clear of them.
   */
  panelInsets: { top: number; right: number; bottom: number; left: number };
}

export const WORKFLOW_EDITOR_DEFAULTS: WorkflowEditorConfig = {
  viewport: {
    zoomToFitPadding: 48,
    zoomStep: 0.1,
  },
  gridSize: 18,
  panelInsets: { top: 72, right: 72, bottom: 72, left: 340 },
};

/**
 * Zoom-to-fit padding for the canvas: the configured padding plus room for the
 * overlay panels (navbar and properties panel on top / right, library on the left).
 */
export function canvasFitPadding(config: WorkflowEditorConfig): [number, number, number, number] {
  const pad = config.viewport.zoomToFitPadding;
  const { top, right, bottom, left } = config.panelInsets;
  return [pad + top, pad + right, pad + bottom, pad + left];
}

export const WORKFLOW_EDITOR_CONFIG = new InjectionToken<WorkflowEditorConfig>(
  'WORKFLOW_EDITOR_CONFIG',
  { factory: () => WORKFLOW_EDITOR_DEFAULTS },
);
