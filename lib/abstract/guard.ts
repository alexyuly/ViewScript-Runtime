import type { Abstract } from ".";

export namespace Guard {
  function isAbstractNode(value: unknown): value is { kind: string } {
    return typeof value === "object" && value != null && "kind" in value;
  }

  export function isModel(value: unknown): value is Abstract.Model {
    return isAbstractNode(value) && value.kind === "model";
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

  export function isPrimitive(value: unknown): value is Abstract.Primitive {
    return isAbstractNode(value) && value.kind === "primitive";
  }

  export function isStructure(value: unknown): value is Abstract.Structure {
    return isAbstractNode(value) && value.kind === "structure";
  }

  export function isFieldAlias(value: unknown): value is Abstract.FieldAlias {
    return isAbstractNode(value) && value.kind === "fieldAlias";
  }

  export function isActionAlias(value: unknown): value is Abstract.ActionAlias {
    return isAbstractNode(value) && value.kind === "actionAlias";
  }

  export function isFieldCall(value: unknown): value is Abstract.FieldCall {
    return isAbstractNode(value) && value.kind === "fieldCall";
  }

  export function isMethodCall(value: unknown): value is Abstract.MethodCall {
    return isAbstractNode(value) && value.kind === "methodCall";
  }

  export function isActionCall(value: unknown): value is Abstract.ActionCall {
    return isAbstractNode(value) && value.kind === "actionCall";
  }

  export function isStreamCall(value: unknown): value is Abstract.StreamCall {
    return isAbstractNode(value) && value.kind === "streamCall";
  }

  export function isSwitch(value: unknown): value is Abstract.Switch {
    return isAbstractNode(value) && value.kind === "switch";
  }

  export function isException(value: unknown): value is Abstract.Exception {
    return isAbstractNode(value) && value.kind === "exception";
  }
}
