import { Abstract } from "./abstract";

export class App {
  readonly source: Abstract.App;
  private readonly properties: Record<string, Param | Val | Var> = {};

  constructor(source: Abstract.App) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "param") {
        this.properties[property.key] = new Param(property, this.properties);
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

  handleEvent(value?: unknown) {
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

  handleEvent(value?: unknown) {
    this.value = value;

    for (const subscriber of this.subscribers) {
      subscriber.handleEvent(value);
    }
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
    this.binding.setSubscriber(this);
  }

  addSubscriber(subscriber: Ref) {
    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    } else {
      this.subscribers.push(subscriber);
    }
  }

  handleEvent(value?: unknown) {
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

  handleEvent(value?: unknown) {
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

  handleEvent(value?: unknown) {
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

  handleEvent(value?: unknown) {
    this.value = value;

    for (const subscriber of this.subscribers) {
      subscriber.handleEvent(value);
    }
  }
}

export class Field {
  readonly source: Abstract.Field;
  protected subscriber?: { handleEvent(value: unknown): void };
  private binding: Raw | Ref | Call | Quest | List | Structure | Component | Action | View;

  constructor(source: Abstract.Field, properties: App["properties"]) {
    this.source = source;

    if (source.binding.kind === "raw") {
      this.binding = new Raw(source.binding as Abstract.Raw);
    } else if (source.binding.kind === "ref") {
      this.binding = new Ref(source.binding as Abstract.Ref, properties);
    } else if (source.binding.kind === "call") {
      this.binding = new Call(source.binding as Abstract.Call, properties);
    } else if (source.binding.kind === "quest") {
      this.binding = new Quest(source.binding as Abstract.Quest, properties);
    } else if (source.binding.kind === "list") {
      this.binding = new List(source.binding as Abstract.List, properties);
    } else if (source.binding.kind === "structure") {
      this.binding = new Structure(source.binding as Abstract.Structure, properties);
    } else if (source.binding.kind === "component") {
      this.binding = new Component(source.binding as Abstract.Component, properties);
    } else {
      throw new Error(`Field has unknown binding kind "${(source.binding as Abstract.Node).kind}".`);
    }
  }

  setSubscriber(subscriber: { handleEvent(value: unknown): void }) {
    this.subscriber = subscriber;
  }

  removeSubscriber() {
    delete this.subscriber;
  }

  handleEvent(value: unknown) {
    this.subscriber?.handleEvent(value);
  }
}

export class Raw {
  readonly source: Abstract.Raw;

  constructor(source: Abstract.Raw) {
    this.source = source;
  }
}
