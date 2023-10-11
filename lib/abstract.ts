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

export type ArrayField = Field<Array<Data>> & {
  modelKey: "Array";
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
  properties: Record<string, Inlet | Outlet>;
};

export type View = {
  kind: "view";
  viewKey: string;
  element: Element;
  terrain: Record<string, Field | Stream>;
  name?: string;
};

export type App = {
  kind: "ViewScript v0.3.3 App";
  root: View;
  views: Record<string, View>;
};

export function isStructure(node: unknown): node is Structure {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "data" &&
    "structure" in node &&
    typeof node.structure === "object" &&
    node.structure !== null &&
    Object.values(node.structure).every(isData)
  );
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

export function isConditional(node: unknown): node is Conditional {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "conditional"
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

export function isElement(node: unknown): node is Element {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "element"
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
