export type PrimitiveData = boolean | number | string;

export type StructureData = { _structure: object };

export type ScalarData = PrimitiveData | StructureData | Element;

export type Data = ScalarData | Array<Data>;

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

export type Structure = Field<StructureData> & {
  modelKey: "Structure";
};

export type ElementField = Field<Element> & {
  modelKey: "Element";
};

export type Collection = Field<Array<Data>> & {
  modelKey: "Collection";
};

export type Reference = {
  kind: "reference";
  keyPath: Array<string>;
  argumentBinding?: Field;
};

export type Conditional = {
  kind: "conditional";
  condition: Reference;
  positive: Field;
  negative: Field;
};

export type Input = {
  kind: "input";
  dataBinding: Field | Reference | Conditional;
};

export type Output = {
  kind: "output";
  dataBinding: Reference;
};

export type Element = {
  kind: "element";
  viewKey: string;
  properties?: Record<string, Input | Output>;
};

export type View = {
  kind: "view";
  viewKey: string;
  element: Element;
  fields?: Record<string, Field>;
  name?: string;
};

export type App = {
  kind: "ViewScript v0.2.1 App";
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
    isStructureData(node) ||
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

export function isOutput(node: unknown): node is Output {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "output"
  );
}

export function isStructure(field: Field): field is Structure {
  return field.modelKey === "Structure";
}

export function isStructureData(node: unknown): node is StructureData {
  return typeof node === "object" && node !== null && "_structure" in node;
}

export function isText(field: Field): field is Text {
  return field.modelKey === "Text";
}
