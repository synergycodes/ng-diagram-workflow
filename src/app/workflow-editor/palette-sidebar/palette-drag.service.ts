import { Injectable } from '@angular/core';
import type { Point } from 'ng-diagram';

/**
 * Hands the drag-preview anchor from the palette tile to the canvas. The tile
 * centres its preview on the cursor, while ng-diagram drops the node with its
 * top-left corner at the cursor; the canvas uses this offset (in flow units)
 * to move the dropped node back under the preview. The offset is set only
 * while a mouse drag is in progress; it is `null` for touch drags.
 */
@Injectable()
export class PaletteDragService {
  grabOffset: Point | null = null;
}
