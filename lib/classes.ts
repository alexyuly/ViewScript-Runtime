class ViewScriptException extends Error {}

interface Subscriber<T = unknown> {
  dispatchEvent(value: T): void;
}

abstract class Publisher<T = unknown> {
  protected readonly listeners: Array<Subscriber<T>> = [];

  abstract getValue(): T;

  addListener(listener: Subscriber<T>) {
    this.listeners.push(listener);
  }

  dispatchEvent(value: T) {
    this.listeners.forEach((listener) => {
      listener.dispatchEvent(value);
    });
  }
}

class Store<T = unknown> extends Publisher<T> {
  private value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  dispatchEvent(value: T) {
    super.dispatchEvent(value);
    this.value = value;
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

class Literal extends Publisher {
  private value: any;

  constructor(literal: Compiled.Literal) {
    super();
    this.value = literal.V;
  }

  getValue() {
    return this.value;
  }
}

// class Reference extends Publisher {
//   private value: any;

//   constructor(reference: Compiled.Reference) {
//     super();
//     this.value = literal.V;
//   }

//   getValue() {
//     return this.value;
//   }
// }

class Field extends Publisher {
  readonly store: Store;

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

// class Property extends Publisher {
//   constructor(property: Compiled.Property) {
//     super();
//     // TODO
//   }
// }

class Atom {
  constructor(atom: Compiled.Atom) {
    // const element = document.createElement(atom.C);
    atom.P.forEach((property) => {
      // new Property(property);
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
