import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

// Convenient type aliases

type Terrain = Record<string, Field | Stream>;

// Errors that may occur during initialization

class ViewScriptError extends Error {}

class FieldUnknownModelKeyError extends ViewScriptError {
  constructor(field: Abstract.Field) {
    super(
      `Cannot construct a field of unknown model key \`${field.modelKey}\``
    );
  }
}

class FieldUnknownMemberError extends ViewScriptError {
  constructor(field: Abstract.Field, name: string) {
    super(
      `Cannot get member \`${name}\` of \`${field.modelKey}\` field \`${field.key}\``
    );
  }
}

// Publish/subscribe framework

interface Subscriber<T = unknown> {
  take(value: T): void;
}

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
 * This is useful for classes to forward values while managing other duties.
 */
abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  take(value: T) {
    this.publish(value);
  }
}

// Concrete representations of abstract types

/**
 * Forwards a value from a field, conditional, or input.
 */
class DataSource extends Binding<Abstract.Value> {
  private readonly publisher: Publisher<Abstract.Value>;

  constructor(dataSource: Abstract.DataSource, terrain: Terrain) {
    super();

    if (Abstract.isValue(dataSource)) {
      this.publisher = new Value(dataSource);
    } else if (Abstract.isFieldReference(dataSource)) {
      this.publisher = new FieldReference(dataSource, terrain);
    } else if (Abstract.isConditionalData(dataSource)) {
      this.publisher = new ConditionalData(dataSource, terrain);
    } else {
      throw new ViewScriptError(
        `Cannot construct a data source of unknown kind \`${
          typeof dataSource === "object" && dataSource !== null
            ? (dataSource as { kind: unknown }).kind
            : dataSource
        }\``
      );
    }

    this.publisher.subscribe(this);
  }
}

/**
 * Publishes a constant value to subscribers.
 */
class Value<T extends Abstract.Value> extends Publisher<T> {
  constructor(value: T) {
    super();

    this.publish(value);
  }
}

/**
 * Provides properties to an atom or a view, and publishes it or its HTML element.
 */
class Element extends Binding<HTMLElement> {
  private readonly publisher: Publisher<HTMLElement>;

  constructor(
    element: Abstract.Element,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain
  ) {
    super();

    if (/^<[\w-.]+>$/g.test(element.viewKey)) {
      const tagName = element.viewKey.slice(1, element.viewKey.length - 1);

      this.publisher = new Atom(tagName, branches, terrain, element.properties);
      this.publisher.subscribe(this);
    } else {
      const branch = branches[element.viewKey];

      if (!Abstract.isView(branch)) {
        throw new ViewScriptError(
          `Cannot construct an element of invalid view key \`${element.viewKey}\``
        );
      }

      this.publisher = new View(
        branch,
        branches,
        { ...terrain },
        element.properties
      );
      this.publisher.subscribe(this);
    }
  }
}

/**
 * A binding to a publisher based on its name or path within the given fields.
 */
class FieldReference extends Binding<Abstract.Value> {
  private readonly pathToFieldKey: Array<string>;
  private readonly publisher: Publisher;

  constructor(fieldReference: Abstract.FieldReference, terrain: Terrain) {
    super();

    this.pathToFieldKey = fieldReference.pathToFieldKey;

    const pathToFieldKey = [...this.pathToFieldKey];

    const getNextKey = () => {
      const key = pathToFieldKey.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot dereference invalid path to field key \`${fieldReference.pathToFieldKey}\``
        );
      }

      return key;
    };

    let nextMember: Publisher | Subscriber = terrain[getNextKey()];

    while (pathToFieldKey.length > 0) {
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
      throw new ViewScriptError(
        `Cannot dereference invalid path to field key \`${fieldReference.pathToFieldKey}\``
      );
    }

    this.publisher = nextMember;
    this.publisher.subscribe(this);
  }
}

