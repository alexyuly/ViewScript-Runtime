import * as Abstract from "./abstract";

export function isField(value: unknown): value is Abstract.Field {
  const result =
    typeof value === "object" && value !== null && "kind" in value && value.kind === "field";
  return result;
}

export function isModel(value: unknown): value is Abstract.Model {
  const result =
    typeof value === "object" && value !== null && "kind" in value && value.kind === "model";
  return result;
}

export function isParameter(value: unknown): value is Abstract.Parameter {
  const result =
    typeof value === "object" && value !== null && "kind" in value && value.kind === "parameter";
  return result;
}

export function isRenderable(value: unknown): value is Abstract.Renderable {
  const result =
    typeof value === "object" && value !== null && "kind" in value && value.kind === "renderable";
  return result;
}

export function isStructure(value: unknown): value is Abstract.Structure {
  const result =
    typeof value === "object" && value !== null && "kind" in value && value.kind === "structure";
  return result;
}
