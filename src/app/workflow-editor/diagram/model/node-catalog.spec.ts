import { describe, expect, it } from 'vitest';
import { isFieldVisible } from './field-definitions';
import {
  createNodeData,
  NODE_CATALOG,
  PALETTE_ORDER,
  selectedOption,
  toPaletteItem,
} from './node-catalog';
import { WorkflowNodeKind } from './workflow-types';

describe('NODE_CATALOG', () => {
  it('lists every kind exactly once in the palette', () => {
    expect([...PALETTE_ORDER].sort()).toEqual(Object.values(WorkflowNodeKind).sort());
  });

  it('gives every field a default value', () => {
    for (const def of Object.values(NODE_CATALOG)) {
      for (const field of def.fields) {
        expect(def.defaults, `${def.kind}.${field.key}`).toHaveProperty(field.key);
      }
    }
  });

  it('only references existing select fields as the card summary', () => {
    for (const def of Object.values(NODE_CATALOG)) {
      if (!def.summaryKey) continue;
      const field = def.fields.find((f) => f.key === def.summaryKey);
      expect(field?.kind, def.kind).toBe('select');
    }
  });
});

describe('createNodeData', () => {
  it('copies defaults so nodes never share property objects', () => {
    const a = createNodeData(WorkflowNodeKind.Action);
    const b = createNodeData(WorkflowNodeKind.Action);
    a.properties['subject'] = 'changed';
    expect(b.properties['subject']).toBe('');
  });

  it('seeds decision nodes with two branches', () => {
    expect(createNodeData(WorkflowNodeKind.Decision).branches).toHaveLength(2);
    expect(createNodeData(WorkflowNodeKind.Delay).branches).toBeUndefined();
  });
});

describe('toPaletteItem', () => {
  it('uses the catalog template as the node type', () => {
    const item = toPaletteItem(WorkflowNodeKind.AiAgent);
    expect(item.type).toBe(NODE_CATALOG[WorkflowNodeKind.AiAgent].template);
    expect(item.data.kind).toBe(WorkflowNodeKind.AiAgent);
  });
});

describe('selectedOption', () => {
  it('resolves the chosen option of a select field', () => {
    const data = createNodeData(WorkflowNodeKind.Notification, {});
    expect(selectedOption(data, 'type')?.label).toBe('Email');
    expect(selectedOption(data, 'recipient')).toBeUndefined();
    expect(selectedOption(data, undefined)).toBeUndefined();
  });
});

describe('isFieldVisible', () => {
  it('honours showIf rules', () => {
    const apiUrl = NODE_CATALOG[WorkflowNodeKind.Action].fields.find((f) => f.key === 'apiUrl')!;
    expect(isFieldVisible(apiUrl, { type: 'makeApiCall' })).toBe(true);
    expect(isFieldVisible(apiUrl, { type: 'sendEmail' })).toBe(false);
  });
});
