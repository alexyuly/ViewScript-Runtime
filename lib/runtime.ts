import * as dom from "./dom";
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
    this.modelName = field.model;
    this.take(field.value as T);
  }

  static create(field: types.Field) {
    if (types.isConditionField(field)) {
      return new Condition(field);
    }

    if (types.isTextField(field)) {
      return new Text(field);
    }

    if (types.isElementField(field)) {
      return new ElementField(field);
    }

    // TODO Support creating numeric fields.
    // TODO Support creating complex fields.
    // TODO Support creating collection fields.

    throw new ViewScriptException(
      `Cannot construct a field of unknown class \`${field.model}\``
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

class ElementField extends Field<HTMLElement> {
  constructor(field: types.ElementField) {
    super(field);
  }
}

class Reference extends Binding {
  private readonly argument?: Field;
  private readonly names: Array<string>;
  private readonly port: Publisher | Subscriber;

  constructor(reference: types.Reference, fields: Record<string, Field>) {
    super();

    this.argument = reference.argument && Field.create(reference.argument);
    this.names =
      typeof reference.name === "string" ? [reference.name] : reference.name;

    const names = [...this.names];

    const getNextName = () => {
      const name = names.shift();

      if (!name) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.name}\``
        );
      }

      return name;
    };

    this.port = fields[getNextName()];

    while (names.length > 0) {
      if (!(this.port instanceof Field)) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.name}\``
        );
      }

      this.port = this.port.getMember(getNextName());
    }

    if (typeof this.port !== "object" || this.port === null) {
      throw new ViewScriptException(
        `Cannot dereference invalid name \`${reference.name}\``
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
  private readonly condition: Reference;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(conditional: types.Conditional, fields: Record<string, Field>) {
    super();

    this.positive = Field.create(conditional.positive);
    this.negative = Field.create(conditional.negative);

    this.condition = new Reference(conditional.condition, fields);
    this.condition.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.positive.getValue() : this.negative.getValue());
  }
}

class Input extends Binding {
  private readonly publisher: Publisher;

  constructor(input: types.Input, fields: Record<string, Field>) {
    super();

    if (input.value.kind === "field") {
      this.publisher = Field.create(input.value);
    } else if (input.value.kind === "reference") {
      this.publisher = new Reference(input.value, fields);
    } else if (input.value.kind === "conditional") {
      this.publisher = new Conditional(input.value, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an input with value of unknown kind "${
          (input.value as { K: unknown }).K
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

    this.subscriber = new Reference(output.value, fields);
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

    if (!/^<[\w-.]+>$/g.test(element.view)) {
      throw new ViewScriptException(
        `Cannot construct an element of invalid tag name \`${element.view}\``
      );
    }

    const tagName = element.view.slice(1, element.view.length - 1);
    const htmlElement = window.document.createElement(tagName);
    window.console.log(`[DOM] 🔩 ${element.view} created`, htmlElement);

    element.properties.forEach((property) => {
      if (property.kind === "input") {
        // TODO Add support for input properties which are lists.

        const input = new Input(property, fields);
        this.properties[property.name] = input;

        let take: (value: unknown) => void;

        if (property.name === "content") {
          take = (value) => {
            if (typeof value === "string") {
              htmlElement.textContent = value as string;
              window.console.log(
                `[DOM] 💧 ${element.view} textContent =`,
                value
              );
            } else {
              const childElementValue = value as types.Element;
              const childElement = new Element(childElementValue, fields);
              childElement.subscribe({
                take: (childHtmlElement) => {
                  dom.append(childHtmlElement, htmlElement);
                },
              });
            }
          };
        } else if (style.supports(property.name)) {
          take = (value) => {
            htmlElement.style.setProperty(property.name, value as string);
            window.console.log(
              `[DOM] 💧 ${element.view} ${property.name} =`,
              value
            );
          };
        } else {
          take = (value) => {
            htmlElement.setAttribute(property.name, value as string);
            window.console.log(
              `[DOM] 💧 ${element.view} ${property.name} =`,
              value
            );
          };
        }

        input.subscribe({ take });
      } else if (property.kind === "output") {
        const output = new Output(property, fields);
        this.properties[property.name] = output;

        class ElementOutputPublisher extends Publisher {
          constructor() {
            super();

            htmlElement.addEventListener(property.name, () => {
              // TODO Add support for processing the Event passed to this listener.

              window.console.log(`[DOM] 🔥 ${element.view} ${property.name}`);
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
    super({ kind: "field", name: "console", model: "Console" });

    this.when("log", (value) => window.console.log(value));
  }
}

class Browser extends Field {
  constructor() {
    super({ kind: "field", name: "browser", model: "Browser" });

    this.set("console", new Console());
  }
}

class View {
  private readonly elements: Array<Element> = [];
  private readonly fields: Record<string, Field>;

  constructor(view: types.View, fields: Record<string, Field>) {
    this.fields = fields;

    view.body.forEach((statement) => {
      if (statement.kind === "field") {
        this.fields[statement.name] = Field.create(statement);
      } else if (statement.kind === "element") {
        const element = new Element(statement, this.fields);
        this.elements.push(element);
        element.subscribe({
          take: (htmlElement) => {
            dom.append(htmlElement, window.document.body);
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

export class RunningApp {
  private static readonly browser = new Browser();
  private readonly views: Array<View> = [];

  constructor(app: types.App) {
    const view = new View(app.body[0], { browser: RunningApp.browser });
    this.views.push(view);

    window.console.log(`[VSR] 🏃 This app is now running:`);
    window.console.log(this);
  }
}
