import * as style from "./style";
import * as types from "./types";

class ViewScriptException extends Error {}

interface Subscriber<T = unknown> {
  take(value: T): void;
}

abstract class Publisher<T = unknown> {
  private lastValue: T | undefined;
  private readonly listeners: Array<Subscriber<T>> = [];

  getValue() {
    return this.lastValue;
  }

  publish(value: T) {
    this.lastValue = value;

    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  subscribe(listener: Subscriber<T>) {
    if (this.lastValue !== undefined) {
      listener.take(this.lastValue);
    }

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

  constructor(field: types.Field) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.C;
    this.take(field.V as T); // The ViewScript compiler enforces the type safety of this value.
  }

  static create(field: types.Field) {
    if (types.isFieldCondition(field)) {
      return new Condition(field);
    }

    if (types.isFieldText(field)) {
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

  protected set(name: string, field: Field) {
    this.members[name] = field;
  }

  take(value: T) {
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
  constructor(field: types.Condition) {
    super(field);

    this.when("disable", () => false);
    this.when("enable", () => true);
    this.when("toggle", () => !this.getValue());
  }
}

class Text extends Field<string> {
  constructor(field: types.Text) {
    super(field);
  }
}

class Reference extends Binding {
  private readonly argument?: Field;
  private readonly names: Array<string>;
  private readonly port: Publisher | Subscriber;

  constructor(reference: types.Reference, fields: Record<string, Field>) {
    super();

    this.argument = reference.A && Field.create(reference.A);
    this.names = typeof reference.N === "string" ? [reference.N] : reference.N;

    const names = [...this.names];

    const getNextName = () => {
      const name = names.shift();

      if (!name) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      return name;
    };

    this.port = fields[getNextName()];

    while (names.length > 0) {
      if (!(this.port instanceof Field)) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      this.port = this.port.getMember(getNextName());
    }

    if (typeof this.port !== "object" || this.port === null) {
      throw new ViewScriptException(
        `Cannot dereference invalid name \`${reference.N}\``
      );
    }

    if ("subscribe" in this.port) {
      this.port.subscribe(this);
    } else {
      this.subscribe(this.port);
    }
  }

  getArgumentValue() {
    return this.argument?.getValue();
  }
}

class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly yes: Field;
  private readonly zag: Field;
  private readonly query: Reference;

  constructor(conditional: types.Conditional, fields: Record<string, Field>) {
    super();

    this.yes = Field.create(conditional.Y);
    this.zag = Field.create(conditional.Z);

    this.query = new Reference(conditional.Q, fields);
    this.query.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.yes.getValue() : this.zag.getValue());
  }
}

class Input extends Binding {
  private readonly publisher: Publisher;

  constructor(input: types.Input, fields: Record<string, Field>) {
    super();

    if (input.V.K === "f") {
      this.publisher = Field.create(input.V);
    } else if (input.V.K === "r") {
      this.publisher = new Reference(input.V, fields);
    } else if (input.V.K === "c") {
      this.publisher = new Conditional(input.V, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an input with value of unknown kind "${
          (input.V as { K: unknown }).K
        }"`
      );
    }

    this.publisher.subscribe(this);
  }
}

class Output extends Binding {
  private readonly subscriber: Reference;

  constructor(output: types.Output, fields: Record<string, Field>) {
    super();

    this.subscriber = new Reference(output.V, fields);
    this.subscribe(this.subscriber);
  }

  getArgumentValue() {
    return this.subscriber.getArgumentValue();
  }
}

class Element extends Publisher<HTMLElement> {
  private readonly properties: Record<string, Input | Output> = {};

  constructor(element: types.Element, fields: Record<string, Field>) {
    super();

    // TODO Add support for rendering views, not just HTML elements.

    if (!/^<[\w-.]+>$/g.test(element.C)) {
      throw new ViewScriptException(
        `Cannot construct an element of invalid tag name \`${element.C}\``
      );
    }

    const tagName = element.C.slice(1, element.C.length - 1);
    const htmlElement = window.document.createElement(tagName);
    window.console.log(`[DOM] 🔩 ${element.C} created`, htmlElement);

    element.P.forEach((property) => {
      if (property.K === "i") {
        let take: (value: unknown) => void;

        if (property.N === "content") {
          take = (value) => {
            htmlElement.textContent = value as string;
            window.console.log(`[DOM] 💧 ${element.C} textContent =`, value);
          };
        } else if (style.supports(property.N)) {
          take = (value) => {
            htmlElement.style.setProperty(property.N, value as string);
            window.console.log(`[DOM] 💧 ${element.C} ${property.N} =`, value);
          };
        } else {
          take = (value) => {
            htmlElement.setAttribute(property.N, value as string);
            window.console.log(`[DOM] 💧 ${element.C} ${property.N} =`, value);
          };
        }

        const input = new Input(property, fields);
        this.properties[property.N] = input;
        input.subscribe({ take });
      } else if (property.K === "o") {
        const output = new Output(property, fields);
        this.properties[property.N] = output;

        class ElementOutputPublisher extends Publisher {
          constructor() {
            super();

            htmlElement.addEventListener(property.N, () => {
              // TODO Add support for processing the Event passed to this listener.

              window.console.log(`[DOM] 🔥 ${element.C} ${property.N}`);
              this.publish(output.getArgumentValue());
            });
          }
        }

        const publisher = new ElementOutputPublisher();
        publisher.subscribe(output);
      } else {
        throw new ViewScriptException(
          `Cannot construct a property of unknown kind "${
            (property as { K: unknown }).K
          }"`
        );
      }
    });

    this.publish(htmlElement);
  }
}

class Console extends Field {
  constructor() {
    super({ K: "f", N: "console", C: "Console" });

    this.when("log", (value) => window.console.log(value));
  }
}

class Browser extends Field {
  constructor() {
    super({ K: "f", N: "browser", C: "Browser" });

    this.set("console", new Console());
  }
}

class View {
  private readonly elements: Array<Element> = [];
  private readonly fields: Record<string, Field>;

  constructor(view: types.View, fields: Record<string, Field>) {
    this.fields = fields;

    view.B.forEach((statement) => {
      if (statement.K === "f") {
        this.fields[statement.N] = Field.create(statement);
      } else if (statement.K === "e") {
        const element = new Element(statement, this.fields);
        this.elements.push(element);
        element.subscribe({
          take: (htmlElement) => {
            window.document.body.appendChild(htmlElement);
            window.console.log(
              `[DOM] 🔧 ${statement.C} appended to body`,
              htmlElement
            );
          },
        });
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

export class RunnableApp {
  private static readonly browser = new Browser();
  private readonly views: Array<View> = [];

  constructor(app: types.App) {
    const view = new View(app.B[0], { browser: RunnableApp.browser });
    this.views.push(view);

    window.console.log(`[VSR] 🏃 The following app is now running:`);
    window.console.log(this);
  }
}
