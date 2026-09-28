import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NodeHeaderVariant } from '../../model/workflow-types';
import { NodeIconComponent } from './node-icon.component';

/**
 * The Workflow Builder node head: icon box, title and subtitle. Shared by
 * every node template and by the palette tiles, so they always look alike.
 */
@Component({
  selector: 'app-node-header',
  imports: [NodeIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-box" [class.ai]="variant() === 'ai'">
      <app-node-icon [icon]="icon()" />
    </div>
    <div class="text">
      <span class="h9 title">{{ label() }}</span>
      <span class="p11 subtitle">{{ description() }}</span>
    </div>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .icon-box {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      padding: 0.625rem;
      border: 1px solid var(--wf-node-stroke);
      border-radius: var(--wf-radius-md);
      background: var(--wf-node-bg-secondary);
      color: var(--wf-node-icon);
      font-size: 1.5rem;

      &.ai {
        border-color: transparent;
        background: var(--wf-ai-gradient);
        color: #ffffff;
      }
    }

    .text {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;
    }

    .title,
    .subtitle {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .title {
      color: var(--wf-text-primary);
    }

    .subtitle {
      color: var(--wf-text-secondary);
    }
  `,
})
export class NodeHeaderComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly variant = input<NodeHeaderVariant | undefined>('default');
}