/**
 * Forwards values of a specific type.
 * Allows the definition of sub-fields, actions, and methods.
 */
class Field<
  ModelKey extends string = string,
  T extends Abstract.Value = Abstract.Value,
> extends Binding<T> {
  private readonly abstract: Abstract.Field;
  private readonly members: Record<string, Publisher | Subscriber> = {};

  constructor(field: Abstract.Field<ModelKey, T>) {
    super();

    this.abstract = field;
    const initialValue = field.value;

    if (initialValue !== undefined) {
      this.take(initialValue);
    }

    this.defineAction("reset", () => initialValue);
    this.defineAction("setTo", (value: T) => value);
  }

  static create(field: Abstract.Field): Field {
    if (Abstract.isBooleanField(field)) {
      return new BooleanField(field);
    }

    if (Abstract.isNumberField(field)) {
      return new NumberField(field);
    }

    if (Abstract.isStringField(field)) {
      return new StringField(field);
    }

    if (Abstract.isElementField(field)) {
      return new ElementField(field);
    }

    if (Abstract.isArrayField(field)) {
      return new ArrayField(field);
    }

    if (Abstract.isStructureField(field)) {
      return new StructureField(field);
    }

    throw new FieldUnknownModelKeyError(field);
  }

  protected defineAction<Argument extends Abstract.Value>(
    name: string,
    reducer: (argument: Argument) => T | void
  ) {
    this.members[name] = {
      take: (event: Argument) => {
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
      throw new FieldUnknownMemberError(this.abstract, name);
    }

    return this.members[name];
  }

  protected publish(value: T) {
    if (this.abstract.key !== undefined) {
      window.console.log(
        `[VSR] ⛰️ Set ${this.abstract.modelKey} field ${this.abstract.key} =`,
        value
      );
    }

    super.publish(value);
  }
}

/**
 * A field that stores a boolean.
 */
class BooleanField extends Field<"Boolean", boolean> {
  constructor(field: Abstract.BooleanField) {
    super(field);

    this.defineAction("disable", () => false);
    this.defineAction("enable", () => true);
    this.defineAction("toggle", () => !this.getValue());
  }
}

/**
 * A field that stores a number.
 */
class NumberField extends Field<"Number", number> {
  constructor(field: Abstract.NumberField) {
    super(field);

    this.defineAction(
      "add",
      (amount: number) => Number(this.getValue() || 0) + Number(amount || 0)
    );
    this.defineAction(
      "multiplyBy",
      (amount: number) => Number(this.getValue() || 0) * Number(amount || 0)
    );
    // this.defineMethod(
    //   "isAtLeast",
    //   (amount: number): boolean => (this.getValue() ?? 0) >= amount
    // );
  }
}

/**
 * A field that stores a string.
 */
class StringField extends Field<"String", string> {
  constructor(field: Abstract.StringField) {
    super(field);
  }
}

/**
 * A field that stores a structure of the given model.
 */
class StructureField<ModelKey extends string = string> extends Field<
  ModelKey,
  Abstract.Structure
> {
  constructor(field: Abstract.StructureField<ModelKey>) {
    super(field);
  }
}

/**
 * A field that stores an element.
 */
class ElementField extends Field<"Element", Abstract.Element> {
  constructor(field: Abstract.ElementField) {
    super(field);
  }
}

/**
 * A field that stores an array.
 */
class ArrayField extends Field<"Array", Array<Abstract.DataSource>> {
  constructor(field: Abstract.ArrayField) {
    super(field);

    this.defineAction(
      "push",
      (item) =>
        (this.getValue() || []).concat?.(
          item instanceof Array ? [item] : item
        ) || [item]
    );
  }
}

// TODO Implement methods.

/**
 * Forwards either a positive or negative value based on a condition.
 */
class ConditionalData extends Binding<Abstract.Value> {
  private readonly when: DataSource;
  private readonly then: DataSource;
  private readonly else?: DataSource;

  constructor(conditionalData: Abstract.ConditionalData, terrain: Terrain) {
    super();

    this.then = new DataSource(conditionalData.then, terrain);

    if (conditionalData.else) {
      this.else = new DataSource(conditionalData.else, terrain);
    }

    this.when = new DataSource(conditionalData.when, terrain);
    this.when.subscribe(this);
  }

  take(value: Abstract.Value) {
    const nextValue = (value ? this.then : this.else)?.getValue();

    this.publish(nextValue ?? null);
  }
}

/**
 * Forwards a value to an output.
 */
class SideEffect extends Binding {
  private readonly argument?: Field;
  private readonly subscriber: Subscriber;

  constructor(sideEffect: Abstract.SideEffect, terrain: Terrain) {
    super();

    if (sideEffect.argument) {
      this.argument = new DataSource(sideEffect.argument, terrain);
    }

    if (sideEffect.connection.kind === "output") {
      this.subscriber = new StreamReference(sideEffect.connection, terrain);
    } else {
      throw new ViewScriptError(
        `Cannot construct an outlet with connection of unknown kind "${
          (sideEffect.connection as { kind: unknown }).kind
        }"`
      );
    }

    this.subscribe(this.subscriber);
  }

  getArgumentValue() {
    return this.argument?.getValue();
  }
}

// TODO Implement actions.

/**
 * A binding to a subscriber based on its name or path within the given fields.
 */
class StreamReference extends Publisher implements Subscriber {
  private readonly argument?: DataSource;
  private readonly streamKey: string;
  private readonly subscriber: Subscriber;

  constructor(streamReference: Abstract.StreamReference, terrain: Terrain) {
    super();

    if (streamReference.argument) {
      this.argument = new DataSource(streamReference.argument, terrain);
    }

    this.streamKey = streamReference.streamKey;

    let nextMember: Publisher | Subscriber = terrain[this.streamKey];

    if (
      typeof nextMember !== "object" ||
      nextMember === null ||
      !("take" in nextMember)
    ) {
      throw new ViewScriptError(
        `Cannot dereference invalid stream key \`${streamReference.streamKey}\``
      );
    }

    this.subscriber = nextMember;
    this.subscribe(this.subscriber);
  }

  take() {
    this.publish(this.argument?.getValue());
  }
}

/**
 * Forwards events from child to parent components.
 */
class Stream extends Binding<Abstract.Value> {
  readonly key: string;

  constructor(stream: Abstract.Stream) {
    super();

    this.key = stream.key;
  }
}

/**
 * Provides properties to an HTML element and publishes it.
 */
class Atom extends Publisher<HTMLElement> {
  private children: Array<Element | string> = [];
  private readonly properties: Record<string, DataSource | SideEffect> = {};
  private readonly tagName: string;
  private readonly terrain: Terrain;

  constructor(
    tagName: string,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Element["properties"]
  ) {
    super();

    this.terrain = terrain;
    this.tagName = tagName;

    const htmlElement = Dom.create(tagName);

    Object.entries(properties).forEach(([propertyKey, property]) => {
      if (Abstract.isDataSource(property)) {
        const dataSource = new DataSource(property, this.terrain);

        let take: (value: Abstract.Value) => void;

        if (propertyKey === "content") {
          take = (value) => {
            this.children = [];

            const htmlElementChildren: Array<HTMLElement | string> = [];
            const populate = (child: Abstract.DataSource) => {
              if (child instanceof Array) {
                child.forEach(populate);
              } else if (Abstract.isElement(child)) {
                // TODO account for elements that aren't values
                const elementChild = new Element(child, branches, this.terrain);
                this.children.push(elementChild);
                elementChild.subscribe({
                  take: (htmlElementChild) => {
                    htmlElementChildren.push(htmlElementChild);
                  },
                });
              } else if (child !== null && child !== undefined) {
                // TODO account for strings that aren't values
                const textContent = String(child);
                this.children.push(textContent);
                htmlElementChildren.push(textContent);
              }
            };

            populate(value);
            Dom.populate(htmlElement, htmlElementChildren);
          };
        } else if (Style.supports(propertyKey)) {
          take = (value) => {
            Dom.styleProp(htmlElement, propertyKey, value);
          };
        } else {
          take = (value) => {
            Dom.attribute(htmlElement, propertyKey, value);
          };
        }

        dataSource.subscribe({ take });
        this.properties[propertyKey] = dataSource;
      } else if (Abstract.isSideEffect(property)) {
        const outlet = new SideEffect(property, terrain);

        new (class AtomicEventPublisher extends Publisher {
          constructor() {
            super();

            this.subscribe(outlet);

            Dom.listen(htmlElement, propertyKey, () => {
              this.publish(outlet.getArgumentValue());
            });
          }
        })();

        this.properties[propertyKey] = outlet;
      } else {
        throw new ViewScriptError(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
          } for atom of tagName ${this.tagName}"`
        );
      }
    });

    this.publish(htmlElement);
  }
}

