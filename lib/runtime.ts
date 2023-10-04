import * as Dom from "./dom";
import * as Style from "./style";
import * as Types from "./types";

class ViewScriptException extends Error {}

/**
 * Takes values from a publisher.
 */
interface Subscriber<T = unknown> {
  take(value: T): void;
}

/**
 * Publishes values to subscribers.
 * Stores the publicly readable last value.
 */
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

/**
 * Takes values and publishes them again.
 * This is useful for classes that need to forward values, while managing other duties.
 */
abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  take(value: T) {
    this.publish(value);
  }
}

/**
 * An instance of a model of type T.
 * The Model class doesn't exist yet. It will be the base for all native and custom data types.
 * Since custom data types don't exist yet, models aren't implemented yet.
 * Instead, they are hacked into fields for now, to be worked on later.
 */
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

    if (Types.isCountField(field)) {
      return new Count(field);
    }

    if (Types.isTextField(field)) {
      return new Text(field);
    }

    if (Types.isElementField(field)) {
      return new ElementField(field);
    }

    // TODO Support creating complex fields.

    if (Types.isCollectionField(field)) {
      return new Collection(field);
    }

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

  publish(value: T) {
    window.console.log(
      `[VSR] ⛰️ Set ${this.modelName} field ${this.id} =`,
      value
    );
    super.publish(value);
  }

  protected set(name: string, field: Field) {
    this.members[name] = field;
  }

  protected when<A = unknown>(name: string, reducer: (argument: A) => T) {
    this.members[name] = {
      take: (event: A) => {
        const nextValue = reducer(event);

        if (nextValue !== undefined) {
          this.take(nextValue);
        }
      },
    };
  }
}

/**
 * A field that stores a boolean.
 */
class Condition extends Field<boolean> {
  constructor(field: Types.Condition) {
    super(field);

    this.when("disable", () => false);
    this.when("enable", () => true);
    this.when("toggle", () => !this.getValue());
  }
}

/**
 * A field that stores a number.
 */
class Count extends Field<number> {
  constructor(field: Types.Count) {
    super(field);

    this.when("add", (amount: number) => (this.getValue() ?? 0) + amount);
  }
}

/**
 * A field that stores a string.
 */
class Text extends Field<string> {
  constructor(field: Types.Text) {
    super(field);
  }
}

/**
 * A field that stores an element AST object (see Types.Element).
 */
class ElementField extends Field<Types.Element> {
  constructor(field: Types.ElementField) {
    super(field);
  }
}

class Collection extends Field<Array<unknown>> {
  constructor(field: Types.Collection) {
    super(field);
  }
}

/**
 * A binding to a field or action based on its name or path within the given fields.
 */
class Reference extends Binding {
  private readonly argument?: Field;
  private readonly names: Array<string>;
  private readonly port: Publisher | Subscriber;

  constructor(reference: Types.Reference, scope: Record<string, Field | View>) {
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

    const member = scope[getNextName()];

    if (member instanceof View) {
      throw new ViewScriptException(
        `Cannot dereference invalid name \`${reference.name}\``
      );
    }

    this.port = member;

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

  constructor(
    conditional: Types.Conditional,
    scope: Record<string, Field | View>
  ) {
    super();

    this.positive = Field.create(conditional.positive);
    this.negative = Field.create(conditional.negative);

    this.condition = new Reference(conditional.condition, scope);
    this.condition.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.positive.getValue() : this.negative.getValue());
  }
}

class Input extends Binding {
  private readonly publisher: Publisher;

  constructor(input: Types.Input, scope: Record<string, Field | View>) {
    super();

    if (input.value.kind === "field") {
      this.publisher = Field.create(input.value);
    } else if (input.value.kind === "reference") {
      this.publisher = new Reference(input.value, scope);
    } else if (input.value.kind === "conditional") {
      this.publisher = new Conditional(input.value, scope);
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

  constructor(output: Types.Output, scope: Record<string, Field | View>) {
    super();

    this.subscriber = new Reference(output.value, scope);
    this.subscribe(this.subscriber);
  }

  getArgumentValue() {
    return this.subscriber.getArgumentValue();
  }
}

class Element extends Publisher<HTMLElement> {
  private children: Array<Element> = [];
  private readonly properties: Record<string, Input | Output> = {};

  constructor(element: Types.Element, scope: Record<string, View | Field>) {
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
        const input = new Input(property, scope);
        this.properties[property.name] = input;

        let take: (value: unknown) => void;

        if (property.name === "content") {
          take = (value) => {
            this.children = [];

            const children: Array<HTMLElement | string> = [];

            const populate = (child = value) => {
              if (child instanceof Array) {
                child.forEach(populate);
              } else if (Types.isElement(child)) {
                const childElement = new Element(child, scope);
                this.children.push(childElement);
                childElement.subscribe({
                  take: (childHtmlElement) => {
                    children.push(childHtmlElement);
                  },
                });
              } else if (child !== null) {
                children.push(child as string);
              }
            };

            populate();

            htmlElement.replaceChildren(...children);
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
        const output = new Output(property, scope);
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
  private readonly scope: Record<string, Field | View>;

  constructor(view: Types.View, scope: Record<string, Field | View>) {
    this.scope = scope;

    view.body.forEach((statement) => {
      if (statement.kind === "field") {
        this.scope[statement.name] = Field.create(statement);
      } else if (statement.kind === "element") {
        const element = new Element(statement, this.scope);
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

  private readonly scope: Record<string, Field | View> = {
    browser: RunningApp.browser,
  };

  constructor(app: Types.App) {
    app.body.forEach((member) => {
      const view = new View(member, { ...this.scope });
      this.scope[member.name] = view;
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}
