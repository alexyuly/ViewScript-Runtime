export type Primitive = boolean | number | string;

export type Structure = {
  kind: "data";
  structure: Record<string, Data>;
};

export type Data = Primitive | Structure | Element | Array<Data>;

export type Field<T extends Data = Data> = {
  kind: "field";
  fieldKey: string;
  modelKey: string;
  name?: string;
  value?: T;
};

export type Condition = Field<boolean> & {
  modelKey: "Condition";
};

export type Count = Field<number> & {
  modelKey: "Count";
};

export type Text = Field<string> & {
  modelKey: "Text";
};

export type StructureField = Field<Structure> & {
  modelKey: "Structure";
};

export type ElementField = Field<Element> & {
  modelKey: "Element";
};

export type Collection = Field<Array<Data>> & {
  modelKey: "Collection";
};

export type Conditional = {
  kind: "conditional";
  condition: Input;
  positive: Field;
  negative: Field;
};

export type Stream = {
  kind: "stream";
  streamKey: string;
  modelKey?: string;
  name?: string;
};

export type Input = {
  kind: "input";
  keyPath: Array<string>;
};

export type Output = {
  kind: "output";
  keyPath: Array<string>;
  argument?: Field;
};

export type Inlet = {
  kind: "inlet";
  connection: Field | Conditional | Input;
};

export type Outlet = {
  kind: "outlet";
  connection: Output;
};

export type Element = {
  kind: "element";
  viewKey: string;
  properties?: Record<string, Inlet | Outlet>;
};

export type View = {
  kind: "view";
  viewKey: string;
  element: Element;
  terrain?: Record<string, Field | Stream>;
  name?: string;
};

export type App = {
  kind: "ViewScript v0.3.0 App";
  root: View;
  views?: Record<string, View>;
};

export function isCollection(field: Field): field is Collection {
  return field.modelKey === "Collection";
}

export function isCondition(field: Field): field is Condition {
  return field.modelKey === "Condition";
}

export function isCount(field: Field): field is Count {
  return field.modelKey === "Count";
}

export function isData(node: unknown): node is Data {
  return (
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "string" ||
    isElement(node) ||
    isStructure(node) ||
    (node instanceof Array && node.every(isData))
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

export function isOutlet(node: unknown): node is Outlet {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "outlet"
  );
}

export function isStructure(node: unknown): node is Structure {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "output"
  );
}

export function isStructureField(field: Field): field is StructureField {
  return field.modelKey === "Structure";
}

export function isText(field: Field): field is Text {
  return field.modelKey === "Text";
}
