export * from "./guards";

/* Tier I */

export type App = {
  kind: "app";
  version: "ViewScript v0.4.0";
  domain: Record<string, Model | View>;
  render: Feature | Landscape;
};

/* Tier II */

export type Model = {
  kind: "model";
  scope: Record<string, Field | Method | Action>;
};

export type View = {
  kind: "view";
  scope: Record<string, Field | Stream>;
  render: Feature | Landscape;
};

export type Feature = {
  kind: "feature";
  tagName: string;
  properties: Record<string, Field | Action>;
};

export type Landscape = {
  kind: "landscape";
  viewName: string;
  properties: Record<string, Field | Action>;
};

/* Tier III */

export type Field = {
  kind: "field";
  publisher: Parameter | Store | Switch | FieldCall | MethodCall;
};

export type Method = {
  kind: "method";
  parameter?: Parameter & { name: string };
  result: Field;
};

export type Action = {
  kind: "action";
  parameter?: Parameter & { name: string };
  steps: Array<ActionCall | StreamCall | Exception>;
};

export type Stream = {
  kind: "stream";
  parameter?: Parameter;
};

/* Tier IV */

export type Parameter = {
  kind: "parameter";
  modelName: string;
};

export type Store = {
  kind: "store";
  content: Feature | Landscape | Part | Structure;
};

export type Switch = {
  kind: "switch";
  condition: Field;
  positive: Field;
  negative?: Field;
};

export type FieldCall = {
  kind: "fieldCall";
  scope?: Field;
  name: string;
};

export type MethodCall = {
  kind: "methodCall";
  scope?: Field;
  name: string;
  argument?: Field;
};

export type ActionCall = {
  kind: "actionCall";
  scope?: Field;
  name: string;
  argument?: Field;
};

export type StreamCall = {
  kind: "streamCall";
  name: string;
  argument?: Field;
};

export type Exception = {
  kind: "exception";
  condition: Field;
  steps?: Array<ActionCall | StreamCall | Exception>;
};

/* Tier V */

export type Part = {
  kind: "part";
  value: unknown;
};

export type Structure = {
  kind: "structure";
  modelName: string;
  properties: Record<string, Field>;
};
