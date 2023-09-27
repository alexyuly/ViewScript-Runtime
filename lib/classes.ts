class ViewScriptException extends Error {}

interface Subscriber<T = unknown> {
  take(value: T): void;
}

abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Subscriber<T>> = [];

  publish(value: T) {
    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  subscribe(listener: Subscriber<T>) {
    this.listeners.push(listener);
  }
}

class Field extends Publisher implements Subscriber {
  readonly id: string;

  private members: Record<string, Publisher | Subscriber> = {};
  private modelName: string;
  private value?: unknown;

  constructor(field: Compiled.Field) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.C;
    this.value = field.V.V;

    if (this.modelName === "Condition") {
      this.members.disable = { take: () => this.take(true) };
      this.members.enable = { take: () => this.take(false) };
      this.members.toggle = { take: () => this.take(!this.getValue()) };
    } else {
      throw new ViewScriptException(
        `Cannot construct a field of unknown class \`${this.modelName}\``
      );
    }
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptException(
        `Cannot getMember \`${name}\` of field \`${this.id}\` of class \`${this.modelName}\``
      );
    }

    return this.members[name];
  }

  getValue() {
    return this.value;
  }

  take(value: unknown) {
    this.value = value;
    this.publish(value);
  }
}

class Reference extends Publisher implements Subscriber {
  private readonly binding: Publisher | Subscriber;

  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    if (typeof reference.N === "string") {
      this.binding = fields[reference.N];
    } else {
      this.binding = fields[reference.N[0]].getMember(reference.N[1]);
    }

    if ("subscribe" in this.binding) {
      this.binding.subscribe(this);
    } else {
      this.subscribe(this.binding);
    }
  }

  take(value: unknown) {
    this.publish(value);
  }
}

class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly query: Reference;
  private readonly yes: Field;
  private readonly zag: Field;

  constructor(
    conditional: Compiled.Conditional,
    fields: Record<string, Field>
  ) {
    super();

    this.query = new Reference(conditional.Q, fields);
    this.yes = new Field(conditional.Y);
    this.zag = new Field(conditional.Z);

    this.query.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.yes.getValue() : this.zag.getValue());
  }
}

// TODO fix all this
class Property extends Publisher implements Subscriber {
  private readonly binding: Publisher & Subscriber;

  constructor(property: Compiled.Property, fields: Record<string, Field>) {
    super();

    if (property.V.K === "f") {
      this.binding = new Field(property.V);
    } else if (property.V.K === "r") {
      this.binding = new Reference(property.V, fields);
    } else if (property.V.K === "c") {
      this.binding = new Conditional(property.V, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct a property of unknown kind "${
          (property.V as { K: unknown }).K
        }"`
      );
    }
  }

  take(value: unknown) {
    this.binding.take(value);
  }
}

// TODO fix all this
class Element {
  constructor(element: Compiled.Element, fields: Record<string, Field>) {
    element.P.forEach((property) => {
      new Property(property, fields);
    });
  }
}

class View {
  private readonly fields: Record<string, Field> = {};

  constructor(view: Compiled.View) {
    view.B.forEach((statement) => {
      if (statement.K === "f") {
        this.fields[statement.N] = new Field(statement);
      } else if (statement.K === "e") {
        new Element(statement, this.fields);
      }
    });
  }
}

export class App {
  constructor(app: Compiled.App) {
    new View(app.B[0]);
  }
}
