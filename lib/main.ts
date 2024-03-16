import { Abstract } from "./abstract";

interface Entity {
  getPropertyValue(name: string): Field;
  setProperty(name: string, binding: Field): void;
}

abstract class KnownEntity implements Entity {
  protected readonly members: Record<string, Prop | Constant | Variable> = {};

  getPropertyValue(name: string): Field {
    const property = this.members[name];

    if (!property) {
      throw new Error(); // TODO: Add error message.
    }

    return property.getValue();
  }

  setProperty(name: string, binding: Field): void {
    const property = this.members[name];

    if (!(property instanceof Variable)) {
      throw new Error(); // TODO: Add error message.
    }

    property.set(binding);
  }
}

export class App extends KnownEntity {
  readonly source: Abstract.App;

  constructor(source: Abstract.App, environment: Record<string, string> = {}) {
    super();

    this.source = source;

    for (const member of source.members) {
      if (member.kind === "prop") {
        const abstractField: Abstract.Field = {
          kind: "field",
          binding: { kind: "raw", value: environment[member.parameter.name] },
        };
        const propertyValue = new Field(abstractField, this);
        this.members[member.parameter.name] = new Prop(member, propertyValue);
      } else if (member.kind === "constant") {
        this.members[member.parameter.name] = new Constant(member, this);
      } else if (member.kind === "variable") {
        this.members[member.parameter.name] = new Variable(member, this);
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
  private lastPublishedValue?: Outgoing;

  addEventListener(listener: Subscriber<Outgoing>): void {
    if (this.lastPublishedValue !== undefined) {
      listener.handleEvent(this.lastPublishedValue);
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
    if (this.lastPublishedValue === nextValue) {
      return;
    }

    this.lastPublishedValue = nextValue;

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
  private readonly binding: Field;

  constructor(source: Abstract.Prop, binding: Field) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = binding;
    this.binding.addEventListener(this);
  }

  getValue(): Field {
    return this.binding;
  }
}

class Constant extends Vertex implements Property {
  readonly source: Abstract.Constant;
  private readonly parameter: Parameter;
  private readonly binding: Field;

  constructor(source: Abstract.Constant, scope: KnownEntity) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = new Field(source.binding, scope);
    this.binding.addEventListener(this);
  }

  getValue(): Field {
    return this.binding;
  }
}

class Variable extends Vertex implements Property {
  readonly source: Abstract.Variable;
  private readonly parameter: Parameter;
  private binding: Field;

  constructor(source: Abstract.Variable, scope: KnownEntity) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = new Field(source.binding, scope);
    this.binding.addEventListener(this);
  }

  getValue(): Field {
    return this.binding;
  }

  set(binding: Field): void {
    this.binding.removeEventListener(this);
    this.binding = binding;
    this.binding.addEventListener(this);
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
  private readonly binding: Ref | Call | Quest | Raw | List | Structure | Action | View | Component;

  constructor(source: Abstract.Field, scope: KnownEntity) {
    super();

    this.source = source;

    if (source.binding.kind === "ref") {
      this.binding = new Ref(source.binding, scope);
    } else if (source.binding.kind === "call") {
      this.binding = new Call(source.binding);
    } else if (source.binding.kind === "quest") {
      this.binding = new Quest(source.binding);
    } else if (source.binding.kind === "raw") {
      this.binding = new Raw(source.binding);
    } else if (source.binding.kind === "list") {
      this.binding = new List(source.binding);
    } else if (source.binding.kind === "structure") {
      this.binding = new Structure(source.binding);
    } else if (source.binding.kind === "action") {
      this.binding = new Action(source.binding);
    } else if (source.binding.kind === "view") {
      this.binding = new View(source.binding);
    } else if (source.binding.kind === "component") {
      this.binding = new Component(source.binding);
    } else {
      throw new Error(); // TODO: Add error message.
    }
  }

  getChild(name: string): Field {
    return this.binding.getChild(name);
  }

  getPropertyValue(name: string): Field {
    return this.binding.getPropertyValue(name);
  }

  setProperty(name: string, binding: Field): void {
    this.binding.setProperty(name, binding);
  }
}

class Ref extends Vertex {
  readonly source: Abstract.Ref;
  private readonly scope: Entity;
  private readonly binding: Field;

  constructor(source: Abstract.Ref, scope: KnownEntity) {
    super();

    this.source = source;
    this.scope = source.scope ? new Field(source.scope, scope) : scope;
    this.binding = this.scope.getPropertyValue(source.name);
  }
}

// TODO Roll this into class Raw? ...
// abstract class UnknownEntity implements Entity {
//   // TODO
// }
