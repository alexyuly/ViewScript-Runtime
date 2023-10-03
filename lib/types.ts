export type Field<T = unknown> = {
  kind: "field";
  name: string;
  model: string;
  value?: T;
};

export type Condition = Field<boolean> & {
  model: "Condition";
};

export type Count = Field<number> & {
  model: "Count";
};

export type Text = Field<string> & {
  model: "Text";
};

export type ElementField = Field<Element> & {
  model: "Element";
};

export type Collection = Field<Array<unknown>> & {
  model: "Collection";
};

export type Reference = {
  kind: "reference";
  name: string | Array<string>;
  argument?: Field;
};

export type Conditional = {
  kind: "conditional";
  condition: Reference;
  positive: Field;
  negative: Field;
};

export type Input = {
  kind: "input";
  name: string;
  value: Field | Reference | Conditional;
};

export type Output = {
  kind: "output";
  name: string;
  value: Reference;
};

export type Element = {
  kind: "element";
  view: string;
  properties: Array<Input | Output>;
};

export type View = {
  kind: "view";
  name: string;
  body: Array<Field | Element>;
};

export type App = {
  kind: "ViewScript v0.1.0 App";
  body: [View];
};

export function isCollectionField(field: Field): field is Collection {
  return field.model === "Collection";
}

export function isConditionField(field: Field): field is Condition {
  return field.model === "Condition";
}

export function isCountField(field: Field): field is Count {
  return field.model === "Count";
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
  return field.model === "Element";
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
  return field.model === "Text";
}
