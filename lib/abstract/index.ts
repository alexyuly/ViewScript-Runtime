export namespace Abstract {
  export type App = {
    kind: "app";
    version: "ViewScript v0.4.0";
    domain: Record<string, Model | View>;
    render: Feature | Landscape;
  };

  export type Model = {
    kind: "model";
    scope: Record<string, Field | Method | Action>;
  };

  export type View = {
    kind: "view";
    scope: Record<string, Field | Stream>;
    render: Feature | Landscape;
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

  export type Field = {
    kind: "field";
    publisher: Primitive | Structure | Feature | Landscape;
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
    publisherIfTrue: Field | FieldCall | MethodCall | Switch;
    publisherIfFalse?: Field | FieldCall | MethodCall | Switch;
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
