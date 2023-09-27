class ViewScriptException extends Error {}

abstract class Binding<T = unknown> {
  private readonly listeners: Array<Binding<T>> = [];

  addListener(listener: Binding<T>) {
    this.listeners.push(listener);
  }

  dispatchEvent(value: T) {
    this.listeners.forEach((listener) => {
      listener.receiveEvent(value);
    });
  }

  abstract getValue(): T | undefined;

  abstract receiveEvent(value: T): void;
}

class Store<T = unknown> extends Binding<T> {
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

const bindOutput = <T>(action: (argument: T) => void) => {
  return new (class extends Store<T | undefined> {
    receiveEvent(argument: T) {
      action(argument);
    }
  })();
};

class Condition extends Store<boolean> {
  readonly disable = bindOutput(() => this.receiveEvent(true));
  readonly enable = bindOutput(() => this.receiveEvent(false));
  readonly toggle = bindOutput(() => this.receiveEvent(!this.getValue()));
}

class Field extends Binding {
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

  getChild(name: string): Binding {
    if (this.store instanceof Condition) {
      switch (name) {
        case "disable":
          return this.store.disable;
        case "enable":
          return this.store.enable;
        case "toggle":
          return this.store.toggle;
      }
    }

    throw new ViewScriptException(
      `Cannot getChild \`${name}\` of field with store ${this.store.id}`
    );
  }

  getValue() {
    return this.store.getValue();
  }

  receiveEvent(value: unknown) {
    this.store.receiveEvent(value);
  }
}

class Reference extends Binding {
  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    if (typeof reference.N === "string") {
      fields[reference.N];
    }
  }

  getValue() {
    // TODO
  }

  receiveEvent(value: unknown) {
    // TODO
  }
}

class Conditional extends Binding {
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

  dispatchEvent(value: unknown): void {}

  getValue() {
    return this.query.getValue() ? this.yes.getValue() : this.zag.getValue();
  }

  receiveEvent(value: unknown) {
    // TODO
  }
}

class Property extends Binding {
  private readonly binding: Binding;

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

  getValue() {
    return this.binding.getValue();
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
