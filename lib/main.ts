import { Abstract } from "./abstract";

export class App {
  readonly source: Abstract.App;
  private readonly properties: Record<string, Param | Fun | Val | Var | View> = {};

  constructor(source: Abstract.App) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "param") {
        this.properties[property.key] = new Param(property);
      } else if (property.kind === "fun") {
        this.properties[property.key] = new Fun(property, this.properties);
      } else if (property.kind === "val") {
        this.properties[property.key] = new Val(property);
      } else if (property.kind === "var") {
        this.properties[property.key] = new Var(property);
      } else if (property.kind === "view") {
        this.properties[property.key] = new View(property);
      } else {
        throw new Error(`Property of App has unknown kind "${(property as Abstract.Node).kind}".`);
      }
    }

    const main = this.properties["main"];

    if (!(main instanceof Fun)) {
      throw new Error(`Property "main" of App is not a fun.`);
    }

    main.handleEvent();
  }
}

export class Param {
  readonly source: Abstract.Param;

  constructor(source: Abstract.Param) {
    this.source = source;
  }
}

export class Fun {
  readonly source: Abstract.Fun;
  private readonly properties: Record<string, Param | Fun | Val | Var | View>;
  private readonly binding: Action;

  constructor(source: Abstract.Fun, properties: Record<string, Param | Fun | Val | Var | View>) {
    this.source = source;
    this.properties = properties;
    this.binding = new Action(source.binding, properties);
  }

  handleEvent(...args: Array<Field | Action>) {
    this.binding.handleEvent(...args);
  }
}
