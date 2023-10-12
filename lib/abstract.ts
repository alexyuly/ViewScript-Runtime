// Data Sources

/**
 * An abstract source of data which feeds into nodes.
 */
export type DataSource =
  | Value
  | FieldReference
  | ConditionalData
  | MethodResult;

/**
 * An anonymous source of data which feeds into a single node.
 */
export type Value = Primitive | Structure | Element | Array<DataSource>;

/**
 * A primitive value.
 */
export type Primitive = boolean | number | string;

/**
 * A mapping of keys to data sources.
 * It may be validated by a model.
 */
export type Structure = {
  kind: "structure";
  data: Record<string, DataSource>;
  modelKey?: string;
};

/**
 * A renderable node.
 * It is rendered using either a view or an HTML tag name.
 */
export type Element = {
  kind: "element";
  viewKey: string | `<${string}>`;
  properties: Record<string, DataSource | Destination>;
};

/**
 * A reference to a field, or a data source within its structure.
 */
export type FieldReference = {
  kind: "fieldReference";
  keyPath: Array<string>;
};

/**
 * An identifiable container for values.
 * It is validated by a model.
 */
export type Field<T extends Value = Value> = {
  kind: "field";
  fieldKey: string;
  modelKey: string;
  value?: T;
};

/**
 * A field containing boolean values.
 */
export type BooleanField = Field<boolean> & {
  modelKey: "Boolean";
};

/**
 * A field containing numeric values.
 */
export type NumberField = Field<number> & {
  modelKey: "Number";
};

/**
 * A field containing string values.
 */
export type StringField = Field<string> & {
  modelKey: "String";
};

/**
 * A field containing structures.
 */
export type StructureField = Field<Structure> & {
  modelKey: "Structure";
};

/**
 * A field containing elements.
 */
export type ElementField = Field<Element> & {
  modelKey: "Element";
};

/**
 * A field containing arrays of data sources.
 */
export type ArrayField = Field<Array<DataSource>> & {
  modelKey: "Array";
  innerModelKey?: string;
};

/**
 * A conditional data source.
 */
export type ConditionalData = {
  kind: "conditionalData";
  when: DataSource;
  then: DataSource;
  else?: DataSource;
};

/**
 * A data source which is the result of a method call.
 */
export type MethodResult = {
  kind: "methodResult";
  keyPath: Array<string>;
  argument?: DataSource | MethodDelegate;
};

/**
 * An anonymous mapping of a parameter to a result.
 * It is passed as an argument to a method call.
 * It is used to implement array methods like `map` and `filter`.
 */
export type MethodDelegate = {
  kind: "methodDelegate";
  parameter: Field;
  result: DataSource;
};

/**
 * An identifiable mapping of an optional parameter to a result.
 */
export type Method = {
  kind: "method";
  methodKey: string;
  parameter?: Field | MethodDelegateSlot;
  result: DataSource;
};

/**
 * A method parameter which accepts a method delegate as an argument.
 */
export type MethodDelegateSlot = {
  kind: "methodDelegateSlot";
};

// Destinations

/**
 * An abstract destination for data sent out from nodes.
 */
export type Destination =
  | StreamReference
  | Action
  | ActionEffect
  | ConditionalFork;

/**
 * A reference to a stream.
 */
export type StreamReference = {
  kind: "streamReference";
  streamKey: string;
  argument?: DataSource;
};

/**
 * An identifiable stream of events.
 */
export type Stream = {
  kind: "stream";
  streamKey: string;
  parameter?: Field;
};

/**
 * An identifiable mapping of an optional parameter to a sequence of side effects.
 */
export type Action = {
  kind: "action";
  actionKey: string;
  parameter?: Field;
  effects: Array<ActionEffect | ConditionalFork>;
};

/**
 * A side effect which results from calling an action.
 */
export type ActionEffect = {
  kind: "actionEffect";
  keyPath: Array<string>;
  argument?: DataSource;
};

/**
 * A conditional fork in a sequence of side effects.
 */
export type ConditionalFork = {
  kind: "conditionalFork";
  when: DataSource;
  then?: Array<ActionEffect | ConditionalFork>;
};

// Apps

/**
 * An abstract ViewScript app.
 */
export type App = {
  kind: "ViewScript v0.4.0 App";
  root: View;
  views: Record<string, View>;
  models: Record<string, Model>;
};

/**
 * A template used to render an element.
 * It has a set of fields and streams which may bind to element properties.
 */
export type View = {
  kind: "view";
  viewKey: string;
  element: Element;
  terrain: Record<string, Field | Stream>;
};

/**
 * A template used to create and manipulate data.
 */
export type Model = {
  kind: "model";
  modelKey: string;
  members: Record<string, Field | Method | Action>;
};

// Type guards

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
