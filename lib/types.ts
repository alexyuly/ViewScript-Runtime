export type Field = {
  kind: "field";
  name: string;
  model: string;
  value?: unknown;
};

export type Condition = Field & {
  model: "Condition";
  value: boolean;
};

export type ElementField = Field & {
  model: "Element";
  value: Element;
};

export type Text = Field & {
  model: "Text";
  value: string;
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
  kind: "ViewScript v0.0.4 App";
  body: [View];
};

export function isConditionField(field: Field): field is Condition {
  return field.model === "Condition";
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
