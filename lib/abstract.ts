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
  // (PARAMETER-NAME) => RESULT
  // (PARAMETER-NAME: TYPE) => RESULT
  export type Method = {
    kind: "method";
    parameterName?: string;
    result: Field;
  };

  /**
   * Fields:
   */

  // CONTENT
  // CONTENT otherwise FALLBACK
  export type Field = {
    kind: "field";
    content: Atom | ViewInstance | ModelInstance | RawValue | Reference | Expression | Expectation | Implication;
    fallback?: Action;
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

  // object {
  //   OUTER-PROP-NAME: FIELD
  //   OUTER-PROP-NAME: ACTION
  // }
  // MODEL-NAME {
  //   OUTER-PROP-NAME: FIELD
  //   OUTER-PROP-NAME: ACTION
  // }
  export type ModelInstance = {
    kind: "modelInstance";
    model?: string | Model;
    outerProps: Record<string, Field | Action>;
  };

  // VALUE
  export type RawValue = {
    kind: "rawValue";
    value?: unknown;
  };

  // FIELD-NAME
  // SCOPE.FIELD-NAME
  export type Reference = {
    kind: "reference";
    scope?: Field;
    fieldName: string;
  };

  // METHOD-NAME()
  // METHOD-NAME(ARGUMENT)
  // METHOD-NAME(ARGUMENT0, ARGUMENT1, ETC...)
  // SCOPE.METHOD-NAME()
  // SCOPE.METHOD-NAME(ARGUMENT)
  // SCOPE.METHOD-NAME(ARGUMENT0, ARGUMENT1, ETC...)
  export type Expression = {
    kind: "expression";
    scope?: Field;
    methodName: string;
    arguments: Array<Field>;
  };

  // METHOD-NAME?
  // METHOD-NAME(ARGUMENT)?
  // METHOD-NAME(ARGUMENT0, ARGUMENT1, ETC...)?
  // SCOPE.METHOD-NAME?
  // SCOPE.METHOD-NAME(ARGUMENT)?
  // SCOPE.METHOD-NAME(ARGUMENT0, ARGUMENT1, ETC...)?
  export type Expectation = {
    kind: "expectation";
    expression: Expression;
  };

  // if CONDITION then CONSEQUENCE
  // if CONDITION then CONSEQUENCE else ALTERNATIVE
  export type Implication = {
    kind: "implication";
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
    target: Procedure | Call | Invocation | Gate;
  };

  // do { STEPS }
  // (PARAMETER-NAME) -> STEP
  // (PARAMETER-NAME: TYPE) -> STEP
  // (PARAMETER-NAME) -> { STEPS }
  // (PARAMETER-NAME: TYPE) -> { STEPS }
  export type Procedure = {
    kind: "procedure";
    parameterName?: string;
    steps: Array<Action>;
  };

  // ACTION-NAME!
  // ACTION-NAME(ARGUMENT)!
  // ACTION-NAME(ARGUMENT0, ARGUMENT1, ETC...)!
  // SCOPE.ACTION-NAME!
  // SCOPE.ACTION-NAME(ARGUMENT)!
  // SCOPE.ACTION-NAME(ARGUMENT0, ARGUMENT1, ETC...)!
  export type Call = {
    kind: "call";
    scope?: Field;
    actionName: string;
    arguments: Array<Field>;
  };

  // let PARAMETER-NAME = CAUSE [...] EFFECT
  // (The bracketed ellipsis represents a new line separating the cause from the effect.)
  export type Invocation = {
    kind: "invocation";
    cause: Field;
    parameterName?: string;
    effect?: Action;
  };

  // return if CONDITION
  // return if CONDITION then CONSEQUENCE
  export type Gate = {
    kind: "gate";
    condition: Field;
    consequence?: Action;
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
