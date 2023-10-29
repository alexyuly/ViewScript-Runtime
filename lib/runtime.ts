import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Member = Stream | Field | Method | Action;
type Scope = Record<string, Member>;
type ValueOf<ModelName extends string> = Abstract.Value<Abstract.Model<ModelName>>;

interface Listener<T = unknown> {
  take(value: T): void;
}

abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Listener<T>> = [];

  protected publish(value: T) {
    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  listen(listener: Listener<T>) {
    this.listeners.push(listener);
  }
}

abstract class Binding<T = unknown> extends Publisher<T> implements Listener<T> {
  take(value: T) {
    this.publish(value);
  }
}

class ViewScriptError extends Error {}

class Stream extends Binding<Abstract.Value> {}

class Field<ModelName extends string = string> extends Binding<ValueOf<ModelName>> {
  private readonly members: Record<string, Field | Method | Action>;

  private readonly source:
    | Slot<ModelName>
    | Store<ModelName>
    | Option<ModelName>
    | FieldPointer<ModelName>
    | MethodPointer<ModelName>;

  constructor(
    field: Abstract.Field<Abstract.Model<ModelName>>,
    members: Record<string, Abstract.Model | Abstract.View>,
    scope: Scope,
  ) {
    super();

    this.members = {};

    if (field.source.kind === "store") {
      this.source = new Store(field.source);
    } else if (field.source.kind === "option") {
      this.source = new Option(field.source, scope);
    } else if (field.source.kind === "fieldPointer") {
      this.source = new FieldPointer(field.source, scope);
    } else if (field.source.kind === "methodPointer") {
      this.source = new MethodPointer(field.source, scope);
    } else {
      throw new ViewScriptError(
        `Cannot construct a field with source of unknown kind "${
          (field.source as { kind: unknown }).kind
        }"`,
      );
    }

    this.source.listen(this);

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
    this.listen(methodMember);
    this.members[name] = methodMember;
  }

  protected defineAction(name: string, action: BasicAction) {
    const actionMember = new Action(action, this.members);
    actionMember.listen(this);
    this.members[name] = actionMember;
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptError(`Cannot get unknown member "${name}" of field "${this.key}"`);
    }

    return this.members[name];
  }
}

class Method<ModelName extends string = string> extends Binding<ValueOf<ModelName>> {
  private readonly method: BasicMethod | Abstract.Method;
  private readonly scope: Scope;

  constructor(method: BasicMethod | Abstract.Method, scope: Scope) {
    super();

    this.method = method;
    this.scope = scope;
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
    scope: Scope,
    argument?: Field,
    abstractContinuation?: Abstract.MethodPointer["continuation"],
  ): FieldPointer | MethodPointer | undefined {
    if (typeof this.method === "function") {
      this.listen(methodPointer);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.method.parameter !== undefined && argument !== undefined) {
      const parameter = Field.create(this.method.parameter);
      argument.listen(parameter);
      stepTerrain[parameter.key] = parameter;
    }

    const result = new Field(this.method.result, stepTerrain);

    if (abstractContinuation) {
      const continuation = Abstract.isFieldReference(abstractContinuation)
        ? new FieldPointer(abstractContinuation, scope) // TODO Replace scope with method result's members
        : new MethodPointer(abstractContinuation, scope); // TODO Replace scope with method result's members

      continuation.listen(result);
      result.listen(continuation);

      return continuation;
    }

    result.listen(methodPointer);
  }
}

class Action<ModelName extends string = string> extends Binding<ValueOf<ModelName>> {
  private readonly action: BasicAction | Abstract.Action;
  private readonly scope: Scope;

  constructor(action: BasicAction | Abstract.Action, scope: Scope) {
    super();

    this.action = action;
    this.scope = scope;
  }

