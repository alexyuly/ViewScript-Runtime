export namespace Abstract {
  export type Action = {
    kind: "action";
    target: Procedure | Call | Exception;
  };

  export type Application = {
    kind: "application";
    props: Record<string, Action | Field | Method | Model | Task | View>;
    stage: Array<Task | View | AtomicElement>;
  };

  export type AtomicElement = {
    kind: "atomicElement";
    tagName: string;
    props: Record<string, Action | Field>;
  };

  export type Call = {
    kind: "call";
    context?: Field;
    actionName: string;
    argument?: Field;
  };

  export type Exception = {
    kind: "exception";
    condition: Field;
    steps?: Array<Action>;
  };

  export type Field = {
    kind: "field";
    content: Store | Result | Reference | Implication;
  };

  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    fallback?: Field;
  };

  export type Method = {
    kind: "method";
    result: Field;
    parameterName?: string;
  };

  export type Model = {
    kind: "model";
    props: Record<string, Action | Field | Method>;
  };

  export type ModelInstance = {
    kind: "modelInstance";
    modelName: string;
    props: Record<string, Field>;
  };

  export type Procedure = {
    kind: "procedure";
    steps: Array<Action>;
    parameterName?: string;
  };

  export type RawValue = {
    kind: "rawValue";
    value: unknown;
  };

  export type Reference = {
    kind: "reference";
    context?: Field;
    fieldName: string;
  };

  export type Result = {
    kind: "result";
    context?: Field;
    methodName: string;
    argument?: Field;
  };

  export type Store = {
    kind: "store";
    initialValue: Model | RawValue;
  };

  export type Task = {
    kind: "task";
    props: Record<string, Action | Field | Method>;
    stage: Array<Task>;
  };

  export type TaskInstance = {
    kind: "taskInstance";
    taskName: string;
    props: Record<string, Action | Field>;
  };

  export type View = {
    kind: "view";
    props: Record<string, Action | Field | Method>;
    stage: Array<Task | View | AtomicElement>;
  };

  export type ViewInstance = {
    kind: "viewInstance";
    viewName: string;
    props: Record<string, Action | Field>;
  };
}
