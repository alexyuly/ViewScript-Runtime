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
