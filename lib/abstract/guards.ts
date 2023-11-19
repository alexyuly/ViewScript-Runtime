import type { Abstract } from "./";

function isAbstractNode(value: unknown): value is { kind: string } {
  return typeof value === "object" && value != null && "kind" in value;
}

export function isView(value: unknown): value is Abstract.View {
  return isAbstractNode(value) && value.kind === "view";
}

export function isFeature(value: unknown): value is Abstract.Feature {
  return isAbstractNode(value) && value.kind === "feature";
}

export function isLandscape(value: unknown): value is Abstract.Landscape {
  return isAbstractNode(value) && value.kind === "landscape";
}

export function isField(value: unknown): value is Abstract.Field {
  return isAbstractNode(value) && value.kind === "field";
}

export function isMethod(value: unknown): value is Abstract.Method {
  return isAbstractNode(value) && value.kind === "method";
}

export function isAction(value: unknown): value is Abstract.Action {
  return isAbstractNode(value) && value.kind === "action";
}

export function isStream(value: unknown): value is Abstract.Stream {
  return isAbstractNode(value) && value.kind === "stream";
}

export function isParameter(value: unknown): value is Abstract.Parameter {
  return isAbstractNode(value) && value.kind === "parameter";
}

export function isStore(value: unknown): value is Abstract.Store {
  return isAbstractNode(value) && value.kind === "store";
}

export function isSwitch(value: unknown): value is Abstract.Switch {
  return isAbstractNode(value) && value.kind === "switch";
}

export function isFieldCall(value: unknown): value is Abstract.FieldCall {
  return isAbstractNode(value) && value.kind === "fieldCall";
}

export function isMethodCall(value: unknown): value is Abstract.MethodCall {
  return isAbstractNode(value) && value.kind === "methodCall";
}

export function isPart(value: unknown): value is Abstract.Part {
  return isAbstractNode(value) && value.kind === "part";
}

export function isStructure(value: unknown): value is Abstract.Structure {
  return isAbstractNode(value) && value.kind === "structure";
}
