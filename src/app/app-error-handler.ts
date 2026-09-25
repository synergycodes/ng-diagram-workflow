import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Central place for uncaught runtime errors. An interactive editor can throw
 * during a drag, a palette drop or an export; routing those here keeps the
 * failure visible in one spot and gives a single seam to add user-facing
 * reporting later. For now it logs with a consistent prefix.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error('[workflow-editor] uncaught error:', error);
  }
}
