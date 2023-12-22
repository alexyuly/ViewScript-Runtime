export namespace Abstract {
  // Root:

  export type App = {
    kind: "app";
    innerProps: Record<string, View | Model | Method | Field | Action>;
    stage: Array<Atom | ViewInstance>;
  };

  // Properties:

  export type View = {
    kind: "view";
    innerProps: Record<string, Field | Action | Method>;
    stage: Array<Atom | ViewInstance>;
  };

  export type Model = {
    kind: "model";
    innerProps: Record<string, Field | Action | Method>;
  };

  export type Method = {
    kind: "method";
    parameterName?: string;
    result: Field;
  };

  export type Field = {
    kind: "field";
    content: Atom | ViewInstance | ModelInstance | RawValue | Invocation | Expectation | Implication | Reference;
    fallback?: Action;
  };

  export type Action = {
    kind: "action";
    target: Procedure | Operation | Exception | Call;
  };

  // Field contents:

  export type Atom = {
    kind: "atom";
    tagName: string;
    outerProps: Record<string, Field | Action>;
  };

  export type ViewInstance = {
    kind: "viewInstance";
    view: string | View;
    outerProps: Record<string, Field | Action>;
  };

  export type ModelInstance = {
    kind: "modelInstance";
    model: string | Model;
    outerProps: Record<string, Field>;
  };

  export type RawValue = {
    kind: "rawValue";
    value: unknown;
  };

  export type Invocation = {
    kind: "invocation";
    scope?: Field;
    methodName: string;
    argument?: Field;
  };

  export type Expectation = {
    kind: "expectation";
    promise: Invocation;
  };

  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    alternative?: Field;
  };

  export type Reference = {
    kind: "reference";
    scope?: Field;
    fieldName: string;
  };

  // Action targets:

  export type Procedure = {
    kind: "procedure";
    parameterName?: string;
    steps: Array<Action>;
  };

  export type Operation = {
    kind: "operation";
    effect: Field;
    reaction?: Action;
  };

  export type Exception = {
    kind: "exception";
    condition: Field;
    response?: Action;
  };

  export type Call = {
    kind: "call";
    scope?: Field;
    actionName: string;
    argument?: Field;
  };

  // Base types:

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
