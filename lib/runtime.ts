import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

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

  protected publish(value: T) {
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
  readonly fieldKey: string;
  private readonly members: Record<string, Publisher | Subscriber> = {};
  private readonly modelKey?: string;
  readonly name?: string;

  constructor(field: Abstract.Field<T>) {
    super();

    this.fieldKey = field.fieldKey;
    this.modelKey = field.modelKey;
    this.name = field.name;

    if (field.value !== undefined) {
      this.take(field.value);
    }
  }

  static create(field: Abstract.Field): Field {
    if (Abstract.isConditionField(field)) {
      return new Condition(field);
    }

    if (Abstract.isCountField(field)) {
      return new Count(field);
    }

    if (Abstract.isTextField(field)) {
      return new Text(field);
    }

    if (Abstract.isElementField(field)) {
      return new ElementField(field);
    }

    if (Abstract.isCollectionField(field)) {
      return new Collection(field);
    }

    // TODO Create complex fields, using models.

    throw new ViewScriptException(
      `Cannot construct a field of unknown modelKey \`${field.modelKey}\``
    );
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptException(
        `Cannot get member \`${name}\` of \`${this.modelKey}\` field \`${this.name}\``
      );
    }

    return this.members[name];
  }

  protected publish(value: T) {
    if (this.name !== undefined) {
      window.console.log(
        `[VSR] ⛰️ Set ${this.modelKey} field ${this.name} =`,
        value
      );
    }

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
  constructor(field: Abstract.Condition) {
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
  constructor(field: Abstract.Count) {
    super(field);

    this.when("add", (amount: number) => (this.getValue() ?? 0) + amount);
  }
}

/**
 * A field that stores a string.
 */
class Text extends Field<string> {
  constructor(field: Abstract.Text) {
    super(field);
  }
}

/**
 * A field that stores an element AST object (see Abstract.Element).
 */
class ElementField extends Field<Abstract.Element> {
  constructor(field: Abstract.ElementField) {
    super(field);
  }
}

class Collection extends Field<Array<unknown>> {
  constructor(field: Abstract.Collection) {
    super(field);
  }
}

/**
 * A binding to a field or action based on its name or path within the given fields.
 */
class Reference extends Binding {
  private readonly argument?: Field;
  private readonly keyPath: Array<string>;
  private readonly port: Publisher | Subscriber;

  constructor(reference: Abstract.Reference, fields: Record<string, Field>) {
    super();

    this.argument =
      reference.argumentBinding && Field.create(reference.argumentBinding);
    this.keyPath = reference.keyPath;

    const keyPath = [...this.keyPath];

    const getNextKey = () => {
      const key = keyPath.shift();

      if (!key) {
        throw new ViewScriptException(
          `Cannot dereference invalid keyPath \`${reference.keyPath}\``
        );
      }

      return key;
    };

    const field = fields[getNextKey()];
    this.port = field;

    while (keyPath.length > 0) {
      if (!(this.port instanceof Field)) {
        throw new ViewScriptException(
          `Cannot dereference invalid keyPath \`${reference.keyPath}\``
        );
      }

      this.port = this.port.getMember(getNextKey());
    }

    if (typeof this.port !== "object" || this.port === null) {
      throw new ViewScriptException(
        `Cannot dereference invalid keyPath \`${reference.keyPath}\``
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
    conditional: Abstract.Conditional,
    fields: Record<string, Field>
  ) {
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

  constructor(input: Abstract.Input, fields: Record<string, Field>) {
    super();

    if (input.dataBinding.kind === "field") {
      this.publisher = Field.create(input.dataBinding);
    } else if (input.dataBinding.kind === "reference") {
      this.publisher = new Reference(input.dataBinding, fields);
    } else if (input.dataBinding.kind === "conditional") {
      this.publisher = new Conditional(input.dataBinding, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an input with dataBinding of unknown kind "${
          (input.dataBinding as { kind: unknown }).kind
        }"`
      );
    }

    this.publisher.subscribe(this);
  }
}

class Output extends Binding {
  private readonly subscriber: Reference;

  constructor(output: Abstract.Output, fields: Record<string, Field>) {
    super();

    this.subscriber = new Reference(output.dataBinding, fields);
    this.subscribe(this.subscriber);
  }

  getArgumentValue() {
    return this.subscriber.getArgumentValue();
  }
}

class ElementOutputPublisher extends Publisher {
  constructor(element: HTMLElement, event: string, output: Output) {
    super();

    Dom.listen(element, event, () => {
      this.publish(output.getArgumentValue());
    });

    // TODO Remove event listeners when their elements unmount.
    // This will become relevant once mapped elements are supported.
  }
}

class Element extends Publisher<HTMLElement> {
  private children: Array<Element | string> = [];
  private readonly properties: Record<string, Input | Output> = {};
  private readonly viewKey: string;

  constructor(
    element: Abstract.Element,
    views: Record<string, Abstract.View>,
    fields: Record<string, Field>
  ) {
    super();

    this.viewKey = element.viewKey;

    if (/^<[\w-.]+>$/g.test(this.viewKey)) {
      const tagName = this.viewKey.slice(1, this.viewKey.length - 1);
      const htmlElement = Dom.create(tagName);

      if (element.properties) {
        Object.entries(element.properties).forEach(
          ([propertyKey, property]) => {
            if (property.kind === "input") {
              const input = new Input(property, fields);
              this.properties[propertyKey] = input;

              let take: (value: unknown) => void;

              if (propertyKey === "content") {
                take = (value) => {
                  this.children = [];

                  const htmlElementChildren: Array<HTMLElement | string> = [];
                  const populate = (child = value) => {
                    if (child instanceof Array) {
                      child.forEach(populate);
                    } else if (Abstract.isElement(child)) {
                      const elementChild = new Element(child, views, fields);
                      this.children.push(elementChild);
                      elementChild.subscribe({
                        take: (htmlElementChild) => {
                          htmlElementChildren.push(htmlElementChild);
                        },
                      });
                    } else if (child !== null && child !== undefined) {
                      const textContent = String(child);
                      this.children.push(textContent);
                      htmlElementChildren.push(textContent);
                    }
                  };

                  populate();
                  Dom.populate(htmlElement, htmlElementChildren);
                };
              } else if (Style.supports(propertyKey)) {
                take = (value) => {
                  Dom.styleProp(
                    htmlElement,
                    propertyKey,
                    value as string | null
                  );
                };
              } else {
                take = (value) => {
                  Dom.attribute(
                    htmlElement,
                    propertyKey,
                    value as string | null
                  );
                };
              }

              input.subscribe({ take });
            } else if (property.kind === "output") {
              const output = new Output(property, fields);
              this.properties[propertyKey] = output;

              const publisher = new ElementOutputPublisher(
                htmlElement,
                propertyKey,
                output
              );
              publisher.subscribe(output);
            } else {
              throw new ViewScriptException(
                `Cannot construct a property of unknown kind "${
                  (property as { kind: unknown }).kind
                }"`
              );
            }
          }
        );
      }

      this.publish(htmlElement);
    } else if (this.viewKey in views) {
      // TODO Pass properties to elements constructed from views...

      const abstractView = views[this.viewKey];
      const view = new View(abstractView, views, {
        ...fields,
      });

      window.console.log(`[VSR] 🌻 Create ${abstractView.name}`, view);

      view.subscribe({
        take: (htmlElement) => {
          this.publish(htmlElement);
        },
      });
    } else {
      throw new ViewScriptException(
        `Cannot construct an element of invalid viewKey \`${this.viewKey}\``
      );
    }
  }
}

class Console extends Field {
  constructor() {
    super({ kind: "field", fieldKey: "console", modelKey: "Console" });

    this.when("log", (value) => window.console.log(value));
  }
}

class Browser extends Field {
  constructor() {
    super({ kind: "field", fieldKey: "browser", modelKey: "Browser" });

    this.set("console", new Console());
  }
}

class View extends Binding<HTMLElement> {
  private readonly element: Element;
  private readonly fields: Record<string, Field>;
  readonly name?: string;
  readonly viewKey: string;

  constructor(
    mainView: Abstract.View,
    views: Record<string, Abstract.View>,
    fields: Record<string, Field>
  ) {
    super();

    this.fields = fields;
    this.name = mainView.name;
    this.viewKey = mainView.viewKey;

    if (mainView.fields) {
      Object.entries(mainView.fields).forEach(([fieldKey, abstractField]) => {
        const field = Field.create(abstractField);
        this.fields[fieldKey] = field;
      });
    }

    this.element = new Element(mainView.element, views, this.fields);
    this.element.subscribe(this);
  }
}

export class RunningApp {
  private static readonly browser = new Browser();

  private readonly fields: Record<string, Field> = {
    browser: RunningApp.browser,
  };

  private readonly mainView: View;

  constructor(app: Abstract.App) {
    this.mainView = new View(app.mainView, app.views ?? {}, {
      ...this.fields,
    });

    this.mainView.subscribe({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}
