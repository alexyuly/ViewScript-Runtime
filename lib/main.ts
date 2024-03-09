import { Abstract } from "./abstract";

export class App {
  readonly source: Abstract.App;
  private readonly properties: Record<string, Param | Val | Var> = {};

  constructor(source: Abstract.App) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "param") {
        this.properties[property.key] = new Param(property);
      } else if (property.kind === "val") {
        this.properties[property.key] = new Val(property, this.properties);
      } else if (property.kind === "var") {
        this.properties[property.key] = new Var(property, this.properties);
      } else {
        throw new Error(`Property of App has unknown kind "${(property as Abstract.Node).kind}".`);
      }
    }

    if ("main" in this.properties) {
      const main = this.properties["main"];
      main.handleEvent();
    } else {
      throw new Error(`App has no property "main".`);
    }
  }
}

export abstract class Publisher {
  protected readonly listeners: Array<Publisher> = [];
  protected value: unknown;

  protected abstract addEventListener(listener: Publisher): void;
  abstract handleEvent(value?: unknown): void;
}

export class Param extends Publisher {
  readonly source: Abstract.Param;

  constructor(source: Abstract.Param) {
    super();

    this.source = source;
  }

  addEventListener(listener: Publisher) {
    if (this.value !== undefined) {
      listener.handleEvent(this.value);
    } else {
      this.listeners.push(listener);
    }
  }

  handleEvent(value?: unknown) {
    if (this.value === value) {
      return;
    }

    this.value = value;

    let listener: Publisher | undefined;

    while ((listener = this.listeners.shift())) {
      listener.handleEvent(value);
    }
  }
}

export class ParamInView extends Publisher {
  readonly source: Abstract.Param;

  constructor(source: Abstract.Param) {
    super();

    this.source = source;
  }

  addEventListener(listener: Publisher) {
    if (this.value !== undefined) {
      listener.handleEvent(this.value);
    }

    this.listeners.push(listener);
  }

  handleEvent(value?: unknown) {
    if (this.value === value) {
      return;
    }

    this.value = value;

    for (const listener of this.listeners) {
      listener.handleEvent(value);
    }
  }
}
