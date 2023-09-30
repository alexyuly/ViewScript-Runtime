export type Field = {
  /** kind: "field" */
  K: "f";
  /** name */
  N: string;
  /** class (model) */
  C: string;
  /** value */
  V?: unknown;
};

export type Condition = Field & {
  C: "Condition";
  V: boolean;
};

export type ElementField = Field & {
  C: "Element";
  V: Element;
};

export type Text = Field & {
  C: "Text";
  V: string;
};

export type Reference = {
  /** kind: "reference" */
  K: "r";
  /** name or names */
  N: string | Array<string>;
  /** argument */
  A?: Field;
};

export type Conditional = {
  /** kind: "conditional" */
  K: "c";
  /** query */
  Q: Reference;
  /** yes branch */
  Y: Field;
  /** zag branch */
  Z: Field;
};

export type Input = {
  /** kind: "input" */
  K: "i";
  /** name */
  N: string;
  /** value */
  V: Field | Reference | Conditional;
};

export type Output = {
  /** kind: "output" */
  K: "o";
  /** name */
  N: string;
  /** value */
  V: Reference;
};

export type Element = {
  /** kind: "element" */
  K: "e";
  /** class (tag) */
  C: string;
  /** properties */
  P: Array<Input | Output>;
};

export type View = {
  /** kind: "view" */
  K: "v";
  /** name */
  N: string;
  /** body */
  B: Array<Field | Element>;
};

export type App = {
  /** kind */
  K: "ViewScript v0.0.4 App";
  /** body */
  B: [View];
};

export function isConditionField(field: Field): field is Condition {
  return field.C === "Condition";
}

export function isElement(node: unknown): node is Element {
  return (
    typeof node === "object" && node !== null && "K" in node && node.K === "e"
  );
}

export function isElementField(field: Field): field is ElementField {
  return field.C === "Element";
}

export function isOutput(node: unknown): node is Output {
  return (
    typeof node === "object" && node !== null && "K" in node && node.K === "o"
  );
}

export function isTextField(field: Field): field is Text {
  return field.C === "Text";
}
