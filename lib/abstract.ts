export namespace Abstract {
  /**
   * Foundation:
   */

  export type App = {
    kind: "app";
    innerProps: Record<string, View | Model | Method | Field | Action>;
    stage: Array<Atom | ViewInstance>;
  };

  // view {
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  //   <TAG-NAME> { OUTER-PROPS }
  //   VIEW-NAME { OUTER-PROPS }
  // }
  export type View = {
    kind: "view";
    innerProps: Record<string, Method | Field | Action>;
    stage: Array<Atom | ViewInstance>;
  };

  // model {
  //   INNER-PROP-NAME = FIELD
  //   INNER-PROP-NAME = ACTION
  // }
  export type Model = {
    kind: "model";
    innerProps: Record<string, Method | Field | Action>;
  };

  // make FIELD
  // (PARAMETER-NAME) => FIELD
  // (PARAMETER-NAME: TYPE) => FIELD
  export type Method = {
    kind: "method";
    parameterName?: string;
    result: Field;
  };

  /**
   * Fields:
   */

  export type Field = {
    kind: "field";
    content: Atom | ViewInstance | ModelInstance | RawValue | Reference | Expression | Expectation | Implication;
    otherwise?: Action; // If this field contains an Expectation, then this action is called when the expectation's (expression's method's result's raw value's) promise rejects.
  };

  // <TAG-NAME> { OUTER-PROPS }
  export type Atom = {
    kind: "atom";
    tagName: string;
    outerProps: Record<string, Field | Action>;
  };

  // VIEW-NAME { OUTER-PROPS }
  export type ViewInstance = {
    kind: "viewInstance";
    view: string | View;
    outerProps: Record<string, Field | Action>;
  };

  // object { OUTER-PROPS }
  // MODEL-NAME { OUTER-PROPS }
  export type ModelInstance = {
    kind: "modelInstance";
    model?: string | Model;
    outerProps: Record<string, Field | Action>;
  };

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
    argument?: Field;
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

  // if FIELD then FIELD
  // if FIELD then FIELD else FIELD
  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    alternative?: Field;
  };

  /**
   * Actions:
   */

  export type Action = {
    kind: "action";
    target: Procedure | Call | Invocation | Gate;
  };

  // do { ACTIONS }
  // (PARAMETER-NAME) -> ACTION
  // (PARAMETER-NAME: TYPE) -> ACTION
  // (PARAMETER-NAME) -> { ACTIONS }
  // (PARAMETER-NAME: TYPE) -> { ACTIONS }
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
    argument?: Field;
  };

  // let FIELD-NAME = FIELD
  export type Invocation = {
    kind: "invocation";
    effect: Field;
    reaction?: Action; // In code, this action targets a procedure with all steps that come after the invocation.
  };

  // return if FIELD
  // return if FIELD then ACTION
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
