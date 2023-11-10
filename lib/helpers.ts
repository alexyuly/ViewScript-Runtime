import * as Abstract from "./abstract";

export function getGlobalScope(): Record<string, Abstract.Model> {
  const globalScope = {
    browser: {
      kind: "model",
      name: "Browser",
      members: {
        console: {
          kind: "model",
          name: "Console",
          members: {
            log: window.console.log,
          },
        },
      },
    },
  } as const;

  return globalScope;
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
