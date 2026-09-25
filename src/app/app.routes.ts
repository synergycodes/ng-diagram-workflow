import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./workflow-editor/pages/workflow-editor-page.component').then(
        (m) => m.WorkflowEditorPageComponent,
      ),
  },
  // Unknown URLs fall back to the editor instead of rendering nothing.
  { path: '**', redirectTo: '' },
];
