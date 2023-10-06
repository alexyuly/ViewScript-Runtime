export type Field<T = unknown> = {
  kind: "field";
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

export type ElementField = Field<Element> & {
  modelKey: "Element";
};

export type Collection = Field<Array<unknown>> & {
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
  properties: Record<string, Input | Output>;
};

export type View = {
  kind: "view";
  fields?: Record<string, Field>;
  element: Element;
};

export type App = {
  kind: "ViewScript v0.2.0 App";
  view: View;
};

export function isCollectionField(field: Field): field is Collection {
  return field.modelKey === "Collection";
}

export function isConditionField(field: Field): field is Condition {
  return field.modelKey === "Condition";
}

export function isCountField(field: Field): field is Count {
  return field.modelKey === "Count";
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

export function isTextField(field: Field): field is Text {
  return field.modelKey === "Text";
}
