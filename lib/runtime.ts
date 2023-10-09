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
  private lastValue?: T;
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
 * Forwards and stores values of type T from parent to child components.
 * Manages actions, children, and methods for the value.
 */
abstract class Field<
  T extends Abstract.Data = Abstract.Data,
> extends Binding<T> {
  readonly fieldKey: string;
  private readonly members: Record<string, Publisher | Subscriber> = {};
  private readonly modelKey: string;
  readonly name?: string;

  constructor(field: Abstract.Field<T>) {
    super();

    this.fieldKey = field.fieldKey;
    this.modelKey = field.modelKey;
    this.name = field.name;

    const initialValue = field.value;

    if (initialValue !== undefined) {
      this.take(initialValue);
    }

    this.defineAction("reset", () => initialValue);
    this.defineAction("setTo", (value: T) => value);
  }

  static create(field: Abstract.Field): Field {
    if (Abstract.isCondition(field)) {
      return new Condition(field);
    }

    if (Abstract.isCount(field)) {
      return new Count(field);
    }

    if (Abstract.isText(field)) {
      return new Text(field);
    }

    if (Abstract.isStructure(field)) {
      return new Structure(field);
    }

    if (Abstract.isElementField(field)) {
      return new ElementField(field);
    }

    if (Abstract.isCollection(field)) {
      return new Collection(field);
    }

    throw new ViewScriptException(
      `Cannot construct a field of unknown modelKey \`${field.modelKey}\``
    );
  }

  protected defineAction<A extends Abstract.Data>(
    name: string,
    reducer: (argument: A) => T | void
  ) {
    this.members[name] = {
      take: (event: A) => {
        const nextValue = reducer(event);

        if (nextValue !== undefined) {
          this.take(nextValue);
        }
      },
    };
  }

  protected defineChild(name: string, field: Field) {
    this.members[name] = field;
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
}

/**
 * A field that stores a boolean.
 */
class Condition extends Field<boolean> {
  constructor(field: Abstract.Condition) {
    super(field);

    this.defineAction("disable", () => false);
    this.defineAction("enable", () => true);
    this.defineAction("toggle", () => !this.getValue());
  }
}

/**
 * A field that stores a number.
 */
class Count extends Field<number> {
  constructor(field: Abstract.Count) {
    super(field);

    this.defineAction(
      "add",
      (amount: number) => (this.getValue() ?? 0) + amount
    );
    this.defineAction(
      "multiplyBy",
      (amount: number) => (this.getValue() ?? 0) * amount
    );

    // TODO Support field methods. For example:
    // this.defineMethod(
    //   "isAtLeast",
    //   (amount: number): boolean => (this.getValue() ?? 0) >= amount
    // );
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
 * A field that stores an arbitrary data object.
 */
class Structure extends Field<Abstract.Structure> {
  constructor(field: Abstract.StructureField) {
    super(field);
  }
}

/**
 * A field that stores an element AST object.
 */
class ElementField extends Field<Abstract.Element> {
  constructor(field: Abstract.ElementField) {
    super(field);
  }
}

/**
 * A field that stores an array.
 */
class Collection extends Field<Array<Abstract.Data>> {
  constructor(field: Abstract.Collection) {
    super(field);

    this.defineAction("push", (item) => (this.getValue() ?? []).concat(item));
  }
}

/**
 * Forwards either a positive or negative value based on a condition.
 */
class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly condition: Input;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(
    conditional: Abstract.Conditional,
    fields: Record<string, Field>
  ) {
    super();

    this.positive = Field.create(conditional.positive);
    this.negative = Field.create(conditional.negative);

    this.condition = new Input(conditional.condition, fields);
    this.condition.subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.positive.getValue() : this.negative.getValue());
  }
}

/**
 * Forwards events from child to parent components.
 */
class Stream extends Binding {
  // TODO see https://github.com/alexyuly/ViewScript-Runtime/issues/8
  // Use modelKey once we start handling events from streams.
  private readonly modelKey?: string;
  readonly streamKey: string;
  readonly name?: string;

  constructor(stream: Abstract.Stream) {
    super();

    this.modelKey = stream.modelKey;
    this.streamKey = stream.streamKey;
    this.name = stream.name;
  }
}

/**
 * A binding to a publisher based on its name or path within the given fields.
 */
class Input extends Binding {
  private readonly keyPath: Array<string>;
  private readonly publisher: Publisher;

  constructor(input: Abstract.Input, fields: Record<string, Field>) {
    super();

    this.keyPath = input.keyPath;

    const keyPath = [...this.keyPath];

    const getNextKey = () => {
      const key = keyPath.shift();

      if (!key) {
        throw new ViewScriptException(
          `Cannot dereference invalid keyPath \`${input.keyPath}\``
        );
      }

      return key;
    };

    let nextMember: Publisher | Subscriber = fields[getNextKey()];

    while (keyPath.length > 0) {
      if (
        typeof nextMember !== "object" ||
        nextMember === null ||
        !(nextMember instanceof Field)
      ) {
        break;
      }

      nextMember = nextMember.getMember(getNextKey());
    }

    if (
      typeof nextMember !== "object" ||
      nextMember === null ||
      !(nextMember instanceof Publisher)
    ) {
      throw new ViewScriptException(
        `Cannot dereference invalid keyPath \`${input.keyPath}\``
      );
    }

    this.publisher = nextMember;
    this.publisher.subscribe(this);
  }
}

/**
 * A binding to a subscriber based on its name or path within the given fields.
 */
class Output extends Publisher implements Subscriber {
  private readonly argument?: Field;
  private readonly keyPath: Array<string>;
  private readonly subscriber: Subscriber;

  constructor(
    output: Abstract.Output,
    terrain: Record<string, Field | Stream>
  ) {
    super();

    this.argument = output.argument && Field.create(output.argument);
    this.keyPath = output.keyPath;

    const keyPath = [...this.keyPath];

    const getNextKey = () => {
      const key = keyPath.shift();

      if (!key) {
        throw new ViewScriptException(
          `Cannot dereference invalid keyPath \`${output.keyPath}\``
        );
      }

      return key;
    };

    let nextMember: Publisher | Subscriber = terrain[getNextKey()];

    while (keyPath.length > 0) {
      if (
        typeof nextMember !== "object" ||
        nextMember === null ||
        !(nextMember instanceof Field)
      ) {
        break;
      }

      nextMember = nextMember.getMember(getNextKey());
    }

    if (
      typeof nextMember !== "object" ||
      nextMember === null ||
      !("take" in nextMember)
    ) {
      throw new ViewScriptException(
        `Cannot dereference invalid keyPath \`${output.keyPath}\``
      );
    }

    this.subscriber = nextMember;
    this.subscribe(this.subscriber);
  }

  take() {
    // TODO see https://github.com/alexyuly/ViewScript-Runtime/issues/8
    // Consume the provided event from the publishing outlet.
    this.publish(this.argument?.getValue());
  }
}

/**
 * Forwards a value from a field, conditional, or input.
 */
class Inlet extends Binding {
  private readonly publisher: Publisher;

  constructor(inlet: Abstract.Inlet, fields: Record<string, Field>) {
    super();

    if (inlet.connection.kind === "field") {
      this.publisher = Field.create(inlet.connection);
    } else if (inlet.connection.kind === "conditional") {
      this.publisher = new Conditional(inlet.connection, fields);
    } else if (inlet.connection.kind === "input") {
      this.publisher = new Input(inlet.connection, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an inlet with connection of unknown kind "${
          (inlet.connection as { kind: unknown }).kind
        }"`
      );
    }

    this.publisher.subscribe(this);
  }
}

