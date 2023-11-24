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

  /**
   * Stores and publishes values.
   */
  export type Field = {
    kind: "field";
    publisher: Feature | Landscape | Primitive | Structure;
  };

  /**
   * Produces new fields.
   */
  export type Method = {
    kind: "method";
    yield: Field | MethodCall;
    parameter?: string;
  };

  /**
   * Updates fields and performs side effects.
   */
  export type Action = {
    kind: "action";
    steps: Array<ActionCall | StreamCall | Exception>;
    parameter?: string;
  };

  /**
   * Publishes fields.
   */
  export type Stream = {
    kind: "stream";
  };

  /**
   * Represents a publisher of values.
   */
  export type Argument = Field | FieldCall | MethodCall | Switch;

  /**
   * Represents a subscriber of values.
   */
  export type Handler = Action | ActionCall | StreamCall;

  /* Tier IV and above */

  export type Primitive = {
    kind: "primitive";
    value: unknown;
  };

  export type Structure = {
    kind: "structure";
    modelName: string;
    properties: Record<string, Argument>;
  };

  export type FieldCall = {
    kind: "fieldCall";
    scope?: Field | FieldCall | MethodCall;
    name: string;
  };

  export type MethodCall = {
    kind: "methodCall";
    scope?: Field | FieldCall | MethodCall;
    name: string;
    argument?: Argument;
  };

  export type ActionCall = {
    kind: "actionCall";
    address: Array<string>;
    argument?: Argument;
  };

  export type StreamCall = {
    kind: "streamCall";
    name: string;
    argument?: Argument;
  };

  export type Switch = {
    kind: "switch";
    condition: Field | FieldCall | MethodCall;
    publisherIfTrue: Argument;
    publisherIfFalse?: Argument;
  };

  export type Exception = {
    kind: "exception";
    condition: Field | FieldCall | MethodCall;
    steps?: Array<ActionCall | StreamCall | Exception>;
  };
}
