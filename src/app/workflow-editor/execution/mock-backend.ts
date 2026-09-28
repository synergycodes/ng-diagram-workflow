import { Injectable } from '@angular/core';
import { Observable, type Subscriber } from 'rxjs';
import { branchPortId, PORT_OUT, WorkflowNodeKind } from '../diagram/model/workflow-types';
import { WorkflowBackend, type RunEvent } from './execution-types';
import type { WorkflowDocument } from './workflow-document';

type DocNode = WorkflowDocument['nodes'][number];
type Connection = WorkflowDocument['connections'][number];

/** Simulated time each kind of step takes (ms). */
const DURATION: Partial<Record<string, number>> = {
  [WorkflowNodeKind.Trigger]: 400,
  [WorkflowNodeKind.Action]: 900,
  [WorkflowNodeKind.Notification]: 700,
  [WorkflowNodeKind.AiAgent]: 1800,
  [WorkflowNodeKind.Decision]: 500,
  [WorkflowNodeKind.Approval]: 500,
  [WorkflowNodeKind.Merge]: 300,
};
/** Time for the flow to travel along a connection (ms). */
const HOP = 250;
/** Stops runaway loops; a step may run at most this many times per run. */
const MAX_VISITS = 3;

/**
 * Pretend workflow engine, run in the browser. It walks the document like a
 * token-passing engine and reports every step as a `RunEvent`, with delays, so
 * the canvas can show a run live. Rules:
 *
 * - steps without incoming connections start the run; a step passes the flow
 *   to every connection on its output (parallel branches run at once)
 * - `simulateFailure` fails the step; an Action with `retryOnFailure` fails
 *   once and then succeeds
 * - a Decision takes a branch that loops back once (reflection loop), then a
 *   random forward branch
 * - an Approval waits until `submitDecision` picks its branch
 * - a Merge waits for every incoming connection (`all`) or the first (`any`)
 */
@Injectable()
export class MockWorkflowBackend extends WorkflowBackend {
  /** Source of randomness for branch choice and timing jitter (tests pin it). */
  random: () => number = Math.random;

  private active?: MockRun;

  start(document: WorkflowDocument): Observable<RunEvent> {
    return new Observable<RunEvent>((subscriber) => {
      const run = new MockRun(document, subscriber, this.random);
      this.active = run;
      run.begin();
      return () => {
        run.stop();
        if (this.active === run) this.active = undefined;
      };
    });
  }

  submitDecision(nodeId: string, branchId: string): void {
    this.active?.decide(nodeId, branchId);
  }
}

class MockRun {
  private readonly nodes: Map<string, DocNode>;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly visits = new Map<string, number>();
  private readonly arrivals = new Map<string, number>();
  private readonly waitingForPerson = new Set<string>();
  private readonly loopsTaken = new Set<string>();
  private readonly retried = new Set<string>();
  private failed = false;
  private stopped = false;

  constructor(
    private readonly doc: WorkflowDocument,
    private readonly out: Subscriber<RunEvent>,
    private readonly random: () => number,
  ) {
    this.nodes = new Map(doc.nodes.map((node) => [node.id, node]));
  }

  begin(): void {
    const targets = new Set(this.doc.connections.map((c) => c.target));
    this.doc.nodes.filter((node) => !targets.has(node.id)).forEach((node) => this.enter(node));
    this.checkDone();
  }

