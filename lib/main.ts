import { Abstract } from "./abstract";

interface Entity {
  getPropertyValue(name: string): Field;
  setProperty(name: string, field: Field): void;
}

class CoreEntity implements Entity {
  private readonly value: any;

  constructor(value: unknown) {
    this.value = value;
  }

  getPropertyValue(name: string): Field {
    if (this.value === null || this.value === undefined) {
      const field = Field.fromRawValue(undefined);
      return field;
    }

    const corePropertyValue = this.value[name];

    if (corePropertyValue === "function") {
      const callablePropertyValue =
        corePropertyValue.prototype?.constructor === corePropertyValue
          ? (...args: Array<unknown>) => new corePropertyValue(...args)
          : corePropertyValue.bind(this.value);

      const treePropertyValue = (...args: Array<Field>) => {
        const result = callablePropertyValue(...args.map((arg) => arg.getPublishedValue()));
        const field = Field.fromRawValue(result);
        return field;
      };

      const field = Field.fromRawValue(treePropertyValue);
      return field;
    }

    const field = Field.fromRawValue(corePropertyValue);
    return field;
  }

  setProperty(name: string, field: Field): void {
    throw new Error("Not implemented"); // TODO: Implement this method.
  }
}

class TreeEntity implements Entity {
  private readonly context?: Entity;
  protected readonly properties: Record<string, Prop | Constant | Variable> = {};

  constructor(context?: Entity) {
    this.context = context;
  }

  defineProperty(name: string, property: Prop | Constant | Variable): void {
    this.properties[name] = property;
  }

  getPropertyValue(name: string): Field {
    const property = this.properties[name];

    if (property) {
      return property.getValue();
    }

    if (this.context) {
      return this.context.getPropertyValue(name);
    }

    throw new Error(); // TODO: Add error message.
  }

  setProperty(name: string, field: Field): void {
    const property = this.properties[name];

    if (property instanceof Variable) {
      property.set(field);
    } else if (this.context) {
      this.context.setProperty(name, field);
    } else {
      throw new Error(); // TODO: Add error message.
    }
  }
}

export class App {
  private readonly scope = new TreeEntity(new CoreEntity(window));
  readonly source: Abstract.App;

  constructor(source: Abstract.App, environment: Record<string, string> = {}) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "prop") {
        const propertyValue = Field.fromRawValue(environment[property.parameter.name]);
        const prop = new Prop(property, propertyValue);
        this.scope.defineProperty(property.parameter.name, prop);
      } else if (property.kind === "constant") {
        const constant = new Constant(property, this.scope);
        this.scope.defineProperty(property.parameter.name, constant);
      } else if (property.kind === "variable") {
        const variable = new Variable(property, this.scope);
        this.scope.defineProperty(property.parameter.name, variable);
      } else {
        throw new Error(); // TODO: Add error message.
      }
    }

    // TODO: Call the main action.
  }
}

interface Subscriber<Incoming = unknown, Outgoing = unknown> {
  handleEvent(event: Incoming): Outgoing;
}

abstract class Publisher<Outgoing = unknown> {
  private readonly listeners: Subscriber<Outgoing>[] = [];
  private publishedValue?: Outgoing;

  addEventListener(listener: Subscriber<Outgoing>, passive = false): void {
    if (this.publishedValue !== undefined && !passive) {
      listener.handleEvent(this.publishedValue);
    }

    this.listeners.push(listener);
  }

  getPublishedValue(): Outgoing | undefined {
    return this.publishedValue;
  }

  protected publish(nextValue: Outgoing): void {
    if (this.publishedValue === nextValue) {
      return;
    }

    this.publishedValue = nextValue;

    for (const listener of this.listeners) {
      listener.handleEvent(nextValue);
    }
  }

  removeEventListener(listener: Subscriber<Outgoing>): void {
    const index = this.listeners.indexOf(listener);

    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
}

abstract class Vertex<Type = unknown> extends Publisher<Type> implements Subscriber<Type> {
  handleEvent(event: Type): void {
    this.publish(event);
  }
}

interface Property {
  getValue(): Field;
}

interface Statement {
  execute(): Promise<void>;
}

class Prop extends Vertex implements Property, Statement {
  readonly source: Abstract.Prop;
  private readonly parameter: Parameter;
  private readonly field: Field;

  constructor(source: Abstract.Prop, field: Field) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.field = field;
    this.field.addEventListener(this);
  }

  execute(): Promise<void> {
    return this.field.execute();
  }

  getValue(): Field {
    return this.field;
  }
}

class Constant extends Vertex implements Property, Statement {
  readonly source: Abstract.Constant;
  private readonly parameter: Parameter;
  private readonly field: Field;

  constructor(source: Abstract.Constant, scope: TreeEntity) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.field = new Field(source.field, scope);
    this.field.addEventListener(this);
  }

  execute(): Promise<void> {
    return this.field.execute();
  }

  getValue(): Field {
    return this.field;
  }
}

class Variable extends Vertex implements Property, Statement {
  readonly source: Abstract.Variable;
  private readonly parameter: Parameter;
  private field: Field;

