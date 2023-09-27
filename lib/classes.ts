interface Listener<T> {
  publish(value: T): void;
}

class Store<T> {
  private model: string;
  private value: T;
  private readonly listeners: Array<Listener<T>> = [];

  constructor(model: string, value: T) {
    this.model = model;
    this.value = value;
  }

  read() {
    return this.value;
  }

  subscribe(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  protected update(value: T) {
    this.value = value;
    this.listeners.forEach((listener) => {
      listener.publish(value);
    });
  }
}

class ConditionStore extends Store<boolean> {
  constructor(value: boolean) {
    super("Condition", value);
  }

  disable() {
    this.update(false);
  }

  enable() {
    this.update(true);
  }

  toggle() {
    this.update(!this.read());
  }
}

class Field {
  constructor(field: Compiled.Field) {
    if (field.N === "Condition") {
      new ConditionStore(field.V.V as boolean);
    }
  }
}

class Property {
  constructor(property: Compiled.Property) {
    // TODO
  }
}

class Atom {
  constructor(atom: Compiled.Atom) {
    // const element = document.createElement(atom.C);
    atom.P.forEach((property) => {
      new Property(property);
    });
  }
}

class View {
  constructor(view: Compiled.View) {
    view.B.forEach((statement) => {
      if (statement.K === "f") {
        new Field(statement);
      } else if (statement.K === "a") {
        new Atom(statement);
      }
    });
  }
}

export class App {
  constructor(app: Compiled.App) {
    new View(app.B[0]);
  }
}
