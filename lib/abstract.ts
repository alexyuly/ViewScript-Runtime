// Data Sources

/**
 * An abstract source of data which feeds into components.
 */
export type DataSource =
  | Value
  | FieldReference
  | ConditionalData
  | MethodResult;

/**
 * An anonymous source of data which feeds into one component.
 */
export type Value = Primitive | Structure | Element | Array<DataSource>;

/**
 * A primitive value.
 */
export type Primitive = boolean | number | string;

/**
 * A key-value map of data sources.
 * It may be associated with a model.
 */
export type Structure = {
  kind: "structure";
  data: Record<string, DataSource>;
  modelKey?: string;
};

/**
 * A renderable component.
 * It is associated with either a view or an HTML tag name.
 */
export type Element = {
  kind: "element";
  properties: Record<string, DataSource | Destination>;
  viewKey: string | `<${string}>`;
};

/**
 * A reference to a field or a data source within its structure.
 */
export type FieldReference = {
  kind: "fieldReference";
  fieldKeyPath: Array<string>;
};

export type Field<T extends Value = Value> = {
  kind: "field";
  fieldKey: string;
  modelKey?: string;
  value?: T;
};

export type BooleanField = Field<boolean> & {
  modelKey: "Boolean";
};

export type NumberField = Field<number> & {
  modelKey: "Number";
};

export type StringField = Field<string> & {
  modelKey: "String";
};

export type StructureField = Field<Structure> & {
  modelKey: "Structure";
};

export type ElementField = Field<Element> & {
  modelKey: "Element";
};

export type ArrayField = Field<Array<DataSource>> & {
  modelKey: "Array";
  innerModelKey?: string;
};

export type ConditionalData = {
  kind: "conditionalData";
  when: DataSource;
  then: DataSource;
  else?: DataSource;
};

export type MethodResult = {
  kind: "methodResult";
  keyPath: Array<string>;
  argument?: DataSource | Method;
};

export type Method = {
  kind: "method";
  methodKey: string;
  parameter?: Field | MethodHelper;
  result: DataSource;
};

export type MethodHelper = {
  kind: "methodHelper";
};

// Destinations

export type Destination =
  | StreamReference
  | Action
  | ActionEffect
  | ConditionalFork;

export type StreamReference = {
  kind: "streamReference";
  streamKey: string;
  argument?: DataSource;
};

export type Stream = {
  kind: "stream";
  streamKey: string;
  parameter?: Field;
};

export type Action = {
  kind: "action";
  actionKey: string;
  parameter?: Field;
  effects: Array<ActionEffect | ConditionalFork>;
};

export type ActionEffect = {
  kind: "actionEffect";
  keyPath: Array<string>;
  argument?: DataSource;
};

export type ConditionalFork = {
  kind: "conditionalFork";
  when: DataSource;
  then: Array<ActionEffect | ConditionalFork>;
};

// Apps

export type App = {
  kind: "ViewScript v0.4.0 App";
  root: View;
  views: Record<string, View>;
  models: Record<string, Model>;
};

export type View = {
  kind: "view";
  viewKey: string;
  element: Element;
  terrain: Record<string, Field | Stream>;
};

export type Model = {
  kind: "model";
  modelKey: string;
  members: Record<string, Field | Method | Action>;
};

export function isDataSource(node: unknown): node is DataSource {
  return (
    isValue(node) ||
    isFieldReference(node) ||
    isConditionalData(node) ||
    isMethodResult(node)
  );
}

export function isValue(node: unknown): node is Value {
  return (
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "string" ||
    isElement(node) ||
    isStructure(node) ||
    (node instanceof Array && node.every(isDataSource))
  );
}

export function isStructure(node: unknown): node is Structure {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "structure" &&
    "data" in node &&
    typeof node.data === "object" &&
    node.data !== null &&
    Object.values(node.data).every(isDataSource)
  );
}

export function isElement(node: unknown): node is Element {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "element"
  );
}

export function isFieldReference(node: unknown): node is FieldReference {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "fieldReference"
  );
}

export function isField(node: unknown): node is Field {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "field"
  );
}

export function isBooleanField(field: Field): field is BooleanField {
  return field.modelKey === "Boolean";
}

export function isNumberField(field: Field): field is NumberField {
  return field.modelKey === "Number";
}

export function isStringField(field: Field): field is StringField {
  return field.modelKey === "String";
}

export function isStructureField(field: Field): field is StructureField {
  return field.modelKey === "Structure";
}

export function isElementField(field: Field): field is ElementField {
  return field.modelKey === "Element";
}

export function isArrayField(field: Field): field is ArrayField {
  return field.modelKey === "Array";
}

export function isConditionalData(node: unknown): node is ConditionalData {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "conditionalData"
  );
}

export function isMethodResult(node: unknown): node is MethodResult {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "methodResult"
  );
}

export function isView(node: unknown): node is View {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "view"
  );
}
