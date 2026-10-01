import {
  chainingTemplate,
  humanInTheLoopTemplate,
  parallelizationTemplate,
  reflectionLoopTemplate,
  routingTemplate,
} from './ai-patterns';
import { orderConfirmationTemplate } from './order-confirmation';
import type { WorkflowTemplate } from './workflow-template';

export type { WorkflowModel, WorkflowTemplate } from './workflow-template';

/** Query param that deep-links a template (`?template=<id>`). */
export const TEMPLATE_QUERY_PARAM = 'template';

/** Templates in dialog order; the first one is loaded when the URL names no known template. */
export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  orderConfirmationTemplate,
  chainingTemplate,
  routingTemplate,
  parallelizationTemplate,
  reflectionLoopTemplate,
  humanInTheLoopTemplate,
];

/** The template with this id (from the query param), else the default one. */
export function templateById(id: string | null | undefined): WorkflowTemplate {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) ?? WORKFLOW_TEMPLATES[0];
}
