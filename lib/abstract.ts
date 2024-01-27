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
    innerProps: Record<string, ViewTemplate | ModelTemplate | Method | Field | Action>;
    stage: Array<Atom | View>;
  };

  // view template {
  //   INNER-PROP-NAME = METHOD
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  //   ATOM
  //   VIEW-INSTANCE
  // }
  export type ViewTemplate = {
    kind: "viewTemplate";
    innerProps: Record<string, Method | Field | Action>;
    stage: Array<Atom | View>;
  };

  // model template {
  //   INNER-PROP-NAME = METHOD
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  // }
  export type ModelTemplate = {
    kind: "modelTemplate";
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
  // CONTENT otherwise FALLBACK
  export type Field = {
    kind: "field";
    content: Atom | View | Model | RawValue | Reference | Implication | Expression | Expectation | Procedure;
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
  //   OUTER-PROP-NAME: OUTER-PROP-VALUE
  // }
  // view {
  //   OUTER-PROP-NAME: OUTER-PROP-VALUE
  // }
  export type View = {
    kind: "view";
    viewTemplate: string | ViewTemplate;
    outerProps: Record<string, Field | Action>;
  };

  // MODEL-NAME {
  //   OUTER-PROP-NAME: OUTER-PROP-VALUE
  // }
  // model {
  //   OUTER-PROP-NAME: OUTER-PROP-VALUE
  // }
  export type Model = {
    kind: "model";
    modelTemplate: string | ModelTemplate;
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

  // TODO Consider removing this in favor of `then` and `else` methods:
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
  // do { STEPS } otherwise FALLBACK
  // emitter { STEPS }
  export type Procedure = {
    kind: "procedure";
    steps: Array<Procedure | Call | Decision | Declaration | Field>;
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

  // await VALUE
  // let KEY = VALUE
  export type Declaration = {
    kind: "declaration";
    key?: string;
    value: Field;
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
