export namespace Abstract {
  export type Data = Field | FieldCall | MethodCall | Switch;
  export type EventListener = Action | ActionCall | Output;
  export type Step = ActionCall | Output | Exception;

  export type App = {
    kind: "app";
    version: "ViewScript v0.4.0";
    domain: Record<string, View | Model>;
    render: Feature | Landscape | View;
  };

  export type View = {
    kind: "view";
    scope: Record<string, Data>;
    render: Feature | Landscape;
  };

  export type Model = {
    kind: "model";
    scope: Record<string, Data | Method | Action>;
  };

  export type Feature = {
    kind: "feature";
    tagName: string;
    properties: Record<string, Data | EventListener>;
  };

  export type Landscape = {
    kind: "landscape";
    viewName: string;
    properties: Record<string, Data | EventListener>;
  };

  export type Primitive = {
    kind: "primitive";
    value: unknown;
  };

  export type Structure = {
    kind: "structure";
    modelName: string;
    properties: Record<string, Data>;
  };

  export type Field = {
    kind: "field";
    delegate: Feature | Landscape | Primitive | Structure;
  };

  export type FieldCall = {
    kind: "fieldCall";
    context?: Data;
    name: string;
  };

  export type Method = {
    kind: "method";
    result: Data;
    parameter?: string;
  };

  export type MethodCall = {
    kind: "methodCall";
    context?: Data;
    name: string;
    argument?: Data;
  };

  export type Switch = {
    kind: "switch";
    condition: Data;
    publisher: Data;
    alternative?: Data;
  };

  export type Action = {
    kind: "action";
    steps: Array<Step>;
    parameter?: string;
  };

  export type ActionCall = {
    kind: "actionCall";
    context?: Data;
    name: string;
    argument?: Data;
  };

  export type Output = {
    kind: "output";
    name: string;
    argument?: Data;
  };

  export type Exception = {
    kind: "exception";
    condition: Data;
    steps?: Array<Step>;
  };
}
