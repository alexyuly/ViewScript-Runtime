import * as Abstract from "./abstract";

function isNode(value: unknown): value is Abstract.Node {
  const result = isNode(value);
  return result;
}

export function isField(value: unknown): value is Abstract.Field {
  const result = isNode(value) && value.kind === "field";
  return result;
}

export function isModel(value: unknown): value is Abstract.Model {
  const result = isNode(value) && value.kind === "model";
  return result;
}

export function isParameter(value: unknown): value is Abstract.Parameter {
  const result = isNode(value) && value.kind === "parameter";
  return result;
}

export function isRenderable(value: unknown): value is Abstract.Renderable {
  const result = isNode(value) && value.kind === "renderable";
  return result;
}

export function isStructure(value: unknown): value is Abstract.Structure {
  const result = isNode(value) && value.kind === "structure";
  return result;
}
