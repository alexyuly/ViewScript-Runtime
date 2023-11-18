import type { Abstract } from "./";

export function isFeature(value: unknown): value is Abstract.Feature {
  return typeof value === "object" && value != null && "kind" in value && value.kind === "feature";
}

export function isLandscape(value: unknown): value is Abstract.Landscape {
  return (
    typeof value === "object" && value != null && "kind" in value && value.kind === "landscape"
  );
}

export function isField(value: unknown): value is Abstract.Field {
  return typeof value === "object" && value != null && "kind" in value && value.kind === "field";
}

export function isMethod(value: unknown): value is Abstract.Method {
  return typeof value === "object" && value != null && "kind" in value && value.kind === "method";
}

export function isAction(value: unknown): value is Abstract.Action {
  return typeof value === "object" && value != null && "kind" in value && value.kind === "action";
}
