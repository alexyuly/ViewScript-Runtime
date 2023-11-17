import * as Abstract from ".";

function isNode(value: unknown): value is { kind: string } {
  const result = typeof value === "object" && value !== null && "kind" in value;
  return result;
}

export function isAction(value: unknown): value is Abstract.Action {
  const result = isNode(value) && value.kind === "action";
  return result;
}

export function isField(value: unknown): value is Abstract.Field {
  const result = isNode(value) && value.kind === "field";
  return result;
}

export function isMethod(value: unknown): value is Abstract.Method {
  const result = isNode(value) && value.kind === "method";
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

export function isStructure(value: unknown): value is Abstract.Structure {
  const result = isNode(value) && value.kind === "structure";
  return result;
}
