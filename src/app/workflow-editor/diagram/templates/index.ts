import {
  chainingTemplate,
  humanInTheLoopTemplate,
  parallelizationTemplate,
  reflectionLoopTemplate,
  routingTemplate,
} from './ai-patterns';
import { orderConfirmationTemplate } from './order-confirmation';
import type { WorkflowTemplate } from './workflow-template';

export type { WorkflowTemplate } from './workflow-template';

/** Templates in dialog order; the first one is loaded on start. */
export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  orderConfirmationTemplate,
  chainingTemplate,
  routingTemplate,
  parallelizationTemplate,
  reflectionLoopTemplate,
  humanInTheLoopTemplate,
];

/** The template named by `?template=<id>`, else the default one. */
export function initialTemplate(search = globalThis.location?.search ?? ''): WorkflowTemplate {
  const id = new URLSearchParams(search).get('template');
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) ?? WORKFLOW_TEMPLATES[0];
}
