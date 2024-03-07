import { Abstract } from "./abstract";

export class App {
  readonly source: Abstract.App;
  private readonly properties: Record<string, Param | Fun | Val | Var | View> = {};

  constructor(source: Abstract.App) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "param") {
        this.properties[property.key] = new Param(property, this.properties);
      } else if (property.kind === "fun") {
        this.properties[property.key] = new Fun(property, this.properties);
      } else if (property.kind === "val") {
        this.properties[property.key] = new Val(property, this.properties);
      } else if (property.kind === "var") {
        this.properties[property.key] = new Var(property, this.properties);
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
  protected subscribers: Array<Ref> = [];
  protected value: unknown;
  private readonly properties: App["properties"];
  private binding?: Field;

  constructor(source: Abstract.Param, properties: App["properties"]) {
    this.source = source;
    this.properties = properties;
  }

  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    } else {
      this.subscribers.push(subscriber);
    }
  }

  handleEvent(value: unknown) {
    this.value = value;

    while (this.subscribers.length > 0) {
      const subscriber = this.subscribers.shift()!;
      subscriber.handleEvent(value);
    }
  }

  setBinding(binding: Field) {
    if (this.binding !== undefined) {
      throw new Error(`Param "${this.source.key}" already has a binding.`);
    }
    this.binding = binding;
    this.binding.setSubscriber(this);
  }
}

export class ParamSequence extends Param {
  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    this.subscribers.push(subscriber);
  }

  handleEvent(value: unknown) {
    this.value = value;

    for (const subscriber of this.subscribers) {
      subscriber.handleEvent(value);
    }
  }
}

export class Fun {
  readonly source: Abstract.Fun;
  private readonly properties: App["properties"];
  private readonly binding: Action;

  constructor(source: Abstract.Fun, properties: App["properties"]) {
    this.source = source;
    this.properties = properties;

    this.binding = new Action(source.binding, properties);
  }

  handleEvent(...args: Array<Field | Action>) {
    this.binding.handleEvent(...args);
  }
}

export class Val {
  readonly source: Abstract.Val;
  protected subscribers: Array<Ref> = [];
  protected value: unknown;
  private readonly properties: App["properties"];
  private readonly binding: Field;

  constructor(source: Abstract.Val, properties: App["properties"]) {
    this.source = source;
    this.properties = properties;

    this.binding = new Field(source.binding, properties);
    this.binding.addSubscriber(this);
  }

  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    } else {
      this.subscribers.push(subscriber);
    }
  }

  handleEvent(value: unknown) {
    this.value = value;

    while (this.subscribers.length > 0) {
      const subscriber = this.subscribers.shift()!;
      subscriber.handleEvent(value);
    }
  }
}

export class ValSequence extends Val {
  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    this.subscribers.push(subscriber);
  }

  handleEvent(value: unknown) {
    this.value = value;

    for (const subscriber of this.subscribers) {
      subscriber.handleEvent(value);
    }
  }
}

export class Var {
  readonly source: Abstract.Var;
  protected subscribers: Array<Ref> = [];
  protected value: unknown;
  private readonly properties: App["properties"];
  private binding: Field;

  constructor(source: Abstract.Var, properties: App["properties"]) {
    this.source = source;
    this.properties = properties;

    this.binding = new Field(source.binding, properties);
  }

  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    } else {
      this.subscribers.push(subscriber);
    }
  }

  handleEvent(value: unknown) {
    this.value = value;

    while (this.subscribers.length > 0) {
      const subscriber = this.subscribers.shift()!;
      subscriber.handleEvent(value);
    }
  }

  setBinding(binding: Field) {
    this.binding.removeSubscriber();
    this.binding = binding;
    this.binding.setSubscriber(this);
  }
}

export class VarSequence extends Var {
  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    this.subscribers.push(subscriber);
  }

  handleEvent(value: unknown) {
    this.value = value;

    for (const subscriber of this.subscribers) {
      subscriber.handleEvent(value);
    }
  }
}

export class View {
  readonly source: Abstract.View;

  constructor(source: Abstract.View) {
    this.source = source;
  }
}

export class Field {
  readonly source: Abstract.Field;
  protected subscriber?: Param | Val | Var;

  constructor(source: Abstract.Field, properties: App["properties"]) {
    this.source = source;

    if (source.binding.kind === "raw") {
      new Raw(source.binding as Abstract.Raw);
    } else if (source.binding.kind === "ref") {
      new Ref(source.binding as Abstract.Ref, properties);
    } else if (source.binding.kind === "call") {
      new Call(source.binding as Abstract.Call, properties);
    } else if (source.binding.kind === "list") {
      new List(source.binding as Abstract.List, properties);
    } else if (source.binding.kind === "structure") {
      new Structure(source.binding as Abstract.Structure, properties);
    } else if (source.binding.kind === "component") {
      new Component(source.binding as Abstract.Component, properties);
    } else if (source.binding.kind === "quest") {
      new Quest(source.binding as Abstract.Quest, properties);
    } else {
      throw new Error(`Field has unknown binding kind "${(source.binding as Abstract.Node).kind}".`);
    }
  }

  setSubscriber(subscriber: Param | Val | Var) {
    this.subscriber = subscriber;
  }

  removeSubscriber() {
    delete this.subscriber;
  }

  handleEvent(value: unknown) {
    this.subscriber?.handleEvent(value);
  }
}
