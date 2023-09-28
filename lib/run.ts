import type { App as CompiledApp } from "./compiled";
import { App } from "./classes";

export function run(app: CompiledApp) {
  new App(app);
}
