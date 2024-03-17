import { Abstract } from "./abstract";

interface Subscriber<Incoming = unknown, Outgoing = unknown> {
  handleEvent(event: Incoming): Outgoing;
}

abstract class Publisher<Outgoing = unknown> {
  private readonly listeners: Array<Subscriber<Outgoing>> = [];
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
        const argPublishedValues = args.map((arg) => arg.getPublishedValue());
        const callablePropertyReturnValue = callablePropertyValue(...argPublishedValues);
        const field = Field.fromRawValue(callablePropertyReturnValue);
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
  private readonly properties: Record<string, Property> = {};

  constructor(context?: Entity) {
    this.context = context;
  }

  defineProperty(name: string, property: Property): void {
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

interface Property {
  getValue(): Field;
}

interface Statement {
  execute(): Promise<unknown>;
}

export class App {
  readonly source: Abstract.App;
  private readonly scope = new TreeEntity(new CoreEntity(window));

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

  async execute(): Promise<Field> {
    return this.field;
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

  async execute(): Promise<Field> {
    return this.field;
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

  async execute(): Promise<Field> {
    return this.field;
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

class Field extends Vertex implements Entity, Statement {
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

  async execute(): Promise<Field> {
    await this.binding.execute();
    return this;
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
  private readonly field: Field;

  constructor(source: Abstract.Ref, scope: TreeEntity) {
    super();

    this.source = source;
    this.scope = source.scope ? new Field(source.scope, scope) : scope;
    this.field = this.scope.getPropertyValue(source.name);
    this.field.addEventListener(this);
  }

  async execute(): Promise<Field> {
    return this.field.execute();
  }

  getPropertyValue(name: string): Field {
    return this.field.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.field.setProperty(name, field);
  }
}

class Call extends Vertex implements Entity, Statement {
  readonly source: Abstract.Call;
  private readonly ref: Ref;
  private readonly args: Array<Field>;
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

  async execute(): Promise<Field> {
    const callee = this.ref.getPublishedValue();

    if (!(typeof callee === "function")) {
      throw new Error(); // TODO: Add error message.
    }

    const result = callee(...this.args);

    if (!(result instanceof Field)) {
      throw new Error(); // TODO: Add error message.
    }

    this.result.removeEventListener(this);
    this.result = result;
    this.result.addEventListener(this);

    return result;
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

  async execute(): Promise<Field> {
    await this.call.execute();

    const callPublishedValue = this.call.getPublishedValue();
    const resolvedValue = await Promise.resolve(callPublishedValue);
    const result = Field.fromRawValue(resolvedValue);

    this.result.removeEventListener(this);
    this.result = result;
    this.result.addEventListener(this);

    return result;
  }

  getPropertyValue(name: string): Field {
    return this.result.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.result.setProperty(name, field);
  }
}

class Raw extends Publisher implements Entity, Statement {
  readonly source: Abstract.Raw;
  private readonly coreEntity: CoreEntity;

  constructor(source: Abstract.Raw) {
    super();

    this.source = source;
    this.coreEntity = new CoreEntity(source.value);
  }

  async execute(): Promise<void> {
    this.publish(this.source.value);
  }

  getPropertyValue(name: string): Field {
    return this.coreEntity.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.coreEntity.setProperty(name, field);
  }
}

class List extends Publisher implements Entity, Statement {
  readonly source: Abstract.List;
  private readonly scope: TreeEntity;
  private readonly args: Array<Field>;
  private result: Field = Field.fromRawValue(undefined);

  constructor(source: Abstract.List, scope: TreeEntity) {
    super();

    this.source = source;
    this.scope = scope;

    this.args = source.args.map((arg) => {
      const field = new Field(arg, scope);
      return field;
    });
  }

  async execute(): Promise<void> {
    const argPublishedValues = this.args.map((arg) => arg.getPublishedValue());
    this.publish(argPublishedValues);
  }

  getPropertyValue(name: string): Field {
    const listScope = Field.fromRawValue(this.getPublishedValue());
    return listScope.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    const listScope = Field.fromRawValue(this.getPublishedValue());
    listScope.setProperty(name, field);
  }
}

// TODO: Implement remaining classes.
