import { cssSupports } from "./cssSupports";

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

abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  take(value: T) {
    this.publish(value);
  }
}

abstract class Field<T = unknown> extends Binding<T> {
  readonly id: string;
  private readonly members: Record<string, Publisher | Subscriber> = {};
  private readonly modelName?: string;
  private value?: T;

  constructor(field: Compiled.Field) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.C;

    setTimeout(() => {
      // Set a timeout, so that consumers can receive the initial value via subscription.
      this.take(field.V as T); // The ViewScript compiler enforces the type safety of this value.
    });
  }

  static create(field: Compiled.Field) {
    if (Compiled.isCondition(field)) {
      return new Condition(field);
    }
    if (Compiled.isText(field)) {
      return new Text(field);
    }

    throw new ViewScriptException(
      `Cannot construct a field of unknown class \`${field.C}\``
    );
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

  protected set(name: string, field: Field) {
    this.members[name] = field;
  }

  take(value: T) {
    this.value = value;
    this.publish(value);
  }

  protected when(name: string, reducer: (argument: unknown) => T) {
    this.members[name] = {
      take: (event) => {
        const nextValue = reducer(event);
        this.take(nextValue);
      },
    };
  }
}

class Condition extends Field<boolean> {
  constructor(field: Compiled.Condition) {
    super(field);

    this.when("disable", () => false);
    this.when("enable", () => true);
    this.when("toggle", () => !this.getValue());
  }
}

class Text extends Field<string> {
  constructor(field: Compiled.Text) {
    super(field);
  }
}

class Reference extends Binding {
  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    const names =
      typeof reference.N === "string" ? [reference.N] : [...reference.N];

    const getNextName = () => {
      const name = names.shift();

      if (!name) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      return name;
    };

    let port: Publisher | Subscriber = fields[getNextName()];

    while (names.length > 0) {
      if (!(port instanceof Field)) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      port = port.getMember(getNextName());
    }

    if ("subscribe" in port) {
      port.subscribe(this);
    } else {
      this.subscribe(port);
    }
  }
}

class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly yes: Field;
  private readonly zag: Field;

  constructor(
    conditional: Compiled.Conditional,
    fields: Record<string, Field>
  ) {
    super();

    this.yes = Field.create(conditional.Y);
    this.zag = Field.create(conditional.Z);

    const query = new Reference(conditional.Q, fields);
    query.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.yes.getValue() : this.zag.getValue());
  }
}

class Input extends Binding {
  constructor(input: Compiled.Input, fields: Record<string, Field>) {
    super();

    let publisher: Publisher;

    if (input.V.K === "f") {
      publisher = Field.create(input.V);
    } else if (input.V.K === "r") {
      publisher = new Reference(input.V, fields);
    } else if (input.V.K === "c") {
      publisher = new Conditional(input.V, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an input with value of unknown kind "${
          (input.V as { K: unknown }).K
        }"`
      );
    }

    publisher.subscribe(this);
  }
}

class Output extends Binding {
  constructor(output: Compiled.Output, fields: Record<string, Field>) {
    super();

    const subscriber = new Reference(output.V, fields);
    this.subscribe(subscriber);
  }
}

class Element {
  constructor(element: Compiled.Element, fields: Record<string, Field>) {
    const htmlElement = window.document.createElement(element.C);

    element.P.forEach((property) => {
      if (property.K === "i") {
        let take: (value: unknown) => void;

        if (property.N === "content") {
          take = (value) => {
            htmlElement.textContent = value as string;
          };
        } else if (cssSupports(property.N)) {
          take = (value) => {
            htmlElement.style.setProperty(property.N, value as string);
          };
        } else {
          throw new ViewScriptException(
            `Cannot bind an input to atomic element property \`${property.N}\``
          );
        }

        new Input(property, fields).subscribe({ take });
      } else if (property.K === "o") {
        const publisher =
          new (class HtmlEventPublisher extends Publisher<Event> {
            constructor() {
              super();

              htmlElement.addEventListener(property.N, (event) => {
                this.publish(event);
              });
            }
          })();

        publisher.subscribe(new Output(property, fields));
      } else {
        throw new ViewScriptException(
          `Cannot construct a property of unknown kind "${
            (property as { K: unknown }).K
          }"`
        );
      }
    });
  }
}

class Console extends Field {
  constructor() {
    super({ K: "f", N: "console", C: "Console" });

    this.when("log", (value) => window.console.log(value));
  }
}

class Window extends Field {
  constructor() {
    super({ K: "f", N: "window", C: "Window" });

    this.set("console", new Console());
  }
}

class View {
  private readonly fields;

  constructor(view: Compiled.View, fields: Record<string, Field>) {
    this.fields = fields;

    view.B.forEach((statement) => {
      if (statement.K === "f") {
        this.fields[statement.N] = Field.create(statement);
      } else if (statement.K === "e") {
        new Element(statement, this.fields);
      } else {
        throw new ViewScriptException(
          `Cannot construct a statement of unknown kind "${
            (statement as { K: unknown }).K
          }"`
        );
      }
    });
  }
}

export class App {
  constructor(app: Compiled.App) {
    new View(app.B[0], {
      window: new Window(),
    });
  }
}
