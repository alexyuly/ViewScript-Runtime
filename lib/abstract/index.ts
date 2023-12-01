export namespace Abstract {
  export type App = {
    kind: "app";
    version: "ViewScript v0.4.0";
    domain: Record<string, View | Model>;
    render: Feature | Landscape;
  };

  export type View = {
    kind: "view";
    scope: Record<string, Field | FieldCall | MethodCall | Switch>;
    render: Feature | Landscape;
  };

  export type Model = {
    kind: "model";
    scope: Record<string, Field | FieldCall | MethodCall | Switch | Method | Action>;
  };

  export type Feature = {
    kind: "feature";
    tagName: string;
    properties: Record<string, Field | FieldCall | MethodCall | Switch | Action | ActionCall | Output>;
  };

  export type Landscape = {
    kind: "landscape";
    viewName: string;
    properties: Record<string, Field | FieldCall | MethodCall | Switch | Action | ActionCall | Output>;
  };

  export type Primitive = {
    kind: "primitive";
    value: unknown;
  };

  export type Structure = {
    kind: "structure";
    modelName: string;
    properties: Record<string, Field | FieldCall | MethodCall | Switch>;
  };

  export type Field = {
    kind: "field";
    delegate: Feature | Landscape | Primitive | Structure;
  };

  export type FieldCall = {
    kind: "fieldCall";
    context?: Field | FieldCall | MethodCall | Switch;
    name: string;
  };

  export type Method = {
    kind: "method";
    result: Field | FieldCall | MethodCall | Switch;
    parameter?: string;
  };

  export type MethodCall = {
    kind: "methodCall";
    context?: Field | FieldCall | MethodCall | Switch;
    name: string;
    argument?: Field | FieldCall | MethodCall | Switch;
  };

  export type Switch = {
    kind: "switch";
    condition: Field | FieldCall | MethodCall;
    publisher: Field | FieldCall | MethodCall | Switch;
    alternative?: Field | FieldCall | MethodCall | Switch;
  };

  export type Action = {
    kind: "action";
    steps: Array<ActionCall | Output | Exception>;
    parameter?: string;
  };

  export type ActionCall = {
    kind: "actionCall";
    address: Array<string>;
    argument?: Field | FieldCall | MethodCall | Switch;
  };

  export type Output = {
    kind: "output";
    name: string;
    argument?: Field | FieldCall | MethodCall | Switch;
  };

  export type Exception = {
    kind: "exception";
    condition: Field | FieldCall | MethodCall;
    steps?: Array<ActionCall | Output | Exception>;
  };
}
