// Data Sources

/**
 * An abstract source of data feeding into a subscriber.
 */
export type DataSource =
  | Value
  | FieldReference
  | ConditionalData
  | MethodReference;

/**
 * An anonymous source of data feeding into a subscriber.
 */
export type Value = Primitive | Structure | Element | Array<DataSource>;

/**
 * A primitive value.
 */
export type Primitive = boolean | number | string;

/**
 * A mapping of keys to data sources.
 */
export type Structure = {
  kind: "structure";
  data: Record<string, DataSource>;
};

/**
 * A binding to an HTML element.
 * It is rendered using either a view or an HTML tag name.
 */
export type Element = {
  kind: "element";
  viewKey: string;
  properties: Record<string, DataSource | SideEffect>;
};

/**
 * A reference to a field, or a data source within its structure.
 */
export type FieldReference = {
  kind: "fieldReference";
  pathToFieldKey: Array<string>;
};

/**
 * An identifiable container for values.
 * It is validated by a model.
 * It may be initialized to a value.
 */
export type Field<ModelKey extends string = string, T extends Value = Value> = {
  kind: "field";
  key: string;
  modelKey: ModelKey;
  value?: T;
};

/**
 * A field containing boolean values.
 */
export type BooleanField = Field<"Boolean", boolean>;

/**
 * A field containing numeric values.
 */
export type NumberField = Field<"Number", number>;

/**
 * A field containing string values.
 */
export type StringField = Field<"String", string>;

/**
 * A field containing structures.
 * It is validated by a model.
 */
export type StructureField<ModelKey extends string> = Field<
  ModelKey,
  Structure
>;

/**
 * A field containing elements.
 */
export type ElementField = Field<"Element", Element>;

/**
 * A field containing arrays of data sources.
 * Its children's data sources may be validated by a model.
 */
export type ArrayField = Field<"Array", Array<DataSource>> & {
  dataModelKey?: string;
};

/**
 * A conditional source of data.
 */
export type ConditionalData = {
  kind: "conditionalData";
  when: DataSource;
  then: DataSource;
  else?: DataSource;
};

/**
 * A source of data from subscribing to a method.
 */
export type MethodReference = {
  kind: "methodReference";
  pathToMethodKey: Array<string>;
  argument?: DataSource | MethodDelegate;
};

/**
 * An anonymous mapping of a parameter to a result.
 * It can be passed as an argument when subscribing to a method.
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
  key: string;
  parameter?: Field | MethodDelegateSlot;
  result: DataSource;
};

/**
 * A method parameter which accepts a method delegate as an argument.
 */
export type MethodDelegateSlot = {
  kind: "methodDelegateSlot";
};

// Side Effects

/**
 * An abstract sink for data flowing out of a publisher.
 */
export type SideEffect = Action | ActionStep;

/**
 * An identifiable mapping of an optional parameter to a series of steps.
 */
export type Action = {
  kind: "action";
  key: string;
  parameter?: Field;
  steps: Array<ActionStep>;
};

export type ActionStep = ActionReference | StreamReference | ConditionalFork;

/**
 * An aggregate side effect which results from calling an action.
 */
export type ActionReference = {
  kind: "actionReference";
  pathToActionKey: Array<string>;
  argument?: DataSource;
};

/**
 * A reference to a stream.
 */
export type StreamReference = {
  kind: "streamReference";
  streamKey: string;
  argument?: DataSource;
};

/**
 * An identifiable channel for data flowing out of an element.
 */
export type Stream = {
  kind: "stream";
  key: string;
  parameter?: Field;
};

/**
 * A conditional fork in a series of steps.
 */
export type ConditionalFork = {
  kind: "conditionalFork";
  when: DataSource;
  then?: Array<ActionStep>;
};

// Apps

/**
 * An abstract ViewScript app.
 */
export type App = {
  kind: "ViewScript v0.4.0 App";
  root: View;
  branches: Record<string, View | Model>;
};

/**
 * A template used to construct an element.
 * It has a set of fields and streams which may bind to element properties.
 */
export type View = {
  kind: "view";
  key: string;
  element: Element;
  terrain: Record<string, Field | Stream>;
};

/**
 * A template used to construct, use, and manipulate data.
 */
export type Model = {
  kind: "model";
  key: string;
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

// TODO fix
// export function isStructureField(field: Field): field is StructureField {
//   return field.modelKey === "Structure";
// }

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

export function isMethodResult(node: unknown): node is MethodReference {
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
