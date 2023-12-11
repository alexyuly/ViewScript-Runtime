import type { Abstract } from ".";

export namespace Guard {
  export function isRawObject(value: unknown): value is object {
    return typeof value === "object" && value !== null && !(value instanceof Array);
  }

  export function isComponent(value: unknown): value is { kind: string } {
    return isRawObject(value) && "kind" in value && typeof value.kind === "string";
  }
}
