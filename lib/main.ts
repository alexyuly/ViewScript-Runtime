import { Abstract } from "./abstract";

interface Entity {
  getPropertyValue(name: string): Field;
  setProperty(name: string, field: Field): void;
}

class CoreEntity implements Entity {
  private readonly value: any;

  constructor(value: unknown = window) {
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

    const field = new Field(
      {
        kind: "field",
        binding: { kind: "raw", value: corePropertyValue },
      },
      new TreeEntity(),
    );

    return field;
  }

  setProperty(name: string, field: Field): void {
    throw new Error(); // TODO: Add error message.
  }
}

class TreeEntity implements Entity {
  private readonly context?: Entity;
  protected readonly properties: Record<string, Prop | Constant | Variable> = {};

  constructor(context?: Entity) {
    this.context = context;
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

export class App extends TreeEntity {
  readonly source: Abstract.App;

  constructor(source: Abstract.App, environment: Record<string, string> = {}) {
    super(new CoreEntity());

    this.source = source;

    for (const property of source.properties) {
      if (property.kind === "prop") {
        const abstractField: Abstract.Field = {
          kind: "field",
          binding: { kind: "raw", value: environment[property.parameter.name] },
        };
        const propertyValue = new Field(abstractField, this);
        this.properties[property.parameter.name] = new Prop(property, propertyValue);
      } else if (property.kind === "constant") {
        this.properties[property.parameter.name] = new Constant(property, this);
      } else if (property.kind === "variable") {
        this.properties[property.parameter.name] = new Variable(property, this);
      } else {
        throw new Error(); // TODO: Add error message.
      }
    }
  }
}

interface Subscriber<Incoming = unknown> {
  handleEvent(event: Incoming): void | Promise<void>;
}

abstract class Publisher<Outgoing = unknown> {
  private readonly listeners: Subscriber<Outgoing>[] = [];
  private publishedValue?: Outgoing;

  getPublishedValue(): Outgoing | undefined {
    return this.publishedValue;
  }

  addEventListener(listener: Subscriber<Outgoing>, silent = false): void {
    if (this.publishedValue !== undefined && !silent) {
      listener.handleEvent(this.publishedValue);
    }

    this.listeners.push(listener);
  }

  removeEventListener(listener: Subscriber<Outgoing>): void {
    const index = this.listeners.indexOf(listener);

    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
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
}

abstract class Vertex<Type = unknown> extends Publisher<Type> implements Subscriber<Type> {
  handleEvent(event: Type): void {
    this.publish(event);
  }
}

interface Property {
  getValue(): Field;
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

class Field extends Publisher implements Entity {
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
      this.binding = new Quest(source.binding);
    } else if (source.binding.kind === "raw") {
      this.binding = new Raw(source.binding);
    } else if (source.binding.kind === "list") {
      this.binding = new List(source.binding);
    } else if (source.binding.kind === "struct") {
      this.binding = new Struct(source.binding);
    } else if (source.binding.kind === "action") {
      this.binding = new Action(source.binding);
    } else if (source.binding.kind === "view") {
      this.binding = new View(source.binding);
    } else if (source.binding.kind === "component") {
      this.binding = new Component(source.binding);
    } else {
      throw new Error(); // TODO: Add error message.
    }

    this.binding.addEventListener(this);
  }

  getPropertyValue(name: string): Field {
    return this.binding.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.binding.setProperty(name, field);
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
}

class Ref extends Vertex implements Entity {
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

  getPropertyValue(name: string): Field {
    return this.ref.getPropertyValue(name);
  }

  setProperty(name: string, field: Field): void {
    this.ref.setProperty(name, field);
  }
}

class Call extends Publisher implements Subscriber<void>, Entity {
  readonly source: Abstract.Call;
  private readonly ref: Ref;
  private readonly args: Field[];
  private result?: Field;

  constructor(source: Abstract.Call, scope: TreeEntity) {
    super();

    this.source = source;
    this.ref = new Ref(source.ref, scope);
    this.args = source.args.map((arg) => new Field(arg, scope));

    this.handleEvent();
    this.ref.addEventListener(this, true);

    for (const arg of this.args) {
      arg.addEventListener(this, true);
    }
  }

  handleEvent(): void {
    const callee = this.ref.getPublishedValue();

    if (typeof callee === "function") {
      const result = callee(this.args);
      this.publish(result);
    } else {
      throw new Error(); // TODO: Add error message.
    }
  }

  getPropertyValue(name: string): Field {
    return this.result?.getPropertyValue(name); // TODO fix result
  }

  setProperty(name: string, field: Field): void {
    this.result?.setProperty(name, field);
  }
}

class Quest<T = unknown> extends Publisher<T> implements Subscriber<Promise<T>> {
  readonly source: Abstract.Quest;
  private readonly call: Call;

  constructor(source: Abstract.Quest, scope: TreeEntity) {
    super();

    this.source = source;
    this.call = new Call(source.call, scope);
    this.call.addEventListener(this);
  }

  async handleEvent(promise: Promise<T>): Promise<void> {
    const result = await promise;
    this.publish(result);
  }
}

class Raw extends Publisher {
  // TODO
}

// TODO Roll this into class Raw? ...
// abstract class UnknownEntity implements Entity {
//   // TODO
// }