/**
 * Provides properties to an element and publishes its HTML element.
 */
class View extends Binding<HTMLElement> {
  private readonly key: string;

  private readonly element: Element;
  private readonly properties: Record<string, DataSource | SideEffect> = {};
  private readonly terrain: Terrain;

  constructor(
    root: Abstract.View,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Element["properties"]
  ) {
    super();

    this.key = root.key;
    this.terrain = terrain;

    Object.entries(root.terrain).forEach(([featureKey, feature]) => {
      this.terrain[featureKey] = Abstract.isField(feature)
        ? Field.create(feature)
        : new Stream(feature);
    });

    Object.entries(properties).forEach(([propertyKey, property]) => {
      const feature = Object.values(this.terrain).find(
        (feature) => feature.key === propertyKey
      );

      if (feature === undefined) {
        throw new ViewScriptError(
          `Cannot construct a property for unknown feature name \`${propertyKey}\` for view of key \`${this.key}\``
        );
      }

      if (property.kind === "inlet") {
        if (feature instanceof Stream) {
          throw new ViewScriptError(
            `Cannot construct an inlet for stream name \`${propertyKey}\``
          );
        }

        if (feature.getValue() !== undefined) {
          throw new ViewScriptError(
            `Cannot construct an inlet for private field name \`${propertyKey}\``
          );
        }

        const inlet = new DataSource(property, Object.entries(this.terrain));
        inlet.subscribe(feature);
        this.properties[propertyKey] = inlet;
      } else if (property.kind === "outlet") {
        if (feature instanceof Field) {
          throw new ViewScriptError(
            `Cannot construct an outlet for field name \`${propertyKey}\``
          );
        }

        const outlet = new SideEffect(property, this.terrain);
        feature.subscribe(outlet);
        this.properties[propertyKey] = outlet;
      } else {
        throw new ViewScriptError(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
          } for view of key \`${this.key}\`"`
        );
      }
    });

    this.element = new Element(root.element, branches, this.terrain);
    this.element.subscribe(this);
  }
}

/**
 * A special field that provides access to the window's console object.
 */
class Console extends Field {
  constructor() {
    super({ kind: "field", key: "console", modelKey: "Console" });

    this.defineAction("log", window.console.log);
  }
}

/**
 * A special field that provides access to the browser's window object.
 */
class Browser extends Field {
  constructor() {
    super({ kind: "field", key: "browser", modelKey: "Browser" });

    this.defineChild("console", new Console());
  }
}

/**
 * Starts an abstract app.
 * Provides the entry point for ViewScript-Bridge.
 */
export class RunningApp {
  private static readonly browser = new Browser();
  private readonly fields = { browser: RunningApp.browser };
  private readonly root: View;

  constructor(app: Abstract.App) {
    this.root = new View(app.root, app.branches, { ...this.fields }, {});
    this.root.subscribe({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}