  stop(): void {
    this.stopped = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  decide(nodeId: string, branchId: string): void {
    if (!this.waitingForPerson.delete(nodeId)) return;
    const node = this.nodes.get(nodeId)!;
    const branch = node.branches?.find((b) => b.id === branchId);
    this.emit({ type: 'node', nodeId, status: 'succeeded', message: branch?.label });
    this.follow(this.outgoing(nodeId, branchPortId(branchId)));
    this.checkDone();
  }

  private enter(node: DocNode): void {
    if (node.kind === WorkflowNodeKind.Merge) {
      const total = this.incoming(node.id).length;
      const arrived = (this.arrivals.get(node.id) ?? 0) + 1;
      const waitForAll = node.properties['waitFor'] !== 'any';
      if (arrived >= total) this.arrivals.delete(node.id);
      else this.arrivals.set(node.id, arrived);
      if (waitForAll && arrived < total) {
        const message = `${arrived}/${total} arrived`;
        this.emit({ type: 'node', nodeId: node.id, status: 'waiting', message });
        return;
      }
      // `any`: the first arrival went on, the rest end here.
      if (!waitForAll && arrived > 1) return;
    }

    const visits = (this.visits.get(node.id) ?? 0) + 1;
    this.visits.set(node.id, visits);
    if (visits > MAX_VISITS) {
      this.fail(node.id, 'Loop limit reached');
      return;
    }
    this.emit({ type: 'node', nodeId: node.id, status: 'running' });
    this.schedule(this.duration(node), () => this.complete(node));
  }

  private complete(node: DocNode): void {
    if (node.properties['simulateFailure'] === true) {
      const canRetry = node.properties['retryOnFailure'] === true && !this.retried.has(node.id);
      if (!canRetry) {
        this.fail(node.id, 'Simulated failure');
        return;
      }
      this.retried.add(node.id);
      this.emit({ type: 'node', nodeId: node.id, status: 'failed', message: 'Retrying…' });
      this.schedule(600, () => {
        this.emit({ type: 'node', nodeId: node.id, status: 'running', message: 'Retry 1/1' });
        this.schedule(this.duration(node), () => this.succeed(node));
      });
      return;
    }

    if (node.kind === WorkflowNodeKind.Approval) {
      this.waitingForPerson.add(node.id);
      const approver = String(node.properties['approver'] || 'approval');
      this.emit({
        type: 'node',
        nodeId: node.id,
        status: 'waiting',
        message: `Waiting for ${approver}`,
      });
      return;
    }

    if (node.branches) {
      const choice = this.chooseBranch(node);
      this.emit({ type: 'node', nodeId: node.id, status: 'succeeded', message: choice?.label });
      if (choice) this.follow(this.outgoing(node.id, branchPortId(choice.id)));
      return;
    }

    this.succeed(node);
  }

  private succeed(node: DocNode): void {
    this.emit({ type: 'node', nodeId: node.id, status: 'succeeded' });
    this.follow(this.outgoing(node.id, PORT_OUT));
  }

  /** Loop back once if a branch leads to a step already run, else pick a forward branch. */
  private chooseBranch(node: DocNode) {
    const wired = (node.branches ?? [])
      .map((branch) => ({ branch, edges: this.outgoing(node.id, branchPortId(branch.id)) }))
      .filter(({ edges }) => edges.length > 0);
    const loopsBack = ({ edges }: (typeof wired)[number]) =>
      edges.some((edge) => this.visits.has(edge.target));

    const loop = wired.find((w) => loopsBack(w) && !this.loopsTaken.has(w.branch.id + node.id));
    if (loop) {
      this.loopsTaken.add(loop.branch.id + node.id);
      return loop.branch;
    }
    const forward = wired.filter((w) => !loopsBack(w));
    const options = forward.length > 0 ? forward : wired;
    return options[Math.floor(this.random() * options.length)]?.branch;
  }

  private follow(edges: Connection[]): void {
    for (const edge of edges) {
      this.emit({ type: 'edge', edgeId: edge.id });
      const target = this.nodes.get(edge.target);
      if (target) this.schedule(HOP, () => this.enter(target));
    }
  }

  private fail(nodeId: string, message: string): void {
    this.failed = true;
    this.emit({ type: 'node', nodeId, status: 'failed', message });
  }

  private schedule(ms: number, step: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      step();
      this.checkDone();
    }, ms);
    this.timers.add(timer);
  }

  /** The run ends when nothing is scheduled and nobody is being waited for. */
  private checkDone(): void {
    if (this.stopped || this.timers.size > 0 || this.waitingForPerson.size > 0) return;
    // A Merge still waiting for branches that will never come.
    for (const [nodeId, arrived] of this.arrivals) {
      if (this.nodes.get(nodeId)?.properties['waitFor'] === 'any') continue;
      this.fail(nodeId, `Branch missing (${arrived}/${this.incoming(nodeId).length} arrived)`);
    }
    this.emit({ type: 'finished', outcome: this.failed ? 'failed' : 'succeeded' });
    this.stopped = true;
    this.out.complete();
  }

  private duration(node: DocNode): number {
    const base =
      node.kind === WorkflowNodeKind.Delay
        ? Math.min(Number(node.properties['delayMs']) || 0, 2000)
        : (DURATION[node.kind] ?? 600);
    return Math.max(300, Math.round(base * (0.8 + this.random() * 0.4)));
  }

  private outgoing(nodeId: string, port: string): Connection[] {
    return this.doc.connections.filter((c) => c.source === nodeId && c.sourcePort === port);
  }

  private incoming(nodeId: string): Connection[] {
    return this.doc.connections.filter((c) => c.target === nodeId);
  }

  private emit(event: RunEvent): void {
    if (!this.stopped) this.out.next(event);
  }
}
