namespace Compiled {
  export type Literal = {
    /** kind: "literal" */
    K: "l";
    /** value */
    V: unknown;
  };

  export type Field = {
    /** kind: "field" */
    K: "f";
    /** name */
    N: string;
    /** class (model) */
    C: string;
    /** value */
    V: Literal;
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

  export type Property = {
    /** kind: "property" */
    K: "p";
    /** name */
    N: string;
    /** value */
    V: Field | Reference | Conditional;
  };

  export type Element = {
    /** kind: "element" */
    K: "e";
    /** class (tag) */
    C: string;
    /** properties */
    P: Array<Property>;
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
