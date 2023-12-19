export namespace Abstract {
  // Root:

  export type App = {
    kind: "app";
    innerProps: Record<string, View | Task | Model | Method | Field | Action>;
    stage: Array<Atom | ViewInstance | TaskInstance>;
  };

  // Properties:

  export type View = {
    kind: "view";
    innerProps: Record<string, Method | Field | Action>;
    stage: Array<TaskInstance | ViewInstance | Atom>;
  };

  export type Task = {
    kind: "task";
    innerProps: Record<string, Method | Field | Action>;
    stage: Array<TaskInstance>;
  };

  export type Model = {
    kind: "model";
    innerProps: Record<string, Method | Field | Action>;
  };

  export type Method = {
    kind: "method";
    result: Field;
    parameterName?: string;
  };

  export type Field = {
    kind: "field";
    content: Atom | ViewInstance | ModelInstance | RawValue | Invocation | Implication | Reference;
  };

  export type Action = {
    kind: "action";
    target: Procedure | Exception | Call;
  };

  // Stage actors:

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

  export type TaskInstance = {
    kind: "taskInstance";
    task: string | Task;
    outerProps: Record<string, Field | Action>;
  };

  // Field content:

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
    context?: Field;
    methodName: string;
    argument?: Field;
  };

  export type Implication = {
    kind: "implication";
    condition: Field;
    consequence: Field;
    alternative?: Field;
  };

  export type Reference = {
    kind: "reference";
    context?: Field;
    fieldName: string;
  };

  // Action targets:

  export type Procedure = {
    kind: "procedure";
    steps: Array<Action>;
    parameterName?: string;
  };

  export type Exception = {
    kind: "exception";
    condition: Field;
    steps?: Array<Action>;
  };

  export type Call = {
    kind: "call";
    context?: Field;
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
