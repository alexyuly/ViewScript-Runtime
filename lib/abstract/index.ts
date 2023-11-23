export namespace Abstract {
  /* Tier I */

  export type App = {
    kind: "app";
    version: "ViewScript v0.4.0";
    domain: Record<string, Model | View>;
    render: Feature | Landscape;
  };

  /* Tier II */

  /**
   * Represents a data structure and its operations.
   */
  export type Model = {
    kind: "model";
    scope: Record<string, Field | Method | Action>;
  };

  /**
   * Represents a user interface and its interactions.
   */
  export type View = {
    kind: "view";
    scope: Record<string, Field | Stream>;
    render: Feature | Landscape;
  };

  /**
   * Represents an HTML element.
   */
  export type Feature = {
    kind: "feature";
    tagName: string;
    properties: Record<string, Argument | Handler>;
  };

  /**
   * Represents an instance of a view.
   */
  export type Landscape = {
    kind: "landscape";
    viewName: string;
    properties: Record<string, Argument | Handler>;
  };

  /* Tier III */

  export type Field = {
    kind: "field";
    publisher: Feature | Landscape | Primitive | Structure;
  };

  export type Method = {
    kind: "method";
    yield: Field | MethodCall;
    parameter?: string;
  };

  export type Action = {
    kind: "action";
    steps: Array<Handler | Exception>;
    parameter?: string;
  };

  export type Stream = {
    kind: "stream";
  };

  export type Argument = FieldCall | MethodCall | Switch;

  export type Handler = ActionCall | StreamCall;

  /* Tier IV and above */

  // Data

  export type Primitive = {
    kind: "primitive";
    value: unknown;
  };

  export type Structure = {
    kind: "structure";
    modelName: string;
    properties: Record<string, Argument>;
  };

  // Calls

  export type FieldCall = {
    kind: "fieldCall";
    publisher: Field | FieldPointer;
  };

  export type MethodCall = {
    kind: "methodCall";
    publisher: Method | MethodPointer;
  };

  export type ActionCall = {
    kind: "actionCall";
    subscriber: Action | ActionPointer;
  };

  export type StreamCall = {
    kind: "streamCall";
    name: string;
    argument?: Argument;
  };

  // Pointers

  export type FieldPointer = {
    kind: "fieldPointer";
    scope?: FieldCall | MethodCall;
    name: string;
  };

  export type MethodPointer = {
    kind: "methodPointer";
    scope?: FieldCall | MethodCall;
    name: string;
    argument?: Argument;
  };

  export type ActionPointer = {
    kind: "actionPointer";
    address: Array<string>;
    argument?: Argument;
  };

  // Conditionals

  export type Switch = {
    kind: "switch";
    condition: FieldCall | MethodCall;
    publisherIfTrue: Argument;
    publisherIfFalse?: Argument;
  };

  export type Exception = {
    kind: "exception";
    condition: FieldCall | MethodCall;
    steps?: Array<Handler | Exception>;
  };
}
