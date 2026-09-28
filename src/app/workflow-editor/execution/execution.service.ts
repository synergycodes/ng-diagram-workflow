import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import type { Subscription } from 'rxjs';
import { ProjectNameService } from '../top-navbar/project-name.service';
import {
  WorkflowBackend,
  type NodeRunStatus,
  type RunEvent,
  type RunOutcome,
} from './execution-types';
import { toWorkflowDocument } from './workflow-document';

export interface NodeRunState {
  status: NodeRunStatus;
  message?: string;
}

/**
 * Runs the current workflow on the `WorkflowBackend` and keeps what it reports
 * as signals the canvas reads: a status per node and the connections the flow
 * went along. Kept outside node data on purpose, so statuses never end up in
 * the export, the clipboard or the model's change pipeline.
 */
@Injectable()
export class ExecutionService {
  private readonly backend = inject(WorkflowBackend);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly projectName = inject(ProjectNameService);
  private subscription?: Subscription;

  readonly statuses = signal<Readonly<Record<string, NodeRunState>>>({});
  readonly traversedEdges = signal<ReadonlySet<string>>(new Set());
  readonly state = signal<'idle' | 'running' | 'finished'>('idle');
  readonly outcome = signal<RunOutcome | null>(null);
  readonly isRunning = computed(() => this.state() === 'running');

  run(): void {
    this.reset();
    this.state.set('running');
    const doc = toWorkflowDocument(
      this.modelService.nodes(),
      this.modelService.edges(),
      this.projectName.name(),
    );
    this.subscription = this.backend.start(doc).subscribe((event) => this.apply(event));
  }

  stop(): void {
    if (!this.isRunning()) return;
    this.subscription?.unsubscribe();
    this.finish('stopped');
  }

  /** Back to an idle canvas: stop any run and clear every status. */
  reset(): void {
    this.subscription?.unsubscribe();
    this.statuses.set({});
    this.traversedEdges.set(new Set());
    this.state.set('idle');
    this.outcome.set(null);
  }

  /** A person picked `branchId` on a step waiting for them. */
  decide(nodeId: string, branchId: string): void {
    this.backend.submitDecision(nodeId, branchId);
  }

  private apply(event: RunEvent): void {
    switch (event.type) {
      case 'node':
        this.statuses.update((all) => ({
          ...all,
          [event.nodeId]: { status: event.status, message: event.message },
        }));
        break;
      case 'edge':
        this.traversedEdges.update((edges) => new Set(edges).add(event.edgeId));
        break;
      case 'finished':
        this.finish(event.outcome);
        break;
    }
  }

  private finish(outcome: RunOutcome): void {
    this.state.set('finished');
    this.outcome.set(outcome);
  }
}
