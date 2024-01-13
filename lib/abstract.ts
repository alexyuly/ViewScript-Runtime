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
      | Producer;
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

  // METHOD-NAME()?
  // METHOD-NAME(ARG)?
  // METHOD-NAME(ARG0, ARG1, ETC...)?
  export type Expectation = {
    kind: "expectation";
    means: Expression;
  };

  // from { STEPS }
  export type Producer = {
    kind: "producer";
    steps: Array<Field | Procedure | Call | Decision | Resolution>;
  };

  /**
   * Actions:
   */

  // HANDLER
  // given PARAM HANDLER
  // given (PARAM0, PARAM1, ETC...) HANDLER
  // given (PARAM0: TYPE0, PARAM1: TYPE1, ETC...) HANDLER
  export type Action = {
    kind: "action";
    params: Array<string>;
    handler: Procedure;
  };

  // do { STEPS }
  // do { STEPS } or FALLBACK
  export type Procedure = {
    kind: "procedure";
    steps: Array<Procedure | Call | Decision | Resolution>;
    fallback?: Action;
  };

  // ACTION-NAME
  // ACTION-NAME(ARG)
  // ACTION-NAME(ARG0, ARG1, ETC...)
  // SCOPE.ACTION-NAME
  // SCOPE.ACTION-NAME(ARG)
  // SCOPE.ACTION-NAME(ARG0, ARG1, ETC...)
  export type Call = {
    kind: "call";
    scope?: Field;
    actionName: string;
    args: Array<Field>;
  };

  // if CONDITION then CONSEQUENCE
  // if CONDITION then CONSEQUENCE else ALTERNATIVE
  export type Decision = {
    kind: "decision";
    condition: Field;
    consequence: Procedure;
    alternative?: Procedure;
  };

  // await QUESTION
  // await QUESTION
  // let RESOLVER-PARAM = QUESTION \n RESOLVER-HANDLER
  export type Resolution = {
    kind: "resolution";
    question: Field;
    resolver?: Action;
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
