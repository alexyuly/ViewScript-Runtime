import * as Abstract from "./abstract";

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
