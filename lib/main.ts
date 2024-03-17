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
  execute(): Promise<void>;
  getPropertyValue(name: string): Field;
  setProperty(name: string, field: Field): void;
}

interface Property {
  execute(): Promise<Field>;
  getName(): string;
  getValue(): Field;
}

class CoreEntity extends Publisher implements Entity {
  private readonly value: any;

  constructor(value: unknown) {
    super();

    this.value = value;
  }

  async execute(): Promise<void> {
    this.publish(this.value);
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

class TreeEntity extends Publisher implements Entity {
  private readonly context?: Entity;
  private readonly properties: Record<string, Property> = {};

  constructor(context?: Entity) {
    super();

    this.context = context;
  }

  defineProperty(name: string, property: Property): void {
    this.properties[name] = property;
  }

  async execute(): Promise<void> {
    const properties = Object.values(this.properties);

    const fields = await Promise.all(
      properties.map(async (property) => {
        const field = await property.execute();
        field.execute();
        return field;
      }),
    );

    const serializedValue: Record<string, unknown> = {};

    for (let i = 0; i < fields.length; i++) {
      const name = properties[i].getName();
      const value = fields[i].getPublishedValue();
      serializedValue[name] = value;
    }

    this.publish(serializedValue);
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
  readonly source: Abstract.App;
  private readonly innerScope: TreeEntity = new TreeEntity(new CoreEntity(window));

  constructor(source: Abstract.App, environment: Record<string, string> = {}) {
    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "prop") {
        const propertyValue = Field.fromRawValue(environment[property.parameter.name]);
        const prop = new Prop(property, propertyValue);
        this.innerScope.defineProperty(property.parameter.name, prop);
      } else if (property.kind === "constant") {
        const constant = new Constant(property, this.innerScope);
        this.innerScope.defineProperty(property.parameter.name, constant);
      } else if (property.kind === "variable") {
        const variable = new Variable(property, this.innerScope);
        this.innerScope.defineProperty(property.parameter.name, variable);
      } else {
        throw new Error(); // TODO: Add error message.
      }
    }

    // TODO: Call the main action.
  }
}

class Prop extends Vertex implements Property {
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

  getName(): string {
    return this.parameter.source.name;
  }

  getValue(): Field {
    return this.field;
  }
}

class Constant extends Vertex implements Property {
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

  getName(): string {
    return this.parameter.source.name;
  }

  getValue(): Field {
    return this.field;
  }
}

class Variable extends Vertex implements Property {
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

  getName(): string {
    return this.parameter.source.name;
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

class Field extends Vertex implements Entity {
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

  async execute(): Promise<void> {
    await this.binding.execute();
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

class Ref extends Vertex implements Entity {
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

  async execute(): Promise<void> {
    return this.field.execute();
  }

  getPropertyValue(name: string): Field {
    return this.field.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.field.setProperty(name, field);
  }
}

class Call extends Vertex implements Entity {
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
      const argField = new Field(arg, scope);
      argField.addEventListener({ handleEvent: this.execute.bind(this) }, true);
      return argField;
    });
  }

  async execute(): Promise<void> {
    const callee = this.ref.getPublishedValue();

    if (!(typeof callee === "function")) {
      throw new Error(); // TODO: Add error message.
    }

    await Promise.all(this.args.map((arg) => arg.execute()));

    const result = callee(...this.args);

    if (!(result instanceof Field)) {
      throw new Error(); // TODO: Add error message.
    }

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

class Quest extends Vertex implements Entity {
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

class Raw extends Vertex implements Entity {
  readonly source: Abstract.Raw;
  private readonly innerScope: CoreEntity;

  constructor(source: Abstract.Raw) {
    super();

    this.source = source;
    this.innerScope = new CoreEntity(source.value);
  }

  async execute(): Promise<void> {
    this.innerScope.addEventListener(this);
  }

  getPropertyValue(name: string): Field {
    return this.innerScope.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.innerScope.setProperty(name, field);
  }
}

class List extends Vertex implements Entity {
  readonly source: Abstract.List;
  private readonly args: Array<Field>;
  private result: Field = Field.fromRawValue(undefined);

  constructor(source: Abstract.List, scope: TreeEntity) {
    super();

    this.source = source;

    this.args = source.args.map((arg) => {
      const field = new Field(arg, scope);
      return field;
    });
  }

  async execute(): Promise<void> {
    await Promise.all(this.args.map((arg) => arg.execute()));

    const argPublishedValues = this.args.map((arg) => arg.getPublishedValue());
    const result = Field.fromRawValue(argPublishedValues);

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

class Struct extends Vertex implements Entity {
  readonly source: Abstract.Struct;
  private readonly innerScope: TreeEntity;

  constructor(source: Abstract.Struct, scope: TreeEntity) {
    super();

    this.source = source;
    this.innerScope = new TreeEntity();

    for (const attribute of source.attributes) {
      const field = new Field(attribute.field, scope);
      const prop = new Prop({ kind: "prop", parameter: { kind: "parameter", name: attribute.name } }, field);
      this.innerScope.defineProperty(attribute.name, prop);
    }

    this.innerScope.addEventListener(this);
  }

  async execute(): Promise<void> {
    await this.innerScope.execute();
  }

  getPropertyValue(name: string): Field {
    return this.innerScope.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.innerScope.setProperty(name, field);
  }
}

// TODO: Implement the remaining classes.
