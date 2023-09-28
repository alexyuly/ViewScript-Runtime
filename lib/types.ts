namespace Compiled {
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
  };

  export type Text = Field & {
    C: "Text";
  };

  export function isCondition(
    field: Compiled.Field
  ): field is Compiled.Condition {
    return field.C === "Condition";
  }

  export function isText(field: Compiled.Field): field is Compiled.Text {
    return field.C === "Text";
  }

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
    /** kind: "app" */
    K: "/";
    /** body */
    B: [View];
  };
}
