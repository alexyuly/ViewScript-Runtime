import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

// Errors that may occur during initialization

class ViewScriptError extends Error {}

class DataSourceConstructionError extends ViewScriptError {
  constructor(something: unknown) {
    super(`Cannot construct invalid data source: ${something}`);
  }
}

class ElementConstructionError extends ViewScriptError {
  constructor(element: Abstract.Element) {
    super(
      `Cannot construct an element of unknown view key "${element.viewKey}"`
    );
  }
}

class FieldReferenceConstructionError extends ViewScriptError {
  constructor(fieldReference: Abstract.FieldReference) {
    super(
      `Cannot construct a field reference of unknown path to field key "${fieldReference.pathToFieldKey}"`
    );
  }
}

class FieldConstructionError extends ViewScriptError {
  constructor(field: Abstract.Field) {
    super(`Cannot construct a field of unknown model key "${field.modelKey}"`);
  }
}

class FieldUnknownMemberError extends ViewScriptError {
  constructor(field: Abstract.Field, name: string) {
    super(`Cannot get unknown member "${name}" of field "${field.key}"`);
  }
}

class SideEffectConstructionError extends ViewScriptError {
  constructor(something: unknown) {
    super(`Cannot construct invalid side effect: ${something}`);
  }
}

class ActionReferenceConstructionError extends ViewScriptError {
  constructor(actionReference: Abstract.ActionReference) {
    super(
      `Cannot construct an action reference of unknown path to action key "${actionReference.pathToActionKey}"`
    );
  }
}

