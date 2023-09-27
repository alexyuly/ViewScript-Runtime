class ViewScriptException extends Error {}

abstract class Binding<T = unknown> {
  private readonly listeners: Array<Binding<T>> = [];

  addListener(listener: Binding<T>) {
    this.listeners.push(listener);
  }

  dispatchEvent(value: T) {
    this.listeners.forEach((listener) => {
      listener.dispatchEvent(value);
    });
  }

  abstract getValue(): T;
}

class Store<T = unknown> extends Binding<T> {
  private value: T;

  constructor(value: T) {
    super();

    this.value = value;
  }

  dispatchEvent(value: T) {
    super.dispatchEvent(value);

    this.value = value;
  }

  getValue() {
    return this.value;
  }
}

class ConditionStore extends Store<boolean> {
  disable() {
    this.dispatchEvent(false);
  }

  enable() {
    this.dispatchEvent(true);
  }

  toggle() {
    this.dispatchEvent(!this.getValue());
  }
}

class Field extends Binding {
  private readonly store: Store;

  constructor(field: Compiled.Field) {
    super();

    if (field.C === "Condition") {
      this.store = new ConditionStore(field.V.V as boolean);
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
}

class Reference extends Binding {
  constructor(reference: Compiled.Reference) {
    super();

    // TODO
  }

  getValue() {
    // TODO
  }
}

class Conditional extends Binding {
  constructor(conditional: Compiled.Conditional) {
    super();

    // TODO
  }

  getValue() {
    // TODO
  }
}

class Property extends Binding {
  private readonly binding: Binding;

  constructor(property: Compiled.Property) {
    super();

    if (property.V.K === "f") {
      this.binding = new Field(property.V);
    } else if (property.V.K === "r") {
      this.binding = new Reference(property.V);
    } else if (property.V.K === "c") {
      this.binding = new Conditional(property.V);
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
}

class Atom {
  constructor(atom: Compiled.Atom, fields: Record<string, Field>) {
    // const element = document.createElement(atom.C);
    atom.P.forEach((property) => {
      new Property(property);
    });
  }
}

class View {
  private readonly fields: Record<string, Field> = {};

  constructor(view: Compiled.View) {
    view.B.forEach((statement) => {
      if (statement.K === "f") {
        this.fields[statement.N] = new Field(statement);
      } else if (statement.K === "a") {
        new Atom(statement, this.fields);
      }
    });
  }
}

export class App {
  constructor(app: Compiled.App) {
    new View(app.B[0]);
  }
}
