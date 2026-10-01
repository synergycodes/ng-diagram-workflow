import { TestBed } from '@angular/core/testing';
import { NgDiagramModelService } from 'ng-diagram';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createNode } from '../diagram/model/node-catalog';
import { WorkflowNodeKind } from '../diagram/model/workflow-types';
import { EditorNoticeService } from '../editor-notice.service';
import { WorkflowBackend, type RunEvent } from './execution-types';
import { ExecutionService } from './execution.service';

/** An ExecutionService whose backend streams whatever the test pushes into `events`. */
function setup() {
  const events = new Subject<RunEvent>();
  const backend = { start: vi.fn(() => events), submitDecision: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      ExecutionService,
      EditorNoticeService,
      { provide: WorkflowBackend, useValue: backend },
      {
        provide: NgDiagramModelService,
        useValue: {
          nodes: () => [createNode('t', WorkflowNodeKind.Trigger, { x: 0, y: 0 })],
          edges: () => [],
        },
      },
    ],
  });
  return { execution: TestBed.inject(ExecutionService), events };
}

describe('ExecutionService', () => {
  it('keeps only finished step statuses when a run is stopped', () => {
    const { execution, events } = setup();
    execution.run();
    events.next({ type: 'node', nodeId: 'done', status: 'succeeded' });
    events.next({ type: 'node', nodeId: 'broken', status: 'failed', message: 'Simulated failure' });
    events.next({ type: 'node', nodeId: 'busy', status: 'running' });
    events.next({ type: 'node', nodeId: 'approval', status: 'waiting', message: 'Waiting' });

    execution.stop();

    expect(execution.statuses()).toEqual({
      done: { status: 'succeeded', message: undefined },
      broken: { status: 'failed', message: 'Simulated failure' },
    });
    expect(execution.outcome()).toBe('stopped');
    expect(execution.isRunning()).toBe(false);
  });

  it('ignores the stream once a run is stopped', () => {
    const { execution, events } = setup();
    execution.run();
    execution.stop();

    events.next({ type: 'node', nodeId: 'late', status: 'running' });

    expect(execution.statuses()).toEqual({});
  });
});
