import type { Observable } from 'rxjs';
import type { WorkflowDocument } from './workflow-document';

/** What the backend reports about one step. */
export type NodeRunStatus = 'running' | 'waiting' | 'succeeded' | 'failed';

export type RunOutcome = 'succeeded' | 'failed' | 'stopped';

/** One message of a run's live event stream. */
export type RunEvent =
  | { type: 'node'; nodeId: string; status: NodeRunStatus; message?: string }
  /** The flow travelled along a connection. */
  | { type: 'edge'; edgeId: string }
  | { type: 'finished'; outcome: RunOutcome };

/**
 * Whatever executes workflows. The editor ships a mock; a real one would send
 * the document over HTTP and stream `RunEvent`s back (SSE, WebSocket, …).
 */
export abstract class WorkflowBackend {
  /** Start a run. Unsubscribing stops it. */
  abstract start(document: WorkflowDocument): Observable<RunEvent>;
  /** A person picked a branch on a step that is waiting for them. */
  abstract submitDecision(nodeId: string, branchId: string): void;
}
