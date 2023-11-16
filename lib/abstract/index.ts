export * from "./guards";

/* Tier 0 */

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  domain: Record<string, Model | View>;
  renderable: Renderable;
};

/* Tier 1 */

export type Node<Kind extends string = string> = {
  kind: Kind;
};

export type Model = Node<"model"> & {
  name: string;
  scope: Record<string, Field | Method | Action>;
};

export type View = Node<"view"> & {
  name: string;
  scope: Record<string, Stream | Field>;
  renderable: Renderable;
};

export type Renderable = Node<"renderable"> & {
  element: Feature | Landscape;
};

/* Tier 2 */

export type Field = Node<"field"> & {
  publisher: Parameter | Store | Switch | Pointer | MethodCall;
};

export type Method = Node<"method"> & {
  parameter?: Parameter & { name: string };
  result: Field;
};

export type Action = Node<"action"> & {
  parameter?: Parameter & { name: string };
  steps: Array<ActionCall | StreamCall | Exception>;
};

export type Stream = Node<"stream"> & {
  modelName?: string;
};

export type Feature = Node<"feature"> & {
  tagName: string;
  properties: Record<string, Field | Action>;
};

export type Landscape<V extends View = View> = Node<"landscape"> & {
  viewName: V["name"];
  properties: Record<string, Field | Action>;
};

/* Tiers 3 and greater */

export type Parameter = Node<"parameter"> & {
  modelName: string;
};

export type Store = Node<"store"> & {
  value: Value;
};

export type Switch = Node<"switch"> & {
  modelName: string;
  condition: Field;
  positive: Field;
  negative: Field;
};

export type Pointer = Node<"pointer"> & {
  modelName: string;
  base?: MethodCall;
  fieldAddress: Array<string>;
};

export type MethodCall = Node<"methodCall"> & {
  modelName: string;
  base?: MethodCall;
  methodAddress: Array<string>;
  argument?: Field;
};

export type ActionCall = Node<"actionCall"> & {
  actionAddress: Array<string>;
  argument?: Field;
};

export type StreamCall = Node<"streamCall"> & {
  modelName?: string;
  streamName: string;
  output?: Field;
};

export type Exception = Node<"exception"> & {
  condition: Field;
  steps?: Array<ActionCall | StreamCall | Exception>;
};

export type Value = Node<"value"> & {
  element: Part | Renderable | Structure;
};

export type Part = Node<"part"> & {
  data: unknown;
};

export type Structure = Node<"structure"> & {
  modelName: string;
  properties: Record<string, Field>;
};
