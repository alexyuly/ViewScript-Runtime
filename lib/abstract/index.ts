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
  scope: Record<string, Field | Method | Action>;
};

export type View = Node<"view"> & {
  scope: Record<string, Field | Stream>;
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

export type Landscape = Node<"landscape"> & {
  viewName: string;
  properties: Record<string, Field | Action>;
};

/* Tier 3 */

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
  address: Array<string>;
};

export type MethodCall = Node<"methodCall"> & {
  modelName: string;
  base?: MethodCall;
  address: Array<string>;
  argument?: Field;
};

export type ActionCall = Node<"actionCall"> & {
  address: Array<string>;
  argument?: Field;
};

export type StreamCall = Node<"streamCall"> & {
  modelName?: string;
  name: string;
  output?: Field;
};

export type Exception = Node<"exception"> & {
  condition: Field;
  steps?: Array<ActionCall | StreamCall | Exception>;
};

/* Tiers 4 and greater */

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
