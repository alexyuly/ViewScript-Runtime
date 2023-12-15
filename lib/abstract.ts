export namespace Abstract {
  export type Action = {
    kind: "action";
    target: Procedure | Exception | Call;
  };

  export type Application = {
    kind: "application";
    props: Record<string, Action | Field | Method | Model | Task | View>;
    stage: Array<TaskInstance | ViewInstance | Atom>;
  };

  export type Atom = {
    kind: "atom";
    tagName: string;
    props: Record<string, Action | Field>;
  };

  export type Call = {
    kind: "call";
    context?: Field;
    actionName: string;
    argument?: Field;
  };

  export type Data = {
    kind: "data";
    value: unknown;
  };

  export type Exception = {
    kind: "exception";
    condition: Field;
    steps?: Array<Action>;
  };

  export type Field = {
    kind: "field";
    content: Store | Invocation | Implication | Reference;
  };

  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    fallback?: Field;
  };

  export type Invocation = {
    kind: "invocation";
    context?: Field;
    methodName: string;
    argument?: Field;
  };

  export type Method = {
    kind: "method";
    invocationResult: Field;
    parameterName?: string;
  };

  export type Model = {
    kind: "model";
    props: Record<string, Action | Field | Method>;
  };

  export type ModelInstance = {
    kind: "modelInstance";
    model: string | Model;
    props: Record<string, Field>;
  };

  export type Procedure = {
    kind: "procedure";
    steps: Array<Action>;
    parameterName?: string;
  };

  export type Reference = {
    kind: "reference";
    context?: Field;
    fieldName: string;
  };

  export type Store = {
    kind: "store";
    initialValue: ModelInstance | Data;
  };

  export type Task = {
    kind: "task";
    props: Record<string, Action | Field | Method>;
    stage: Array<TaskInstance>;
  };

  export type TaskInstance = {
    kind: "taskInstance";
    task: string | Task;
    props: Record<string, Action | Field>;
  };

  export type View = {
    kind: "view";
    props: Record<string, Action | Field | Method>;
    stage: Array<TaskInstance | ViewInstance | Atom>;
  };

  export type ViewInstance = {
    kind: "viewInstance";
    view: string | View;
    props: Record<string, Action | Field>;
  };
}
