import type { Type } from '@angular/core';
import type { NgDiagramNodeTemplate } from 'ng-diagram';
import {
  AI_AGENT_NODE_TYPE,
  DECISION_NODE_TYPE,
  WORKFLOW_NODE_TYPE,
  type WorkflowNodeData,
  type WorkflowNodeTemplate,
} from '../model/workflow-types';
import { AiAgentNodeComponent } from './ai-agent-node/ai-agent-node.component';
import { DecisionNodeComponent } from './decision-node/decision-node.component';
import { WorkflowNodeComponent } from './workflow-node/workflow-node.component';

/**
 * Component rendering each node template. Used by the canvas template map and
 * by the palette, which renders the same card as the drag preview.
 */
export const NODE_TEMPLATE_COMPONENTS: Record<
  WorkflowNodeTemplate,
  Type<NgDiagramNodeTemplate<WorkflowNodeData>>
> = {
  [WORKFLOW_NODE_TYPE]: WorkflowNodeComponent,
  [DECISION_NODE_TYPE]: DecisionNodeComponent,
  [AI_AGENT_NODE_TYPE]: AiAgentNodeComponent,
};
