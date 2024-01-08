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

  // return RESULT
  // given PARAM return RESULT
  // given (PARAM0, PARAM1, ETC...) return RESULT
  // given (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) return RESULT
  export type Method = {
    kind: "method";
    params: Array<string>;
    result: Field;
  };

  /**
   * Fields:
   */

  // CONTENT
  // maybe CONTENT or FALLBACK
  export type Field = {
    kind: "field";
    content:
      | Atom
      | ViewInstance
      | ModelInstance
      | RawValue
      | Reference
      | Implication
      | Expression
      | Expectation
      | Production;
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
  // [FIELD0, FIELD1, ETC...]
  // [
  //   FIELD0
  //   FIELD1
  //   ETC...
  // ]
  // object {
  //   PROP-NAME0: FIELD0
  //   PROP-NAME1: FIELD1
  //   ETC...
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

  // if CONDITION then CONSEQUENCE
  // if CONDITION then CONSEQUENCE else ALTERNATIVE
  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    alternative?: Field;
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

  // METHOD-NAME?
  // METHOD-NAME(ARG)?
  // METHOD-NAME(ARG0, ARG1, ETC...)?
  export type Expectation = {
    kind: "expectation";
    means: Expression;
  };

  // yield {
  //   yield FIELD-STEP
  //   ACTION-STEP
  // }
  export type Production = {
    kind: "production";
    steps: Array<Field | Action>;
  };

  /**
   * Actions:
   */

  // TARGET
  // try TARGET catch FALLBACK
  export type Action = {
    kind: "action";
    target: Procedure | Call | Fork | Invocation;
    fallback?: Action;
  };

  // do { STEPS }
  // given PARAM do { STEPS }
  // given (PARAM0, PARAM1, ETC...) do { STEPS }
  // given (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) do { STEPS }
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

  // when CONDITION { CONSEQUENCE }
  // when CONDITION { CONSEQUENCE } otherwise { ALTERNATIVE }
  export type Fork = {
    kind: "fork";
    condition: Field;
    consequence: Action;
    alternative?: Action;
  };

  // await REQUEST
  // await REQUEST [...] RESPONSE-STEPS
  // let RESPONSE-PARAM = REQUEST [...] RESPONSE-STEPS
  // (The bracketed ellipsis represents a new line separating the request from the response's steps.)
  export type Invocation = {
    kind: "invocation";
    request: Field;
    response?: Procedure;
  };

  /**
   * Utilities:
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

// THINGS TO CONSIDER...
// - Eliminate syntax that adds no meaning to the code.
// - Shift the paradigm from "sync vs. async" to "blocking vs. non-blocking" or "sequential vs. parallel".