class StreamReferenceConstructionError extends ViewScriptError {
  constructor(streamReference: Abstract.StreamReference) {
    super(
      `Cannot construct a stream reference of unknown stream key "${streamReference.streamKey}"`
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

// Convenient type aliases

type Terrain = Record<string, Field | Stream>;

// Concrete representations of abstract types

class DataSource extends Binding<Abstract.Value> {
  private readonly publisher: Publisher<Abstract.Value>;

  constructor(dataSource: Abstract.DataSource, terrain: Terrain) {
    super();

    if (Abstract.isValue(dataSource)) {
      this.publisher = new Value(dataSource);
    } else if (Abstract.isFieldReference(dataSource)) {
      this.publisher = new FieldReference(dataSource, terrain);
    } else if (Abstract.isMethodReference(dataSource)) {
      throw new ViewScriptError("Sorry, methods are not yet implemented."); // TODO implement
    } else if (Abstract.isConditionalData(dataSource)) {
      this.publisher = new ConditionalData(dataSource, terrain);
    } else {
      throw new DataSourceConstructionError(dataSource);
    }

    this.publisher.subscribe(this);
  }
}

class Value<T extends Abstract.Value> extends Publisher<T> {
  constructor(value: T) {
    super();

    this.publish(value);
  }
}

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
        throw new ElementConstructionError(element);
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

class FieldReference extends Binding<Abstract.Value> {
  private readonly field: Field;
  private readonly pathToFieldKey: Array<string>;

  constructor(fieldReference: Abstract.FieldReference, terrain: Terrain) {
    super();

    this.pathToFieldKey = fieldReference.pathToFieldKey;

    const pathToFieldKey = [...this.pathToFieldKey];

    const getNextKey = () => {
      const key = pathToFieldKey.shift();

      if (!key) {
        throw new FieldReferenceConstructionError(fieldReference);
      }

      return key;
    };

    let nextMember: Field | Subscriber = terrain[getNextKey()];

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
      !(nextMember instanceof Field)
    ) {
      throw new FieldReferenceConstructionError(fieldReference);
    }

    this.field = nextMember;
    this.field.subscribe(this);
  }
}

abstract class Field<
  ModelKey extends string = string,
  T extends Abstract.Value = Abstract.Value,
> extends Binding<T> {
  readonly key: string;

  private readonly abstract: Abstract.Field<ModelKey, T>;
  private readonly initialValue?: T;
  private readonly members: Record<string, Field | Subscriber>; // TODO add Method to type union
  private readonly modelKey: ModelKey;

  constructor(field: Abstract.Field<ModelKey, T>) {
    super();

    this.key = field.key;

    this.abstract = field;
    this.initialValue = field.initialValue;
    this.members = {};
    this.modelKey = field.modelKey;

    if (this.initialValue !== undefined) {
      this.take(this.initialValue);
    }

    this.defineAction("reset", () => this.initialValue);
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

    // TODO pass in terrain to new ArrayField
    if (Abstract.isArrayField(field)) {
      return new ArrayField(field);
    }

    // TODO pass in terrain to new StructureField
    if (Abstract.isStructureField(field)) {
      return new StructureField(field);
    }

    throw new FieldConstructionError(field);
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

  protected defineField(name: string, field: Field) {
    this.members[name] = field;
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new FieldUnknownMemberError(this.abstract, name);
    }

    return this.members[name];
  }

  protected publish(value: T) {
    if (this.key !== undefined) {
      window.console.log(
        `[VSR] ⛰️ Set ${this.modelKey} field ${this.key} =`,
        value
      );
    }

    super.publish(value);
  }
}

class BooleanField extends Field<"Boolean", boolean> {
  constructor(field: Abstract.BooleanField) {
    super(field);

    this.defineAction("disable", () => false);
    this.defineAction("enable", () => true);
    this.defineAction("toggle", () => !this.getValue());
  }
}

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

class StringField extends Field<"String", string> {
  constructor(field: Abstract.StringField) {
    super(field);
  }
}

class StructureField<ModelKey extends string = string> extends Field<
  ModelKey,
  Abstract.Structure
> {
  constructor(field: Abstract.StructureField<ModelKey>) {
    super(field);
  }
}

class ElementField extends Field<"Element", Abstract.Element> {
  constructor(field: Abstract.ElementField) {
    super(field);
  }
}

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

class SideEffect extends Binding<Abstract.Value> {
  private readonly subscriber: Subscriber<Abstract.Value>;

  constructor(sideEffect: Abstract.SideEffect, terrain: Terrain) {
    super();

    if (Abstract.isAction(sideEffect)) {
      this.subscriber = new Action(sideEffect, terrain);
    } else if (Abstract.isActionReference(sideEffect)) {
      this.subscriber = new ActionReference(sideEffect, terrain);
    } else if (Abstract.isStreamReference(sideEffect)) {
      this.subscriber = new StreamReference(sideEffect, terrain);
    } else if (Abstract.isConditionalFork(sideEffect)) {
      throw new ViewScriptError(
        "Sorry, conditional forks are not yet implemented."
      ); // TODO implement
    } else {
      throw new SideEffectConstructionError(sideEffect);
    }

    this.subscribe(this.subscriber);
  }
}

class Action implements Subscriber<Abstract.Value> {
  private readonly parameter?: Field;
  private readonly steps: Array<ActionReference | StreamReference>;

  constructor(action: Abstract.Action, terrain: Terrain) {
    const stepTerrain = { ...terrain };

    if (action.parameter) {
      this.parameter = Field.create(action.parameter);
      stepTerrain[this.parameter.key] = this.parameter;
    }

    this.steps = action.steps.map((step) => {
      if (Abstract.isActionReference(step)) {
        return new ActionReference(step, terrain);
      }

      if (Abstract.isStreamReference(step)) {
        return new StreamReference(step, terrain);
      }

      throw new ViewScriptError(
        "Sorry, conditional forks are not yet implemented."
      ); // TODO implement
    });
  }

  take(value: Abstract.Value) {
    if (this.parameter) {
      this.parameter.take(value);
    }

    this.steps.forEach((step) => {
      step.take();
    });
  }
}

class ActionReference extends Binding<Abstract.Value> {
  private readonly action: Action;
  private readonly argument?: DataSource;
  private readonly pathToActionKey: Array<string>;

  constructor(actionReference: Abstract.ActionReference, terrain: Terrain) {
    super();

    if (actionReference.argument) {
      this.argument = new DataSource(actionReference.argument, terrain);
    }

    this.pathToActionKey = actionReference.pathToActionKey;

    const pathToFieldKey = [...this.pathToActionKey];

    const getNextKey = () => {
      const key = pathToFieldKey.shift();

      if (!key) {
        throw new ActionReferenceConstructionError(actionReference);
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
      !(nextMember instanceof Action)
    ) {
      throw new ActionReferenceConstructionError(actionReference);
    }

    this.action = nextMember;
    this.subscribe(this.action);
  }

  take() {
    const nextValue = this.argument?.getValue();

    this.publish(nextValue ?? null);
  }
}

class StreamReference extends Binding<Abstract.Value> {
  private readonly argument?: DataSource;
  private readonly streamKey: string;
  private readonly stream: Stream;

  constructor(streamReference: Abstract.StreamReference, terrain: Terrain) {
    super();

    if (streamReference.argument) {
      this.argument = new DataSource(streamReference.argument, terrain);
    }

    this.streamKey = streamReference.streamKey;

    let nextMember = terrain[this.streamKey];

    if (
      typeof nextMember !== "object" ||
      nextMember === null ||
      !(nextMember instanceof Stream)
    ) {
      throw new StreamReferenceConstructionError(streamReference);
    }

    this.stream = nextMember;
    this.subscribe(this.stream);
  }

  take() {
    const nextValue = this.argument?.getValue();

    this.publish(nextValue ?? null);
  }
}

class Stream extends Binding<Abstract.Value> {
  readonly key: string;
  private readonly parameter?: Field;

  constructor(stream: Abstract.Stream) {
    super();

    this.key = stream.key;

    if (stream.parameter) {
      this.parameter = Field.create(stream.parameter);
      this.parameter.subscribe(this);
    }
  }

  take(value: Abstract.Value) {
    if (this.parameter) {
      this.parameter.take(value);
    } else {
      this.publish(value);
    }
  }
}

// TODO Implement ConditionalFork.

class Atom extends Publisher<HTMLElement> {
  private children: Array<Element | string>;
  private readonly properties: Record<string, DataSource | SideEffect>;
  private readonly tagName: string;
  private readonly terrain: Terrain;

  constructor(
    tagName: string,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Element["properties"]
  ) {
    super();

    this.children = [];
    this.properties = {};
    this.tagName = tagName;
    this.terrain = terrain;

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
                const elementChild = new Element(child, branches, this.terrain);
                this.children.push(elementChild);
                elementChild.subscribe({
                  take: (htmlElementChild) => {
                    htmlElementChildren.push(htmlElementChild);
                  },
                });
              } else if (Abstract.isValue(child)) {
                const textContent = String(child); // TODO properly handle structures
                this.children.push(textContent);
                htmlElementChildren.push(textContent);
              } else if (Abstract.isFieldReference(child)) {
                const fieldReference = new FieldReference(child, this.terrain);
                fieldReference.subscribe({
                  take: populate,
                });
              } else if (Abstract.isMethodReference(child)) {
                throw new ViewScriptError("not implemented"); // TODO implement
              } else if (Abstract.isConditionalData(child)) {
                const conditionalData = new ConditionalData(
                  child,
                  this.terrain
                );
                conditionalData.subscribe({
                  take: populate,
                });
              } else {
                throw new ViewScriptError(); // TODO should never happen, but be defensive
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
        const sideEffect = new SideEffect(property, terrain);

        Dom.listen(htmlElement, propertyKey, () => {
          // TODO Transform Events into Abstract.Values, and pass them to sideEffect.take:
          sideEffect.take(null);
        });

        this.properties[propertyKey] = sideEffect;
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

class View extends Binding<HTMLElement> {
  private readonly key: string;

  private readonly element: Element;
  private readonly properties: Record<string, DataSource | SideEffect>;
  private readonly terrain: Terrain;

  constructor(
    root: Abstract.View,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Element["properties"]
  ) {
    super();

    this.key = root.key;

    this.properties = {};
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

      if (Abstract.isDataSource(property)) {
        if (feature instanceof Stream) {
          throw new ViewScriptError(
            `Cannot construct a data source for stream name \`${propertyKey}\``
          );
        }

        if (feature.getValue() !== undefined) {
          throw new ViewScriptError(
            `Cannot construct a data source for private field name \`${propertyKey}\``
          );
        }

        const dataSource = new DataSource(property, this.terrain);
        dataSource.subscribe(feature);
        this.properties[propertyKey] = dataSource;
      } else if (Abstract.isSideEffect(property)) {
        if (feature instanceof Field) {
          throw new ViewScriptError(
            `Cannot construct an sideEffect for field name \`${propertyKey}\``
          );
        }

        const sideEffect = new SideEffect(property, this.terrain);
        feature.subscribe(sideEffect);
        this.properties[propertyKey] = sideEffect;
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

// TODO Implement models.

class Console extends Field {
  constructor() {
    super({ kind: "field", key: "console", modelKey: "Console" });

    this.defineAction("log", window.console.log);
  }
}

class Browser extends Field {
  constructor() {
    super({ kind: "field", key: "browser", modelKey: "Browser" });

    this.defineField("console", new Console());
  }
}

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
