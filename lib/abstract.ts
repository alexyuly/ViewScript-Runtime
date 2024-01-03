export namespace Abstract {
  /**
   * Foundation:
   */

  // INNER-PROP-NAME = VIEW
  // INNER-PROP-NAME = MODEL
  // INNER-PROP-NAME = METHOD
  // INNER-PROP-NAME = FIELD
  // INNER-PROP-NAME = ACTION
  // ATOM
  // VIEW-INSTANCE
  export type App = {
    kind: "app";
    innerProps: Record<string, View | Model | Method | Field | Action>;
    stage: Array<Atom | ViewInstance>;
  };

  // view {
  //   INNER-PROP-NAME = METHOD
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  //   ATOM
  //   VIEW-INSTANCE
  // }
  export type View = {
    kind: "view";
    innerProps: Record<string, Method | Field | Action>;
    stage: Array<Atom | ViewInstance>;
  };

  // model {
  //   INNER-PROP-NAME = METHOD
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  // }
  export type Model = {
    kind: "model";
    innerProps: Record<string, Method | Field | Action>;
  };

  // make RESULT
  // (PARAM0, PARAM1, ETC...) => RESULT
  // (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) => RESULT
  export type Method = {
    kind: "method";
    params: Array<string>;
    result: Field;
  };

  /**
   * Fields:
   */

  // CONTENT
  // CONTENT catch FALLBACK
  export type Field = {
    kind: "field";
    content: Expectation | Atom | ViewInstance | ModelInstance | RawValue | Reference | Expression | ConditionalField;
    fallback?: Action;
  };

  // METHOD-NAME?
  // METHOD-NAME(ARG)?
  // METHOD-NAME(ARG0, ARG1, ETC...)?
  export type Expectation = {
    kind: "expectation";
    path: Expression;
  };

  // <TAG-NAME> {
  //   OUTER-PROP-NAME: FIELD
  //   OUTER-PROP-NAME: ACTION
  // }
  export type Atom = {
    kind: "atom";
    tagName: string;
    outerProps: Record<string, Field | Action>;
  };

  // VIEW-NAME {
  //   OUTER-PROP-NAME: FIELD
  //   OUTER-PROP-NAME: ACTION
  // }
  export type ViewInstance = {
    kind: "viewInstance";
    view: string | View;
    outerProps: Record<string, Field | Action>;
  };

  // MODEL-NAME {
  //   OUTER-PROP-NAME: FIELD
  //   OUTER-PROP-NAME: ACTION
  // }
  export type ModelInstance = {
    kind: "modelInstance";
    model: string | Model;
    outerProps: Record<string, Field | Action>;
  };

  // VALUE
  // [ FIELDS ]
  // object {
  //   PROP-NAME: FIELD
  // }
  export type RawValue = {
    kind: "rawValue";
    value: unknown;
  };

  // FIELD-NAME
  // SCOPE.FIELD-NAME
  export type Reference = {
    kind: "reference";
    scope?: Field;
    fieldName: string;
  };

  // METHOD-NAME()
  // METHOD-NAME(ARG)
  // METHOD-NAME(ARG0, ARG1, ETC...)
  // SCOPE.METHOD-NAME()
  // SCOPE.METHOD-NAME(ARG)
  // SCOPE.METHOD-NAME(ARG0, ARG1, ETC...)
  export type Expression = {
    kind: "expression";
    scope?: Field;
    methodName: string;
    args: Array<Field>;
  };

  // if CONDITION then CONSEQUENCE
  // if CONDITION then CONSEQUENCE else ALTERNATIVE
  export type ConditionalField = {
    kind: "conditionalField";
    condition: Field;
    consequence: Field;
    alternative?: Field | Action;
  };

  /**
   * Actions:
   */

  // TARGET
  export type Action = {
    kind: "action";
    target: Procedure | Call | Invocation | ConditionalAction;
  };

  // do { STEPS }
  // (PARAM0, PARAM1, ETC...) -> STEP
  // (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) -> STEP
  // (PARAM0, PARAM1, ETC...) -> { STEPS }
  // (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) -> { STEPS }
  export type Procedure = {
    kind: "procedure";
    params: Array<string>;
    steps: Array<Action>;
  };

  // ACTION-NAME!
  // ACTION-NAME(ARG)!
  // ACTION-NAME(ARG0, ARG1, ETC...)!
  // SCOPE.ACTION-NAME!
  // SCOPE.ACTION-NAME(ARG)!
  // SCOPE.ACTION-NAME(ARG0, ARG1, ETC...)!
  export type Call = {
    kind: "call";
    scope?: Field;
    actionName: string;
    args?: Array<Field>;
  };

  // await PREREQUISITE
  // await PREREQUISITE [...] STEPS
  // let PARAMETER-NAME = PREREQUISITE [...] STEPS
  // (The bracketed ellipsis represents a new line separating the prerequisite from the procedure's steps.)
  export type Invocation = {
    kind: "invocation";
    prerequisite: Field;
    procedure?: Procedure;
  };

  // when CONDITION then CONSEQUENCE
  // when CONDITION then CONSEQUENCE else ALTERNATIVE
  export type ConditionalAction = {
    kind: "conditionalAction";
    condition: Field;
    consequence: Action;
    alternative?: Action;
  };

  /**
   * Useful stuff:
   */

  export type Component = {
    kind: string;
  };

  export function isComponent(value: unknown): value is Component {
    return isRawObject(value) && "kind" in value && typeof value.kind === "string";
  }

  export function isRawObject(value: unknown): value is object {
    return typeof value === "object" && value !== null && !(value instanceof Array);
  }
}
