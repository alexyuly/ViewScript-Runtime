class ViewScriptException extends Error {}

interface Subscriber<T = unknown> {
  receiveEvent(value: T): void;
}

abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Subscriber<T>> = [];

  addListener(listener: Subscriber<T>) {
    this.listeners.push(listener);
  }

  dispatchEvent(value: T) {
    this.listeners.forEach((listener) => {
      listener.receiveEvent(value);
    });
  }
}

abstract class Store<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  readonly id: string;
  private value?: T;

  constructor(value?: T) {
    super();

    this.id = window.crypto.randomUUID();
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  receiveEvent(value: T) {
    this.value = value;
    this.dispatchEvent(value);
  }
}

class Effect<T> implements Subscriber<T> {
  private readonly sink: (argument: T) => void;

  constructor(sink: (argument: T) => void) {
    this.sink = sink;
  }

  receiveEvent(argument: T) {
    this.sink(argument);
  }
}

class Condition extends Store<boolean> {
  readonly disable = new Effect(() => this.receiveEvent(true));
  readonly enable = new Effect(() => this.receiveEvent(false));
  readonly toggle = new Effect(() => this.receiveEvent(!this.getValue()));
}

class Field extends Publisher implements Subscriber {
  private readonly store: Store;

  constructor(field: Compiled.Field) {
    super();

    if (field.C === "Condition") {
      this.store = new Condition(field.V.V as boolean);
    } else {
      throw new ViewScriptException(
        `Cannot construct a field of unknown class \`${field.C}\``
      );
    }

    this.store.addListener(this);
  }

  getValue() {
    return this.store.getValue();
  }

  receiveEvent(value: unknown) {
    this.dispatchEvent(value);
  }
}

class Reference extends Publisher implements Subscriber {
  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    if (typeof reference.N === "string") {
      fields[reference.N];
    }
  }

  receiveEvent(value: unknown) {
    // TODO
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

    this.query.addListener(this);
  }

  receiveEvent(value: boolean) {
    this.dispatchEvent(value ? this.yes.getValue() : this.zag.getValue());
  }
}

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

  receiveEvent(value: unknown) {
    this.binding.receiveEvent(value);
  }
}

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
