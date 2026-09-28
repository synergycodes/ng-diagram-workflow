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
}

export const WORKFLOW_EDITOR_DEFAULTS: WorkflowEditorConfig = {
  viewport: {
    zoomToFitPadding: 48,
    zoomStep: 0.1,
  },
  gridSize: 18,
};

/**
 * Zoom-to-fit padding for the canvas: the configured padding plus room for the
 * overlay panels (navbar and properties panel on top / right, library on the left).
 */
export function canvasFitPadding(config: WorkflowEditorConfig): [number, number, number, number] {
  const pad = config.viewport.zoomToFitPadding;
  return [pad + 72, pad + 72, pad + 72, pad + 340];
}

export const WORKFLOW_EDITOR_CONFIG = new InjectionToken<WorkflowEditorConfig>(
  'WORKFLOW_EDITOR_CONFIG',
  { factory: () => WORKFLOW_EDITOR_DEFAULTS },
);
