namespace Compiled {
  export type Literal = {
    /** kind: "literal" */
    K: "l";
    /** value */
    V: unknown;
  };

  export type Reference = {
    /** kind: "reference" */
    K: "r";
    /** name or names */
    N: string | Array<string>;
    /** argument */
    A?: Literal;
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

  export type Conditional = {
    /** kind: "conditional" */
    K: "c";
    /** query */
    Q: Reference;
    /** yes branch */
    Y: Literal;
    /** zag branch */
    Z: Literal;
  };

  export type Property = {
    /** kind: "property" */
    K: "p";
    /** name */
    N: string;
    /** value */
    V: Literal | Reference | Conditional;
  };

  export type Atom = {
    /** kind: "atom" */
    K: "a";
    /** class (tag-name) */
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
    B: Array<Field | Atom>;
  };

  export type App = {
    /** kind: "app" */
    K: "/";
    /** body */
    B: [View];
  };
}