/**
 * Forwards a value to an output.
 */
class Outlet extends Binding {
  private readonly argument?: Field;
  private readonly subscriber: Subscriber;

  constructor(
    outlet: Abstract.Outlet,
    terrain: Record<string, Field | Stream>
  ) {
    super();

    this.argument =
      outlet.connection.argument && Field.create(outlet.connection.argument);

    if (outlet.connection.kind === "output") {
      this.subscriber = new Output(outlet.connection, terrain);
    } else {
      throw new ViewScriptException(
        `Cannot construct an outlet with connection of unknown kind "${
          (outlet.connection as { kind: unknown }).kind
        }"`
      );
    }

    this.subscribe(this.subscriber);
  }

  getArgumentValue() {
    return this.argument?.getValue();
  }
}

/**
 * Publishes a value from an HTML element's event to an outlet.
 */
class HtmlElementEventPublisher extends Publisher {
  constructor(element: HTMLElement, event: string, outlet: Outlet) {
    super();

    this.subscribe(outlet);

    Dom.listen(element, event, () => {
      this.publish(outlet.getArgumentValue());
    });
  }
}

/**
 * Provides properties to an HTML element or an instance of a view, and publishes it or its HTML element.
 */
class Element extends Binding<HTMLElement> {
  private children: Array<Element | string> = [];
  private readonly properties: Record<string, Inlet | Outlet> = {};
  private readonly viewKey: string;

