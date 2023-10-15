// Data Sources:

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

/**
 * A node in the abstract syntax tree.
 */
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
  FieldValue extends Value = Value,
> = Node<"field"> & {
  key: string;
  modelKey: ModelKey;
  initialValue?: FieldValue;
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
export type StructureField<ModelKey extends string = string> = Field<
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
  argument?: DataSource;
};

/**
 * An identifiable mapping of an optional parameter to a result.
 */
export type Method = Node<"method"> & {
  key: string;
  parameter?: Field;
  result: DataSource;
};

/**
 * A conditional source of data.
 */
export type ConditionalData = Node<"conditionalData"> & {
  when: DataSource;
  then: DataSource;
  else?: DataSource;
};

// Side Effects:

/**
 * An abstract drain for data flowing out of a publisher.
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

/**
 * A step taken by an action.
 */
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
};

/**
 * A conditional fork in a series of steps.
 */
export type ConditionalFork = Node<"conditionalFork"> & {
  when: DataSource;
  then?: Array<ActionStep>;
};

// Model & View:

/**
 * A template used to construct an element.
 * It has a set of fields and streams which bind to element properties at runtime.
 */
export type View = Node<"view"> & {
  key: string;
  element: Element;
  terrain: Record<string, Stream | Field>;
};

/**
 * A template used to construct, use, and manipulate data.
 * It has a set of fields, methods, and actions which bind to field members at runtime.
 */
export type Model = Node<"model"> & {
  key: string;
  members: Record<string, Field | Method | Action>;
};

// Apps:

/**
 * An abstract ViewScript app.
 */
export type App = Node<"app"> & {
  version: "ViewScript v0.3.4";
  root: View;
  branches: Record<string, View | Model>;
};

// Type Guards:

function isNode<Kind extends string>(x: unknown, kind: Kind): x is Node<Kind> {
  return (
    x !== null &&
    (typeof x === "object" || typeof x === "function") &&
    "kind" in x &&
    x.kind === kind
  );
}

export function isAction(node: unknown): node is Action {
  return isNode(node, "action");
}

export function isActionReference(node: unknown): node is ActionReference {
  return isNode(node, "actionReference");
}

export function isActionStep(node: unknown): node is ActionStep {
  return (
    isActionReference(node) ||
    isStreamReference(node) ||
    isConditionalFork(node)
  );
}

export function isArrayField(field: Field): field is ArrayField {
  return field.modelKey === "Array";
}

export function isBooleanField(field: Field): field is BooleanField {
  return field.modelKey === "Boolean";
}

export function isConditionalData(node: unknown): node is ConditionalData {
  return isNode(node, "conditionalData");
}

export function isConditionalFork(node: unknown): node is ConditionalFork {
  return isNode(node, "conditionalFork");
}

export function isDataSource(node: unknown): node is DataSource {
  return (
    isValue(node) ||
    isFieldReference(node) ||
    isMethodReference(node) ||
    isConditionalData(node)
  );
}

export function isElement(node: unknown): node is Element {
  return isNode(node, "element");
}

export function isElementField(field: Field): field is ElementField {
  return field.modelKey === "Element";
}

export function isField(node: unknown): node is Field {
  return isNode(node, "field");
}

export function isFieldReference(node: unknown): node is FieldReference {
  return isNode(node, "fieldReference");
}

export function isMethod(node: unknown): node is Method {
  return isNode(node, "method");
}

export function isMethodReference(node: unknown): node is MethodReference {
  return isNode(node, "methodReference");
}

export function isNumberField(field: Field): field is NumberField {
  return field.modelKey === "Number";
}

export function isSideEffect(node: unknown): node is SideEffect {
  return isAction(node) || isActionStep(node);
}

export function isStreamReference(node: unknown): node is StreamReference {
  return isNode(node, "streamReference");
}

export function isStringField(field: Field): field is StringField {
  return field.modelKey === "String";
}

export function isStructure(node: unknown): node is Structure {
  return (
    isNode(node, "structure") &&
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
    (field.initialValue === undefined || isStructure(field.initialValue))
  );
}

export function isValue(node: unknown): node is Value {
  return (
    node === null ||
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "string" ||
    isStructure(node) ||
    isElement(node) ||
    (node instanceof Array && node.every(isDataSource))
  );
}

export function isView(node: unknown): node is View {
  return isNode(node, "view");
}
