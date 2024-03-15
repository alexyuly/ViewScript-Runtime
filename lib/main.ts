import { Abstract } from "./abstract";

export class App {
  readonly source: Abstract.App;
  private readonly members: Record<string, Property | Constant | Variable> = {};

  constructor(source: Abstract.App) {
    this.source = source;

    for (const member of source.members) {
      if (member.kind === "property") {
        this.members[member.parameter.name] = new Property(member);
      } else if (member.kind === "constant") {
        this.members[member.parameter.name] = new Constant(member);
      } else if (member.kind === "variable") {
        this.members[member.parameter.name] = new Variable(member);
      }
    }
  }
}

interface Subscriber<Incoming = unknown> {
  handleEvent(event: Incoming): void;
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

class Property extends Vertex {
  readonly source: Abstract.Property;
  private readonly parameter: Parameter;
  private readonly binding: Entity;

  constructor(source: Abstract.Property, binding: Entity) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = binding;
  }

  handleEvent(event: any) {
    this.publish(event);
  }
}

class Constant extends Vertex {
  readonly source: Abstract.Constant;
  private readonly parameter: Parameter;
  private readonly binding: Entity;

  constructor(source: Abstract.Constant) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = new Entity(source.binding);
  }

  handleEvent(event: any) {
    this.publish(event);
  }
}

class Variable extends Vertex {
  readonly source: Abstract.Variable;
  private readonly parameter: Parameter;
  private binding: Entity;

  constructor(source: Abstract.Variable) {
    super();

    this.source = source;
    this.parameter = new Parameter(source.parameter);
    this.binding = new Entity(source.binding);
  }

  handleEvent(event: any) {
    this.publish(event);
  }

  setBinding(binding: Entity) {
    this.binding = binding;
  }
}

class Parameter {
  readonly source: Abstract.Parameter;

  constructor(source: Abstract.Parameter) {
    this.source = source;
  }
}

class Entity extends Publisher {
  readonly source: Abstract.Entity;
  private readonly binding: Ref | Call | Expression | Quest | Data | List | Structure | Action | View | Component;

  constructor(source: Abstract.Entity) {
    super();

    this.source = source;

    if (source.binding.kind === "ref") {
      this.binding = new Ref(source.binding);
    } else if (source.binding.kind === "call") {
      this.binding = new Call(source.binding);
    } else if (source.binding.kind === "expression") {
      this.binding = new Expression(source.binding);
    } else if (source.binding.kind === "quest") {
      this.binding = new Quest(source.binding);
    } else if (source.binding.kind === "data") {
      this.binding = new Data(source.binding);
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
}

// TODO ...
