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
    properties: Record<string, Field | Action>;
  };

  /**
   * Represents an instance of a view.
   */
  export type Landscape = {
    kind: "landscape";
    viewName: string;
    properties: Record<string, Field | Action>;
  };

  /* Tier III */

  /**
   * Publishes content from a single store, directly or indirectly.
   */
  export type Field<T extends string = string> = {
    kind: "field";
    publisher: Parameter<T> | Store<T> | Switch<T> | FieldCall<T> | MethodCall<T>;
  };

  /**
   * Publishes content from a new field to each subscriber.
   */
  export type Method = {
    kind: "method";
    parameter?: Parameter & { name: string };
    result: Field;
  };

  /**
   * Subscribes to events and handles them.
   */
  export type Action = {
    kind: "action";
    parameter?: Parameter & { name: string };
    steps: Array<ActionCall | StreamCall | Exception>;
  };

  /**
   * Subscribes to events and forwards them.
   */
  export type Stream = {
    kind: "stream";
    parameter?: Parameter;
  };

  /* Tier IV */

  /**
   * Represents a placeholder for a value.
   */
  export type Parameter<T extends string = string> = {
    kind: "parameter";
    modelName: T;
  };

  /**
   * Maintains a value while the app is running.
   */
  export type Store<T extends string = string> = {
    kind: "store";
    modelName: T;
    content: Feature | Landscape | Primitive | Structure<T>;
  };

  /**
   * Conditionally selects from two fields.
   */
  export type Switch<T extends string = string> = {
    kind: "switch";
    condition: Field;
    positive: Field<T>;
    negative: Field<T>;
  };

  /**
   * Forwards content from a field.
   */
  export type FieldCall<T extends string = string> = {
    kind: "fieldCall";
    modelName: T;
    scope?: Field;
    name: string;
  };

  /**
   * Forwards content from a method.
   */
  export type MethodCall<T extends string = string> = {
    kind: "methodCall";
    modelName: T;
    scope?: Field;
    name: string;
    argument?: Field;
  };

  /**
   * Forwards events to an action.
   */
  export type ActionCall = {
    kind: "actionCall";
    scope?: Field;
    name: string;
    argument?: Field;
  };

  /**
   * Forwards events to a stream.
   */
  export type StreamCall = {
    kind: "streamCall";
    name: string;
    argument?: Field;
  };

  /**
   * Conditionally performs steps and exits the current action.
   */
  export type Exception = {
    kind: "exception";
    condition: Field;
    steps?: Array<ActionCall | StreamCall | Exception>;
  };

  /* Tier V */

  /**
   * Represents a value that is not associated with a model.
   */
  export type Primitive = {
    kind: "primitive";
    value: unknown;
  };

  /**
   * Represents an instance of a model.
   */
  export type Structure<T extends string = string> = {
    kind: "structure";
    modelName: T;
    properties: Record<string, Field>;
  };
}
