// Data Sources

/**
 * An abstract source of data feeding into a subscriber.
 */
export type DataSource =
  | Value
  | FieldReference
  | MethodReference
  | ConditionalData;

/**
 * An anonymous source of data feeding into a subscriber.
 */
export type Value = Primitive | Structure | Element | Array<DataSource>;

/**
 * A primitive value.
 */
export type Primitive = null | boolean | number | string;

export type Node<Kind extends string> = {
  kind: Kind;
};

/**
 * A mapping of keys to data sources.
 */
export type Structure = Node<"structure"> & {
  data: Record<string, DataSource>;
};

/**
 * A binding to an HTML element.
 * It is rendered using either a view or an HTML tag name.
 */
export type Element = Node<"element"> & {
  viewKey: string;
  properties: Record<string, DataSource | SideEffect>;
};

/**
 * A reference to a field, or a data source within its structure.
 */
export type FieldReference = Node<"fieldReference"> & {
  pathToFieldKey: Array<string>;
};

/**
 * An identifiable container for values.
 * It is validated by a model.
 * It may be initialized to a value.
 */
export type Field<
  ModelKey extends string = string,
  T extends Value = Value,
> = Node<"field"> & {
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
 * A source of data from subscribing to a method.
 */
export type MethodReference = Node<"methodReference"> & {
  pathToMethodKey: Array<string>;
  argument?: DataSource | MethodDelegate;
};

/**
 * An anonymous mapping of a parameter to a result.
 * It can be passed as an argument when subscribing to a method.
 * It is used to implement array methods like `map` and `filter`.
 */
export type MethodDelegate = Node<"methodDelegate"> & {
  parameter: Field;
  result: DataSource;
};

/**
 * An identifiable mapping of an optional parameter to a result.
 */
export type Method = Node<"method"> & {
  key: string;
  parameter?: Field | MethodDelegateSlot;
  result: DataSource;
};

/**
 * A method parameter which accepts a method delegate as an argument.
 */
export type MethodDelegateSlot = Node<"methodDelegateSlot">;

/**
 * A conditional source of data.
 */
export type ConditionalData = Node<"conditionalData"> & {
  when: DataSource;
  then: DataSource;
  else?: DataSource;
};

// Side Effects

/**
 * An abstract sink for data flowing out of a publisher.
 */
export type SideEffect = Action | ActionStep;

/**
 * An identifiable mapping of an optional parameter to a series of steps.
 */
export type Action = Node<"action"> & {
  key: string;
  parameter?: Field;
  steps: Array<ActionStep>;
};

export type ActionStep = ActionReference | StreamReference | ConditionalFork;

/**
 * An aggregate side effect which results from calling an action.
 */
export type ActionReference = Node<"actionReference"> & {
  pathToActionKey: Array<string>;
  argument?: DataSource;
};

/**
 * A reference to a stream.
 */
export type StreamReference = Node<"streamReference"> & {
  streamKey: string;
  argument?: DataSource;
};

/**
 * An identifiable channel for data flowing out of an element.
 */
export type Stream = Node<"stream"> & {
  key: string;
  parameter?: Field;
};

/**
 * A conditional fork in a series of steps.
 */
export type ConditionalFork = Node<"conditionalFork"> & {
  when: DataSource;
  then?: Array<ActionStep>;
};

// Model & View

/**
 * A template used to construct an element.
 * It has a set of fields and streams which may bind to element properties.
 */
export type View = Node<"view"> & {
  key: string;
  element: Element;
  terrain: Record<string, Field | Stream>;
};

/**
 * A template used to construct, use, and manipulate data.
 */
export type Model = Node<"model"> & {
  key: string;
  members: Record<string, Field | Method | Action>;
};

// Apps

/**
 * An abstract ViewScript app.
 */
export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  root: View;
  branches: Record<string, View | Model>;
};

// Type guards

function isNode<Kind extends string>(x: unknown, kind: Kind): x is Node<Kind> {
  return typeof x === "object" && x !== null && "kind" in x && x.kind === kind;
}

export function isAction(node: unknown): node is Action {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "action"
  );
}

export function isArrayField(field: Field): field is ArrayField {
  return field.modelKey === "Array";
}

export function isBooleanField(field: Field): field is BooleanField {
  return field.modelKey === "Boolean";
}

export function isConditionalData(node: unknown): node is ConditionalData {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "conditionalData"
  );
}

export function isDataSource(node: unknown): node is DataSource {
  return (
    isValue(node) ||
    isFieldReference(node) ||
    isConditionalData(node) ||
    isMethodReference(node)
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

export function isElementField(field: Field): field is ElementField {
  return field.modelKey === "Element";
}

export function isField(node: unknown): node is Field {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "field"
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

export function isMethodReference(node: unknown): node is MethodReference {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "methodReference"
  );
}

export function isNumberField(field: Field): field is NumberField {
  return field.modelKey === "Number";
}

export function isStringField(field: Field): field is StringField {
  return field.modelKey === "String";
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

export function isStructureField<ModelKey extends string>(
  field: Field<ModelKey>
): field is StructureField<ModelKey> {
  return (
    isField(field) &&
    (field["value"] === undefined || isStructure(field["value"]))
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

export function isView(node: unknown): node is View {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "view"
  );
}