  connect(actionPointer: ActionPointer, scope: Scope, argument?: Field) {
    if (typeof this.action === "function") {
      actionPointer.listen(this);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.action.parameter !== undefined && argument !== undefined) {
      const parameter = Field.create(this.action.parameter);
      argument.listen(parameter);
      stepTerrain[parameter.key] = parameter;
    }

    const steps: Array<ActionPointer | StreamPointer> = this.action.steps.map((step) => {
      if (Abstract.isActionReference(step)) {
        return new ActionPointer(step, stepTerrain);
      }

      if (Abstract.isStreamReference(step)) {
        return new StreamPointer(step, stepTerrain);
      }

      throw new ViewScriptError("Sorry, exceptions are not yet implemented."); // TODO implement
    });

    actionPointer.listen({
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

class ActionPointer<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Listener<void>
{
  private readonly action: Action;
  private readonly actionPath: Array<string>;
  private readonly argument?: Field;

  constructor(actionPointer: Abstract.ActionPointer, scope: Scope) {
    super();

    this.actionPath = actionPointer.actionPath;

    const actionPath = [...this.actionPath];

    const getNextKey = () => {
      const key = actionPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct an action reference of unknown path to action key "${actionPointer.actionPath}"`,
        );
      }

      return key;
    };

    let nextMember: Member = scope[getNextKey()];

    while (actionPath.length > 0) {
      if (!(nextMember instanceof Field)) {
        break;
      }

      nextMember = nextMember.getMember(getNextKey());
    }

    if (!(nextMember instanceof Action)) {
      throw new ViewScriptError(
        `Cannot construct an action reference of unknown path to action key "${actionPointer.actionPath}"`,
      );
    }

    this.argument = Abstract.isDataSource(actionPointer.argument)
      ? new Field(actionPointer.argument, scope)
      : undefined;

    this.action = nextMember;
    this.action.connect(this, scope, this.argument);
  }

  take() {
    const nextValue = this.argument?.getValue();
    this.publish(nextValue ?? null);
  }
}

class StreamPointer<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Listener<void>
{
  private readonly argument?: Field;
  private readonly streamName: string;
  private readonly stream: Stream;

  constructor(streamPointer: Abstract.StreamPointer, scope: Scope) {
    super();

    if (streamPointer.argument) {
      this.argument = new Field(streamPointer.argument, scope);
    }

    this.streamName = streamPointer.streamName;

    let nextMember = scope[this.streamName];

    if (!(nextMember instanceof Stream)) {
      throw new ViewScriptError(
        `Cannot construct a pointer to unknown stream "${streamPointer.streamName}"`,
      );
    }

    this.stream = nextMember;
    this.listen(this.stream);
  }

  take() {
    const nextValue = this.argument?.getValue();
    this.publish(nextValue ?? null);
  }
}

class Slot<ModelName extends string = string> extends Binding<ValueOf<ModelName>> {
  // TODO -- copilot wrote this lol
  // private readonly field: Field<ModelName>;
  // constructor(slot: Abstract.Slot<Abstract.Model<ModelName>>, scope: Scope) {
  //   super();
  //   this.field = new Field(slot.field, scope);
  //   this.field.listen(this);
  // }
}

class Option<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Listener<ValueOf<"Boolean">>
{
  private readonly condition: Field<"Boolean">;
  private readonly result: Field;
  private readonly opposite?: Field;

  constructor(option: Abstract.Option<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.result = new Field(option.result, scope);
    this.opposite = new Field(option.opposite, scope);

    this.condition = new Field<"Boolean">(option.condition, scope);
    this.condition.listen(this);
  }

  take(value: ValueOf<"Boolean">) {
    const nextValue = (value ? this.result : this.opposite)?.getValue();
    this.publish(nextValue ?? undefined);
  }
}

class FieldPointer<ModelName extends string = string> extends Binding<ValueOf<ModelName>> {
  private readonly field: Field<ModelName>;
  private readonly fieldPath: Array<string>;

  constructor(fieldPointer: Abstract.FieldPointer<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.fieldPath = fieldPointer.fieldPath;

    const fieldPath = [...this.fieldPath];

    const getNextKey = () => {
      const key = fieldPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct a pointer to unknown field at path: ${fieldPointer.fieldPath}`,
        );
      }

      return key;
    };

    let nextMember: Member = scope[getNextKey()];

    while (fieldPath.length > 0) {
      if (!(nextMember instanceof Field)) {
        break;
      }

      nextMember = nextMember.getMember(getNextKey());
    }

    if (!(nextMember instanceof Field)) {
      throw new ViewScriptError(
        `Cannot construct a pointer to unknown field at path: ${fieldPointer.fieldPath}`,
      );
    }

    this.field = nextMember;
    this.field.listen(this);
  }
}

// TODO Should I handle higher-order methods?
class MethodPointer<ModelName extends string = string>
  extends Binding<ValueOf<ModelName>>
  implements Listener<void>
{
  private readonly argument?: Field;
  private readonly continuation?: FieldPointer | MethodPointer;
  private readonly method: Method;
  private readonly methodPath: Array<string>;

  constructor(methodPointer: Abstract.MethodPointer, scope: Scope) {
    super();

    this.methodPath = methodPointer.methodPath;

    const methodPath = [...this.methodPath];

    const getNextKey = () => {
      const key = methodPath.shift();

      if (!key) {
        throw new ViewScriptError(
          `Cannot construct a pointer to method at unknown path: "${methodPointer.methodPath}"`,
        );
      }

      return key;
    };

    let nextMember: Member = scope[getNextKey()];

    while (methodPath.length > 0) {
      if (!(nextMember instanceof Field)) {
        break;
      }

      nextMember = nextMember.getMember(getNextKey());
    }

    if (!(nextMember instanceof Method)) {
      throw new ViewScriptError(
        `Cannot construct a method reference of unknown path to method key "${methodPointer.methodPath}"`,
      );
    }

    this.argument = Abstract.isDataSource(methodPointer.argument)
      ? new Field(methodPointer.argument, scope)
      : undefined;

    this.method = nextMember;

    this.continuation = this.method.connect(this, scope, this.argument, methodPointer.continuation);
  }

  take() {
    const nextValue = this.method.call(this.argument?.getValue() ?? null);

    if (nextValue !== undefined) {
      this.publish(nextValue);
    }
  }
}

class Store<ModelName extends string> extends Binding<ValueOf<ModelName>> {
  private readonly firstValue: ValueOf<ModelName>;
  private lastValue: ValueOf<ModelName>;

  constructor(store: Abstract.Store<Abstract.Model<ModelName>>) {
    super();

    this.firstValue = store.value;
    this.lastValue = store.value;
    super.take(store.value);
  }

  listen(listener: Listener<ValueOf<ModelName>>) {
    listener.take(this.lastValue);
    super.listen(listener);
  }

  read() {
    return this.lastValue;
  }

  reset() {
    this.take(this.firstValue);
  }

  take(value: ValueOf<ModelName>) {
    this.lastValue = value;
    super.take(value);
  }
}

class Component extends Binding<HTMLElement> {
  private readonly body: Feature | Landscape;

  constructor(
    component: Abstract.Component,
    appMembers: Record<string, Abstract.Model | Abstract.View>,
    scope: Scope,
  ) {
    super();

    if ("tagName" in component.body) {
      this.body = new Feature(component.body.tagName, appMembers, scope, component.body.properties);
      this.body.listen(this);
    } else {
      const member = appMembers[component.body.viewName];

      if (member.kind !== "view") {
        throw new ViewScriptError(`Cannot construct unknown view "${component.body.viewName}"`);
      }

      this.body = new Landscape(member, appMembers, { ...scope }, component.body.properties);
      this.body.listen(this);
    }
  }
}

class Feature extends Publisher<HTMLElement> {
  private children: Array<Component | string>;
  private readonly properties: Record<string, Action | Field>;
  private readonly tagName: string;
  private readonly scope: Scope;

  constructor(
    tagName: string,
    branches: Record<string, Abstract.View | Abstract.Model>,
    scope: Scope,
    properties: Abstract.Component["properties"],
  ) {
    super();

    this.children = [];
    this.properties = {};
    this.tagName = tagName;
    this.scope = scope;

    const htmlElement = Dom.create(tagName);

    Object.entries(properties).forEach(([propertyKey, property]) => {
      if (Abstract.isDataSource(property)) {
        const dataSource = new Field(property, this.scope);

        let take: (value: Abstract.Value) => void;

        if (propertyKey === "content") {
          take = (value) => {
            this.children = [];

            const htmlElementChildren: Array<HTMLElement | string> = [];
            const populate = (child: Abstract.Field) => {
              if (child instanceof Array) {
                child.forEach(populate);
              } else if (Abstract.isElement(child)) {
                const elementChild = new Component(child, branches, this.scope);
                this.children.push(elementChild);
                elementChild.listen({
                  take: (htmlElementChild) => {
                    htmlElementChildren.push(htmlElementChild);
                  },
                });
              } else if (Abstract.isValue(child)) {
                const textContent = String(child); // TODO properly handle structures
                this.children.push(textContent);
                htmlElementChildren.push(textContent);
              } else if (Abstract.isFieldReference(child)) {
                const fieldPointer = new FieldPointer(child, this.scope);
                fieldPointer.listen({
                  take: populate,
                });
              } else if (Abstract.isMethodReference(child)) {
                const methodPointer = new MethodPointer(child, this.scope);
                methodPointer.listen({
                  take: populate,
                });
              } else if (Abstract.isConditionalData(child)) {
                const option = new Option(child, this.scope);
                option.listen({
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

        dataSource.listen({ take });
        this.properties[propertyKey] = dataSource;
      } else if (Abstract.isSideEffect(property)) {
        const sideEffect = new Action(property, scope);

        Dom.listen(htmlElement, propertyKey, () => {
          // TODO Transform Events into Abstract.Values, and pass them to sideEffect.take:
          sideEffect.take(null);
        });

        this.properties[propertyKey] = sideEffect;
      } else {
        throw new ViewScriptError(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
          } for element of tagName ${this.tagName}"`,
        );
      }
    });

    this.publish(htmlElement);
  }
}

class Landscape extends Binding<HTMLElement> {
  private readonly key: string;

  private readonly element: Component;
  private readonly properties: Record<string, Action | Field>;
  private readonly scope: Scope;

  constructor(
    renders: Abstract.View,
    members: Record<string, Abstract.Model | Abstract.View>,
    scope: Scope,
    properties: Abstract.Component["properties"],
  ) {
    super();

    this.key = renders.key;

    this.properties = {};
    this.scope = scope;

    Object.entries(renders.scope).forEach(([featureKey, feature]) => {
      this.scope[featureKey] = Abstract.isField(feature)
        ? Field.create(feature)
        : new Stream(feature);
    });

    Object.entries(properties).forEach(([propertyKey, property]) => {
      const feature = Object.values(this.scope).find(
        (feature) =>
          (feature instanceof Stream || feature instanceof Field) && feature.key === propertyKey,
      );

      if (feature === undefined) {
        throw new ViewScriptError(
          `Cannot construct a property for unknown feature name \`${propertyKey}\` for view of key \`${this.key}\``,
        );
      }

      if (Abstract.isDataSource(property)) {
        if (feature instanceof Stream) {
          throw new ViewScriptError(
            `Cannot construct a data source for stream name \`${propertyKey}\``,
          );
        }

        const dataSource = new Field(property, this.scope);
        dataSource.listen(feature);
        this.properties[propertyKey] = dataSource;
      } else if (Abstract.isSideEffect(property)) {
        if (feature instanceof Field) {
          throw new ViewScriptError(
            `Cannot construct a side effect for field name \`${propertyKey}\``,
          );
        }

        const sideEffect = new Action(property, this.scope);
        feature.listen(sideEffect);
        this.properties[propertyKey] = sideEffect;
      } else {
        throw new ViewScriptError(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
          } for view of key \`${this.key}\`"`,
        );
      }
    });

    this.element = new Component(renders.element, branches, this.scope);
    this.element.listen(this);
  }
}

export class RunningApp {
  private static readonly browser = new Browser();
  private readonly fields = { browser: RunningApp.browser };
  private readonly renders: Element | Landscape;

  constructor(app: Abstract.App) {
    this.renders = new Landscape(app.renders, app.members, { ...this.fields }, {});
    this.renders.listen({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

const models: Record<string, Abstract.Model> = {
  Browser: {
    kind: "model",
    name: "Browser",
    members: {
      console: {
        kind: "field",
        modelName: "Console",
      },
    },
  },
  Console: {
    kind: "model",
    name: "Console",
    members: {
      log: {
        kind: "action",
        handler: window.console.log,
      },
    },
  },
};

const boolean = (store: Store<"Boolean">): Abstract.Model<"Boolean"> => ({
  kind: "model",
  name: "Boolean",
  members: {
    and: {
      kind: "method",
      modelName: "Boolean",
      handler: (arg) => store.read() && (arg as boolean),
    },
    not: {
      kind: "method",
      modelName: "Boolean",
      handler: () => !store.read(),
    },
    disable: {
      kind: "action",
      handler: () => store.take(false),
    },
    enable: {
      kind: "action",
      handler: () => store.take(true),
    },
    toggle: {
      kind: "action",
      handler: () => store.take(!store.read()),
    },
  },
});

const number = (store: Store<"Number">): Abstract.Model<"Number"> => ({
  kind: "model",
  name: "Number",
  members: {
    equals: {
      kind: "method",
      modelName: "Boolean",
      handler: (arg) => store.read() == (arg as number),
    },
    isAtLeast: {
      kind: "method",
      modelName: "Boolean",
      handler: (arg) => store.read() >= (arg as number),
    },
    add: {
      kind: "action",
      handler: (arg) => store.take(store.read() + (arg as number)),
    },
    multiplyBy: {
      kind: "action",
      handler: (arg) => store.take(store.read() * (arg as number)),
    },
  },
});

const string = (): Abstract.Model<"String"> => ({
  kind: "model",
  name: "String",
  members: {},
});

const component = (): Abstract.Model<"Component"> => ({
  kind: "model",
  name: "Component",
  members: {},
});

const array = (store: Store<"Array">): Abstract.Model<"Array"> => ({
  kind: "model",
  name: "Array",
  members: {
    push: {
      kind: "action",
      handler: (arg) =>
        store.take(
          store.read().concat({
            kind: "field",
            modelName: "Component",
            source: {
              kind: "store",
              value: arg,
            },
          }),
        ),
    },
  },
});
