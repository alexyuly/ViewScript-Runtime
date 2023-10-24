import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";
import { Binding, Publisher, Store, Subscriber } from "./base";

export type Feature = Stream | Field | Method | Action;
export type Terrain = Record<string, Feature>;

export class ViewScriptError extends Error {}

export class RunningApp {
  private static readonly browser = new Browser();
  private readonly fields = { browser: RunningApp.browser };
  private readonly root: Atom | Organism;

  constructor(app: Abstract.App) {
    this.root = new Organism(app.root, app.members, { ...this.fields }, {});
    this.root.subscribe({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

class Field<ModelKey extends string = string> extends Binding<
  Abstract.Value<Abstract.Model<ModelKey>>
> {
  private readonly members: Record<string, Field | Method | Action>;

  private readonly publisher?:
    | Store<ModelKey>
    | Option<ModelKey>
    | FieldPointer<ModelKey>
    | MethodPointer<ModelKey>;

  constructor(
    field: Abstract.Field<Abstract.Model<ModelKey>>,
    terrain: Terrain
  ) {
    super();

    this.members = {};

    if (field.publisher) {
      if (field.publisher.kind === "store") {
        this.publisher = new Store(field.publisher);
      } else if (field.publisher.kind === "option") {
        this.publisher = new Option(field.publisher, terrain);
      } else if (field.publisher.kind === "fieldPointer") {
        this.publisher = new FieldPointer(field.publisher, terrain);
      } else if (field.publisher.kind === "methodPointer") {
        this.publisher = new MethodPointer(field.publisher, terrain);
      } else {
        throw new ViewScriptError(
          `Cannot construct a field with publisher of unknown kind "${
            (field.publisher as { kind: unknown }).kind
          }"`
        );
      }

      this.publisher.subscribe(this);
    }

    // TODO Implement the consumption of abstract models.

    // TODO Define base actions:
    // this.defineAction("reset", () => this.initialValue);
    // this.defineAction("setTo", (value) => value);
  }

  protected defineField(name: string, field: Field) {
    this.members[name] = field;
  }

  protected defineMethod(name: string, method: BasicMethod) {
    const methodMember = new Method(method, this.members);
    this.subscribe(methodMember);
    this.members[name] = methodMember;
  }

  protected defineAction(name: string, action: BasicAction) {
    const actionMember = new Action(action, this.members);
    actionMember.subscribe(this);
    this.members[name] = actionMember;
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptError(
        `Cannot get unknown member "${name}" of field "${this.key}"`
      );
    }

    return this.members[name];
  }
}

class Option<ModelKey extends string = string>
  extends Publisher<Abstract.Value<Abstract.Model<ModelKey>>>
  implements Subscriber<Abstract.Value<Abstract.Model<"Boolean">>>
{
  private readonly condition: Field<"Boolean">;
  private readonly result: Field;
  private readonly opposite?: Field;

  constructor(
    option: Abstract.Option<Abstract.Model<ModelKey>>,
    terrain: Terrain
  ) {
    super();

    this.result = new Field(option.result, terrain);
    this.opposite = new Field(option.opposite, terrain);

    this.condition = new Field<"Boolean">(option.condition, terrain);
    this.condition.subscribe(this);
  }

  take(value: Abstract.Value<Abstract.Model<"Boolean">>) {
    const nextValue = (value ? this.result : this.opposite)?.getValue();
    this.publish(nextValue ?? undefined);
  }
}

class FieldPointer<ModelKey extends string = string> extends Binding<
  Abstract.Value<Abstract.Model<ModelKey>>
> {
  private readonly field: Field<ModelKey>;
  private readonly fieldPath: Array<string>;

  constructor(
    fieldPointer: Abstract.FieldPointer<Abstract.Model<ModelKey>>,
    terrain: Terrain
  ) {
    super();

    this.fieldPath = fieldPointer.fieldPath;

    const fieldPath = [...this.fieldPath];

    const getNextKey = () => {
      const key = fieldPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct a pointer to unknown field at path: ${fieldPointer.fieldPath}`
        );
      }

      return key;
    };

    let nextFeature: Feature = terrain[getNextKey()];

    while (fieldPath.length > 0) {
      if (!(nextFeature instanceof Field)) {
        break;
      }

      nextFeature = nextFeature.getMember(getNextKey());
    }

    if (!(nextFeature instanceof Field)) {
      throw new ViewScriptError(
        `Cannot construct a pointer to unknown field at path: ${fieldPointer.fieldPath}`
      );
    }

    this.field = nextFeature;
    this.field.subscribe(this);
  }
}

// TODO Should I handle higher-order methods?
class MethodPointer<ModelKey extends string = string>
  extends Binding<Abstract.Value<Abstract.Model<ModelKey>>>
  implements Subscriber<void>
{
  private readonly argument?: Field;
  private readonly continuation?: FieldPointer | MethodPointer;
  private readonly method: Method;
  private readonly methodPath: Array<string>;

  constructor(methodPointer: Abstract.MethodPointer, terrain: Terrain) {
    super();

    this.methodPath = methodPointer.methodPath;

    const methodPath = [...this.methodPath];

    const getNextKey = () => {
      const key = methodPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct a pointer to method at unknown path: "${methodPointer.methodPath}"`
        );
      }

      return key;
    };

    let nextFeature: Feature = terrain[getNextKey()];

    while (methodPath.length > 0) {
      if (!(nextFeature instanceof Field)) {
        break;
      }

      nextFeature = nextFeature.getMember(getNextKey());
    }

    if (!(nextFeature instanceof Method)) {
      throw new ViewScriptError(
        `Cannot construct a method reference of unknown path to method key "${methodPointer.methodPath}"`
      );
    }

    this.argument = Abstract.isDataSource(methodPointer.argument)
      ? new Field(methodPointer.argument, terrain)
      : undefined;

    this.method = nextFeature;

    this.continuation = this.method.connect(
      this,
      terrain,
      this.argument,
      methodPointer.continuation
    );
  }

  take() {
    const nextValue = this.method.call(this.argument?.getValue() ?? null);

    if (nextValue !== undefined) {
      this.publish(nextValue);
    }
  }
}

class Method<ModelKey extends string = string> extends Binding<
  Abstract.Value<Abstract.Model<ModelKey>>
> {
  private readonly method: BasicMethod | Abstract.Method;
  private readonly terrain: Terrain;

  constructor(method: BasicMethod | Abstract.Method, terrain: Terrain) {
    super();

    this.method = method;
    this.terrain = terrain;
  }

  call(argument: Abstract.Value) {
    if (typeof this.method !== "function") {
      throw new ViewScriptError(`An abstract method cannot be called.`);
    }

    const nextValue = this.method(argument);

    return nextValue;
  }

  connect(
    methodPointer: MethodPointer,
    terrain: Terrain,
    argument?: Field,
    abstractContinuation?: Abstract.MethodPointer["continuation"]
  ): FieldPointer | MethodPointer | undefined {
    if (typeof this.method === "function") {
      this.subscribe(methodPointer);
      return;
    }

    const stepTerrain = { ...this.terrain, ...terrain };

    if (this.method.parameter !== undefined && argument !== undefined) {
      const parameter = Field.create(this.method.parameter);
      argument.subscribe(parameter);
      stepTerrain[parameter.key] = parameter;
    }

    const result = new Field(this.method.result, stepTerrain);

    if (abstractContinuation) {
      const continuation = Abstract.isFieldReference(abstractContinuation)
        ? new FieldPointer(abstractContinuation, terrain) // TODO Replace terrain with method result's members
        : new MethodPointer(abstractContinuation, terrain); // TODO Replace terrain with method result's members

      continuation.subscribe(result);
      result.subscribe(continuation);

      return continuation;
    }

    result.subscribe(methodPointer);
  }
}

class Action<ModelKey extends string = string> extends Binding<
  Abstract.Value<Abstract.Model<ModelKey>>
> {
  private readonly action: BasicAction | Abstract.Action;
  private readonly terrain: Terrain;

  constructor(action: BasicAction | Abstract.Action, terrain: Terrain) {
    super();

    this.action = action;
    this.terrain = terrain;
  }

  connect(actionPointer: ActionPointer, terrain: Terrain, argument?: Field) {
    if (typeof this.action === "function") {
      actionPointer.subscribe(this);
      return;
    }

    const stepTerrain = { ...this.terrain, ...terrain };

    if (this.action.parameter !== undefined && argument !== undefined) {
      const parameter = Field.create(this.action.parameter);
      argument.subscribe(parameter);
      stepTerrain[parameter.key] = parameter;
    }

    const steps: Array<ActionPointer | StreamPointer> = this.action.steps.map(
      (step) => {
        if (Abstract.isActionReference(step)) {
          return new ActionPointer(step, stepTerrain);
        }

        if (Abstract.isStreamReference(step)) {
          return new StreamPointer(step, stepTerrain);
        }

        throw new ViewScriptError("Sorry, exceptions are not yet implemented."); // TODO implement
      }
    );

    actionPointer.subscribe({
      take: () => {
        steps.forEach((step) => {
          step.take();
        });
      },
    });
  }

  take(value: Abstract.Value) {
    if (typeof this.action !== "function") {
      throw new ViewScriptError(`An abstract action cannot take values.`);
    }

    const nextValue = this.action(value);

    if (nextValue !== undefined) {
      this.publish(nextValue);
    }
  }
}

class ActionPointer<ModelKey extends string = string>
  extends Publisher<Abstract.Value<Abstract.Model<ModelKey>>>
  implements Subscriber<void>
{
  private readonly action: Action;
  private readonly actionPath: Array<string>;
  private readonly argument?: Field;

  constructor(actionPointer: Abstract.ActionPointer, terrain: Terrain) {
    super();

    this.actionPath = actionPointer.actionPath;

    const actionPath = [...this.actionPath];

    const getNextKey = () => {
      const key = actionPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct an action reference of unknown path to action key "${actionPointer.actionPath}"`
        );
      }

      return key;
    };

    let nextFeature: Feature = terrain[getNextKey()];

    while (actionPath.length > 0) {
      if (!(nextFeature instanceof Field)) {
        break;
      }

      nextFeature = nextFeature.getMember(getNextKey());
    }

    if (!(nextFeature instanceof Action)) {
      throw new ViewScriptError(
        `Cannot construct an action reference of unknown path to action key "${actionPointer.actionPath}"`
      );
    }

    this.argument = Abstract.isDataSource(actionPointer.argument)
      ? new Field(actionPointer.argument, terrain)
      : undefined;

    this.action = nextFeature;
    this.action.connect(this, terrain, this.argument);
  }

  take() {
    const nextValue = this.argument?.getValue();
    this.publish(nextValue ?? null);
  }
}

class StreamPointer<ModelKey extends string = string>
  extends Publisher<Abstract.Value<Abstract.Model<ModelKey>>>
  implements Subscriber<void>
{
  private readonly argument?: Field;
  private readonly streamName: string;
  private readonly stream: Stream;

  constructor(streamPointer: Abstract.StreamPointer, terrain: Terrain) {
    super();

    if (streamPointer.argument) {
      this.argument = new Field(streamPointer.argument, terrain);
    }

    this.streamName = streamPointer.streamName;

    let nextFeature = terrain[this.streamName];

    if (!(nextFeature instanceof Stream)) {
      throw new ViewScriptError(
        `Cannot construct a pointer to unknown stream "${streamPointer.streamName}"`
      );
    }

    this.stream = nextFeature;
    this.subscribe(this.stream);
  }

  take() {
    const nextValue = this.argument?.getValue();
    this.publish(nextValue ?? null);
  }
}

class Stream extends Binding<Abstract.Value> {
  readonly key: string;

  constructor(stream: Abstract.Stream) {
    super();

    this.key = stream.key;
  }
}

class Renderable extends Binding<HTMLElement> {
  private readonly body: Atom | Organism;

  constructor(
    renderable: Abstract.Renderable,
    appMembers: Record<string, Abstract.Model | Abstract.View>,
    terrain: Terrain
  ) {
    super();

    if ("tagName" in renderable.body) {
      this.body = new Atom(
        renderable.body.tagName,
        appMembers,
        terrain,
        renderable.body.properties
      );
      this.body.subscribe(this);
    } else {
      const member = appMembers[renderable.body.viewName];

      if (member.kind !== "view") {
        throw new ViewScriptError(
          `Cannot construct unknown view "${renderable.body.viewName}"`
        );
      }

      this.body = new Organism(
        member,
        appMembers,
        { ...terrain },
        renderable.body.properties
      );
      this.body.subscribe(this);
    }
  }
}

class Atom extends Publisher<HTMLElement> {
  private children: Array<Renderable | string>;
  private readonly properties: Record<string, Action | Field>;
  private readonly tagName: string;
  private readonly terrain: Terrain;

  constructor(
    tagName: string,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Renderable["properties"]
  ) {
    super();

    this.children = [];
    this.properties = {};
    this.tagName = tagName;
    this.terrain = terrain;

    const htmlElement = Dom.create(tagName);

    Object.entries(properties).forEach(([propertyKey, property]) => {
      if (Abstract.isDataSource(property)) {
        const dataSource = new Field(property, this.terrain);

        let take: (value: Abstract.Value) => void;

        if (propertyKey === "content") {
          take = (value) => {
            this.children = [];

            const htmlElementChildren: Array<HTMLElement | string> = [];
            const populate = (child: Abstract.Field) => {
              if (child instanceof Array) {
                child.forEach(populate);
              } else if (Abstract.isElement(child)) {
                const elementChild = new Renderable(
                  child,
                  branches,
                  this.terrain
                );
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
                const fieldPointer = new FieldPointer(child, this.terrain);
                fieldPointer.subscribe({
                  take: populate,
                });
              } else if (Abstract.isMethodReference(child)) {
                const methodPointer = new MethodPointer(child, this.terrain);
                methodPointer.subscribe({
                  take: populate,
                });
              } else if (Abstract.isConditionalData(child)) {
                const option = new Option(child, this.terrain);
                option.subscribe({
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
        const sideEffect = new Action(property, terrain);

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

class Organism extends Binding<HTMLElement> {
  private readonly key: string;

  private readonly element: Renderable;
  private readonly properties: Record<string, Action | Field>;
  private readonly terrain: Terrain;

  constructor(
    root: Abstract.View,
    branches: Record<string, Abstract.View | Abstract.Model>,
    terrain: Terrain,
    properties: Abstract.Renderable["properties"]
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
        (feature) =>
          (feature instanceof Stream || feature instanceof Field) &&
          feature.key === propertyKey
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

        const dataSource = new Field(property, this.terrain);
        dataSource.subscribe(feature);
        this.properties[propertyKey] = dataSource;
      } else if (Abstract.isSideEffect(property)) {
        if (feature instanceof Field) {
          throw new ViewScriptError(
            `Cannot construct a side effect for field name \`${propertyKey}\``
          );
        }

        const sideEffect = new Action(property, this.terrain);
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

    this.element = new Renderable(root.element, branches, this.terrain);
    this.element.subscribe(this);
  }
}