  constructor(
    element: Abstract.Element,
    views: Record<string, Abstract.View>,
    terrain: Record<string, Field | Stream>
  ) {
    super();

    this.viewKey = element.viewKey;

    if (/^<[\w-.]+>$/g.test(this.viewKey)) {
      const tagName = this.viewKey.slice(1, this.viewKey.length - 1);
      const htmlElement = Dom.create(tagName);

      if (element.properties) {
        Object.entries(element.properties).forEach(
          ([propertyKey, property]) => {
            if (property.kind === "inlet") {
              const inlet = new Inlet(
                property,
                Object.entries(terrain).reduce<Record<string, Field>>(
                  (result, [featureKey, feature]) => {
                    if (feature instanceof Field) {
                      result[featureKey] = feature;
                    }
                    return result;
                  },
                  {}
                )
              );
              this.properties[propertyKey] = inlet;

              let take: (value: Abstract.Data) => void;

              if (propertyKey === "content") {
                take = (value) => {
                  this.children = [];

                  const htmlElementChildren: Array<HTMLElement | string> = [];
                  const populate = (child = value) => {
                    if (child instanceof Array) {
                      child.forEach(populate);
                    } else if (Abstract.isElement(child)) {
                      const elementChild = new Element(child, views, terrain);
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

              inlet.subscribe({ take });
            } else if (property.kind === "outlet") {
              const outlet = new Outlet(property, terrain);
              this.properties[propertyKey] = outlet;
              new HtmlElementEventPublisher(htmlElement, propertyKey, outlet);
            } else {
              throw new ViewScriptException(
                `Cannot construct a property of unknown kind "${
                  (property as { kind: unknown }).kind
                } for element of viewKey ${this.viewKey}"`
              );
            }
          }
        );
      }

      this.publish(htmlElement);
    } else if (this.viewKey in views) {
      const abstractView = views[this.viewKey];
      const view = new View(
        abstractView,
        views,
        { ...terrain },
        element.properties
      );
      view.subscribe(this);
      window.console.log(`[VSR] 🌻 Create ${abstractView.name}`, view);
    } else {
      throw new ViewScriptException(
        `Cannot construct an element of invalid viewKey \`${this.viewKey}\``
      );
    }
  }
}

/**
 * Provides properties to an element and publishes its HTML element.
 */
class View extends Binding<HTMLElement> {
  private readonly element: Element;
  private readonly terrain: Record<string, Field | Stream>;
  readonly name?: string;
  readonly viewKey: string;

  constructor(
    root: Abstract.View,
    children: Record<string, Abstract.View>,
    terrain: Record<string, Field | Stream>,
    properties?: Abstract.Element["properties"]
  ) {
    super();

    this.terrain = terrain;
    this.name = root.name;
    this.viewKey = root.viewKey;

    if (root.terrain) {
      Object.entries(root.terrain).forEach(([featureKey, feature]) => {
        this.terrain[featureKey] = Abstract.isField(feature)
          ? Field.create(feature)
          : new Stream(feature);
      });
    }

    if (properties) {
      Object.entries(properties).forEach(([propertyKey, property]) => {
        const feature = Object.values(this.terrain).find(
          (feature) => feature.name === propertyKey
        );

        if (feature === undefined) {
          throw new ViewScriptException(
            `Cannot construct a property for unknown feature name \`${propertyKey}\` for view of viewKey \`${this.viewKey}\``
          );
        }

        if (property.kind === "inlet") {
          if (feature instanceof Stream) {
            throw new ViewScriptException(
              `Cannot construct an inlet for stream name \`${propertyKey}\``
            );
          }

          if (feature.getValue() !== undefined) {
            throw new ViewScriptException(
              `Cannot construct an inlet for private field name \`${propertyKey}\``
            );
          }

          const inlet = new Inlet(
            property,
            Object.entries(this.terrain).reduce<Record<string, Field>>(
              (result, [featureKey, feature]) => {
                if (feature instanceof Field) {
                  result[featureKey] = feature;
                }
                return result;
              },
              {}
            )
          );
          inlet.subscribe(feature);
        } else if (property.kind === "outlet") {
          if (feature instanceof Field) {
            throw new ViewScriptException(
              `Cannot construct an outlet for field name \`${propertyKey}\``
            );
          }

          const outlet = new Outlet(property, this.terrain);
          feature.subscribe(outlet);
        } else {
          throw new ViewScriptException(
            `Cannot construct a property of unknown kind "${
              (property as { kind: unknown }).kind
            } for view of viewKey \`${this.viewKey}\`"`
          );
        }
      });
    }

    this.element = new Element(root.element, children, this.terrain);
    this.element.subscribe(this);
  }
}

/**
 * A special field that provides access to the window's console object.
 */
class Console extends Field {
  constructor() {
    super({ kind: "field", fieldKey: "console", modelKey: "Console" });

    this.defineAction("log", window.console.log);
  }
}

/**
 * A special field that provides access to the browser's window object.
 */
class Browser extends Field {
  constructor() {
    super({ kind: "field", fieldKey: "browser", modelKey: "Browser" });

    this.defineChild("console", new Console());
  }
}

/**
 * Starts an abstract app.
 * Provides the entry point for ViewScript-Bridge.
 */
export class RunningApp {
  private static readonly browser = new Browser();

  private readonly fields: Record<string, Field> = {
    browser: RunningApp.browser,
  };

  private readonly root: View;

  constructor(app: Abstract.App) {
    this.root = new View(app.root, app.views ?? {}, {
      ...this.fields,
    });

    this.root.subscribe({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}
