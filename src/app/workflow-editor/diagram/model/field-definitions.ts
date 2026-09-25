/**
 * A deliberately tiny, declarative description of the properties form. Each
 * node kind lists its fields in the catalog; the properties panel renders them
 * with Signal Forms. This is not a JSON Schema engine — just enough to show how
 * a catalog-driven form works.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Icon reference, see `NodeIconComponent` for the accepted formats. */
  icon?: string;
}

/** Show a field only when another property currently holds one of `values`. */
export interface ShowIf {
  key: string;
  values: readonly string[];
}

interface FieldBase {
  /** Key inside `WorkflowNodeData.properties`. */
  key: string;
  label: string;
  showIf?: ShowIf;
}

export interface TextField extends FieldBase {
  kind: 'text' | 'textarea';
  placeholder?: string;
}

export interface SelectField extends FieldBase {
  kind: 'select';
  options: readonly SelectOption[];
  placeholder?: string;
}

export interface SwitchField extends FieldBase {
  kind: 'switch';
}

export type FieldDefinition = TextField | SelectField | SwitchField;

/** True when `field` should be visible for the given property values. */
export function isFieldVisible(
  field: FieldDefinition,
  properties: Readonly<Record<string, unknown>>,
): boolean {
  if (!field.showIf) return true;
  const current = properties[field.showIf.key];
  return typeof current === 'string' && field.showIf.values.includes(current);
}
