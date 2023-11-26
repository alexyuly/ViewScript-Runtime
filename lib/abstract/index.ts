export namespace Abstract {
  export type App = {
    kind: "app";
    version: "ViewScript v0.4.0";
    domain: Record<string, View | Model>;
    render: Feature | Landscape;
  };

  export type View = {
    kind: "view";
    scope: Record<string, Stream | Field>;
    render: Feature | Landscape;
  };

  export type Model = {
    kind: "model";
    scope: Record<string, Field | Method | Action>;
  };

  export type Feature = {
    kind: "feature";
    tagName: string;
    properties: Record<string, Field | FieldCall | MethodCall | Switch | Action | ActionCall | StreamCall>;
  };

  export type Landscape = {
    kind: "landscape";
    viewName: string;
    properties: Record<string, Field | FieldCall | MethodCall | Switch | Action | ActionCall | StreamCall>;
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
    context?: Field | FieldCall | MethodCall;
    name: string;
  };

  export type Method = {
    kind: "method";
    result: Field | MethodCall;
    parameter?: string;
  };

  export type MethodCall = {
    kind: "methodCall";
    context?: Field | FieldCall | MethodCall;
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
    steps: Array<ActionCall | StreamCall | Exception>;
    parameter?: string;
  };

  export type ActionCall = {
    kind: "actionCall";
    address: Array<string>;
    argument?: Field | FieldCall | MethodCall | Switch;
  };

  export type Stream = {
    kind: "stream";
  };

  export type StreamCall = {
    kind: "streamCall";
    name: string;
    argument?: Field | FieldCall | MethodCall | Switch;
  };

  export type Exception = {
    kind: "exception";
    condition: Field | FieldCall | MethodCall;
    steps?: Array<ActionCall | StreamCall | Exception>;
  };
}
