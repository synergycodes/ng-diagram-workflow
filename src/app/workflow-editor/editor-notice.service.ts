import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/** How long a notice stays in the navbar (ms). */
const NOTICE_DURATION = 4000;

/**
 * One short message shown in the navbar, for the moments the editor refuses to
 * do something: a rejected connection, a run with nothing to run. Without it
 * those refusals happen in silence, because they are decided deep in the model
 * pipeline (a cancelled middleware pass) rather than in the component that was
 * clicked.
 */
@Injectable()
export class EditorNoticeService {
  readonly message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /** Show `message`, replacing any notice already on screen. */
  report(message: string): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(null), NOTICE_DURATION);
  }

  clear(): void {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
