import * as Dom from "./dom";
import * as Style from "./style";
import * as Types from "./types";

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

  constructor(field: Types.Field<T>) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.model;

    if (field.value !== undefined) {
      this.take(field.value);
    }
  }

  static create(field: Types.Field) {
    if (Types.isConditionField(field)) {
      return new Condition(field);
    }

    if (Types.isTextField(field)) {
      return new Text(field);
    }

    if (Types.isElementField(field)) {
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
  constructor(field: Types.Condition) {
    super(field);

    this.when("disable", () => false);
    this.when("enable", () => true);
    this.when("toggle", () => !this.getValue());
  }
}

class Text extends Field<string> {
  constructor(field: Types.Text) {
    super(field);
  }
}

class ElementField extends Field<Types.Element> {
  constructor(field: Types.ElementField) {
    super(field);
  }
}

class Reference extends Binding {
  private readonly argument?: Field;
  private readonly names: Array<string>;
  private readonly port: Publisher | Subscriber;

  constructor(reference: Types.Reference, fields: Record<string, Field>) {
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

  constructor(conditional: Types.Conditional, fields: Record<string, Field>) {
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

  constructor(input: Types.Input, fields: Record<string, Field>) {
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
          (input.value as { kind: unknown }).kind
        }"`
      );
    }

    this.publisher.subscribe(this);
  }
}

class Output extends Binding {
  private readonly subscriber: Reference;

  constructor(output: Types.Output, fields: Record<string, Field>) {
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

  constructor(element: Types.Element, fields: Record<string, Field>) {
    super();

    // TODO Add support for rendering views, not just HTML elements.

    if (!/^<[\w-.]+>$/g.test(element.view)) {
      throw new ViewScriptException(
        `Cannot construct an element of invalid tag name \`${element.view}\``
      );
    }

    const tagName = element.view.slice(1, element.view.length - 1);
    const htmlElement = Dom.create(tagName);

    element.properties.forEach((property) => {
      if (property.kind === "input") {
        // TODO Add support for input properties which are lists.

        const input = new Input(property, fields);
        this.properties[property.name] = input;

        let take: (value: unknown) => void;

        if (property.name === "content") {
          take = (value) => {
            if (Types.isElement(value)) {
              const childElementValue = value as Types.Element;
              const childElement = new Element(childElementValue, fields);
              childElement.subscribe({
                take: (childHtmlElement) => {
                  Dom.append(htmlElement, childHtmlElement);
                },
              });
            } else {
              Dom.textContent(htmlElement, value as string | null);
            }
          };
        } else if (Style.supports(property.name)) {
          take = (value) => {
            Dom.styleProp(htmlElement, property.name, value as string | null);
          };
        } else {
          take = (value) => {
            Dom.attribute(htmlElement, property.name, value as string | null);
          };
        }

        input.subscribe({ take });
      } else if (property.kind === "output") {
        const output = new Output(property, fields);
        this.properties[property.name] = output;

        class ElementOutputPublisher extends Publisher {
          constructor() {
            super();

            Dom.listen(htmlElement, property.name, () => {
              this.publish(output.getArgumentValue());
            });
          }
        }

        const publisher = new ElementOutputPublisher();
        publisher.subscribe(output);
      } else {
        throw new ViewScriptException(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
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

  constructor(view: Types.View, fields: Record<string, Field>) {
    this.fields = fields;

    view.body.forEach((statement) => {
      if (statement.kind === "field") {
        this.fields[statement.name] = Field.create(statement);
      } else if (statement.kind === "element") {
        const element = new Element(statement, this.fields);
        this.elements.push(element);
        element.subscribe({
          take: (htmlElement) => {
            Dom.append(window.document.body, htmlElement);
          },
        });
      } else {
        throw new ViewScriptException(
          `Cannot construct a statement of unknown kind "${
            (statement as { kind: unknown }).kind
          }"`
        );
      }
    });
  }
}

export class RunningApp {
  private static readonly browser = new Browser();
  private readonly views: Array<View> = [];

  constructor(app: Types.App) {
    const view = new View(app.body[0], { browser: RunningApp.browser });
    this.views.push(view);

    window.console.log(`[VSR] 🏃 This app is now running:`);
    window.console.log(this);
  }
}