  constructor(source: Abstract.Variable, scope: TreeEntity) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.field = new Field(source.field, scope);
    this.field.addEventListener(this);
  }

  execute(): Promise<void> {
    return this.field.execute();
  }

  getValue(): Field {
    return this.field;
  }

  set(field: Field): void {
    this.field.removeEventListener(this);
    this.field = field;
    this.field.addEventListener(this);
  }
}

class Parameter {
  readonly source: Abstract.Parameter;

  constructor(source: Abstract.Parameter) {
    this.source = source;
  }
}

class Field extends Publisher implements Entity, Statement {
  readonly source: Abstract.Field;
  private readonly binding: Ref | Call | Quest | Raw | List | Struct | Action | View | Component;

  constructor(source: Abstract.Field, scope: TreeEntity) {
    super();

    this.source = source;

    if (source.binding.kind === "ref") {
      this.binding = new Ref(source.binding, scope);
    } else if (source.binding.kind === "call") {
      this.binding = new Call(source.binding, scope);
    } else if (source.binding.kind === "quest") {
      this.binding = new Quest(source.binding, scope);
    } else if (source.binding.kind === "raw") {
      this.binding = new Raw(source.binding);
    } else if (source.binding.kind === "list") {
      this.binding = new List(source.binding, scope);
    } else if (source.binding.kind === "struct") {
      this.binding = new Struct(source.binding, scope);
    } else if (source.binding.kind === "action") {
      this.binding = new Action(source.binding, scope);
    } else if (source.binding.kind === "view") {
      this.binding = new View(source.binding);
    } else if (source.binding.kind === "component") {
      this.binding = new Component(source.binding, scope);
    } else {
      throw new Error(); // TODO: Add error message.
    }

    this.binding.addEventListener(this);
  }

  execute(): Promise<void> {
    return this.binding.execute();
  }

  static fromRawValue(value: unknown): Field {
    const field = new Field(
      {
        kind: "field",
        binding: { kind: "raw", value },
      },
      new TreeEntity(),
    );

    return field;
  }

  getPropertyValue(name: string): Field {
    return this.binding.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.binding.setProperty(name, field);
  }
}

class Ref extends Vertex implements Entity, Statement {
  readonly source: Abstract.Ref;
  private readonly scope: Entity;
  private readonly ref: Field;

  constructor(source: Abstract.Ref, scope: TreeEntity) {
    super();

    this.source = source;
    this.scope = source.scope ? new Field(source.scope, scope) : scope;
    this.ref = this.scope.getPropertyValue(source.name);
    this.ref.addEventListener(this);
  }

  execute(): Promise<void> {
    return this.ref.execute();
  }

  getPropertyValue(name: string): Field {
    return this.ref.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.ref.setProperty(name, field);
  }
}

class Call extends Vertex implements Entity, Statement {
  readonly source: Abstract.Call;
  private readonly ref: Ref;
  private readonly args: Field[];
  private result: Field = Field.fromRawValue(undefined);

  constructor(source: Abstract.Call, scope: TreeEntity) {
    super();

    this.source = source;
    this.ref = new Ref(source.ref, scope);
    this.ref.addEventListener({ handleEvent: this.execute.bind(this) }, true);

    this.args = source.args.map((arg) => {
      const field = new Field(arg, scope);
      field.addEventListener({ handleEvent: this.execute.bind(this) }, true);
      return field;
    });
  }

  async execute(): Promise<void> {
    const callee = this.ref.getPublishedValue();

    if (typeof callee === "function") {
      const result = callee(...this.args);

      if (result instanceof Field) {
        this.result.removeEventListener(this);
        this.result = result;
        this.result.addEventListener(this);
      } else {
        throw new Error(); // TODO: Add error message.
      }
    } else {
      throw new Error(); // TODO: Add error message.
    }
  }

  getPropertyValue(name: string): Field {
    return this.result.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.result.setProperty(name, field);
  }
}

class Quest extends Vertex implements Entity, Statement {
  readonly source: Abstract.Quest;
  private readonly call: Call;
  private result: Field = Field.fromRawValue(undefined);

  constructor(source: Abstract.Quest, scope: TreeEntity) {
    super();

    this.source = source;
    this.call = new Call(source.call, scope);
  }

  async execute(): Promise<void> {
    await this.call.execute();

    const callPublishedValue = this.call.getPublishedValue();
    const resolvedValue = await Promise.resolve(callPublishedValue);
    const result = Field.fromRawValue(resolvedValue);

    this.result.removeEventListener(this);
    this.result = result;
    this.result.addEventListener(this);
  }

  getPropertyValue(name: string): Field {
    return this.result.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.result.setProperty(name, field);
  }
}

class Raw extends Publisher implements Entity, Statement {
  private readonly scope: CoreEntity;
  readonly source: Abstract.Raw;

  constructor(source: Abstract.Raw) {
    super();

    this.source = source;
    this.scope = new CoreEntity(source.value);
  }

  execute(): Promise<void> {
    return Promise.resolve();
  }

  getPropertyValue(name: string): Field {
    return this.scope.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.scope.setProperty(name, field);
  }
}
