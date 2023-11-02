import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Scope = Record<string, ScopeMember>;
type ScopeMember = Stream | Field | Method | Action;
type ValueOf<ModelName extends string> = Abstract.Value<Abstract.Model<ModelName>>;

interface Modeled<ModelName extends string = string> {
  modelName: ModelName;
}

interface Listener<T = unknown> {
  take(value: T): void;
}

interface Readable<T> {
  read(): T;
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

abstract class Channel<T = unknown> extends Publisher<T> implements Listener<T> {
  take(value: T) {
    this.publish(value);
  }
}

class ViewScriptError extends Error {}

class Stream extends Channel<Abstract.Value> implements Modeled {
  readonly modelName: string;

  constructor(stream: Abstract.Stream) {
    super();

    this.modelName = stream.modelName;
  }
}

class Field<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>, Readable<ValueOf<ModelName>>
{
  readonly channel:
    | Slot<ModelName>
    | MutableSlot<ModelName>
    | Store<ModelName>
    | Option<ModelName>
    | FieldPointer<ModelName>
    | MethodPointer<ModelName>;

  readonly members: Record<string, Field | Method | Action>;
  readonly modelName: ModelName;

  constructor(
    field: Abstract.Field<Abstract.Model<ModelName>>,
    scope: Scope,
    appMembers: Record<string, Abstract.Model | Abstract.View>,
  ) {
    super();

    this.members = {};
    this.modelName = field.modelName;

    if (field.channel.kind === "slot") {
      this.channel = new Slot(field.channel);
    } else if (field.channel.kind === "mutableSlot") {
      this.channel = new MutableSlot(field.channel);
    } else if (field.channel.kind === "store") {
      this.channel = new Store(field.channel);
    } else if (field.channel.kind === "option") {
      this.channel = new Option(field.channel, scope);
    } else if (field.channel.kind === "fieldPointer") {
      this.channel = new FieldPointer(field.channel, scope);
    } else if (field.channel.kind === "methodPointer") {
      this.channel = new MethodPointer(field.channel, scope);
    } else {
      throw new ViewScriptError(
        `Cannot construct a field with channel of unknown kind "${
          (field.channel as { kind: unknown }).kind
        }"`,
      );
    }

    const model = appMembers[field.modelName];

    if (model.kind !== "model") {
      throw new ViewScriptError(
        `Cannot construct a field with unknown model name "${field.modelName}"`,
      );
    }

    const isMutable = this.channel instanceof MutableSlot || this.channel instanceof Store;

    // TODO Implement the consumption of abstract models.
    // TODO Use model to define fields, methods, and actions
    Object.entries(model.members).forEach(([memberKey, member]) => {
      if (member.kind === "field") {
        this.members[memberKey] = new Field(member, scope, appMembers);
      } else if (member.kind === "method") {
        this.members[memberKey] = new Method(member, this.members); // TODO merge this.members and scope (?)
      } else if (member.kind === "action") {
        if (isMutable) {
          this.members[memberKey] = new Action(member, this.members); // TODO see above
        }
      } else {
        throw new ViewScriptError(
          `Cannot construct a field with member of unknown kind "${
            (member as { kind: unknown }).kind
          }"`,
        );
      }
    });

    if (isMutable) {
      const channel = this.channel;
      this.members.reset = new Action(
        {
          kind: "action",
          handle: () => channel.reset(),
        },
        this.members,
      );
      this.members.write = new Action<ModelName>(
        {
          kind: "action",
          handle: (value) => channel.take(value),
        },
        this.members,
      );
    }

    this.channel.listen(this);
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptError(`Cannot get unknown member "${name}" of field`); // TODO should fields still have keys?
    }

    return this.members[name];
  }

  read() {
    return this.channel.read();
  }
}

class Method<ModelName extends string = string> extends Channel<ValueOf<ModelName>> {
  private readonly method: Abstract.Method;
  private readonly scope: Scope;

  constructor(method: Abstract.Method, scope: Scope) {
    super();

    this.method = method;
    this.scope = scope;
  }

  call(argument: Abstract.Value) {
    if (!("handle" in this.method)) {
      throw new ViewScriptError(`A method without a handle cannot be called.`);
    }

    const nextValue = this.method.handle(argument);

    return nextValue;
  }

  connect(
    methodPointer: MethodPointer,
    scope: Scope,
    argument?: Field,
    abstractContinuation?: Abstract.MethodPointer["continuation"], // TODO replace with leader
  ): FieldPointer | MethodPointer | undefined {
    if ("handle" in this.method) {
      this.listen(methodPointer);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.method.parameter !== undefined && argument !== undefined) {
      const parameter = new Field(this.method.parameter);
      argument.listen(parameter);
      stepTerrain[this.method.parameter.name] = parameter;
    }

    const result = new Field(this.method.result, stepTerrain);

    if (abstractContinuation) {
      const continuation =
        abstractContinuation.kind === "fieldPointer"
          ? new FieldPointer(abstractContinuation, scope) // TODO Replace scope with method result's members
          : new MethodPointer(abstractContinuation, scope); // TODO Replace scope with method result's members

      continuation.listen(result);
      result.listen(continuation);

      return continuation;
    }

    result.listen(methodPointer);
  }
}

class Action<ModelName extends string = string> extends Channel<ValueOf<ModelName>> {
  private readonly action: Abstract.Action<Abstract.Model<ModelName>>;
  private readonly scope: Scope;

  constructor(action: Abstract.Action<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.action = action;
    this.scope = scope;
  }

  connect(actionPointer: ActionPointer, scope: Scope, argument?: Field) {
    if ("handle" in this.action) {
      actionPointer.listen(this);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.action.parameter !== undefined && argument !== undefined) {
      const parameter = new Field(this.action.parameter);
      argument.listen(parameter);
      stepTerrain[this.action.parameter.name] = parameter;
    }

    const steps: Array<ActionPointer | StreamPointer> = this.action.steps.map((step) => {
      if (step.kind === "actionPointer") {
        return new ActionPointer(step, stepTerrain);
      }

      if (step.kind === "streamPointer") {
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
    if (!("handle" in this.action)) {
      throw new ViewScriptError(`An action without a handle cannot take values.`);
    }

    const nextValue = this.action.handle(value);

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

    let nextMember: ScopeMember = scope[getNextKey()];

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

    this.argument = actionPointer.argument && new Field(actionPointer.argument, scope);

    this.action = nextMember;
    this.action.connect(this, scope, this.argument);
  }

  take() {
    const nextValue = this.argument?.read();
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
    const nextValue = this.argument?.read();
    this.publish(nextValue ?? null);
  }
}

class Slot<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>
{
  readonly modelName: ModelName;
  private channel?: Channel<ValueOf<ModelName>>;

  constructor(slot: Abstract.Slot<Abstract.Model<ModelName>>) {
    super();

    this.modelName = slot.modelName;
  }

  fill(channel: Publisher<ValueOf<ModelName>> & Channel<ValueOf<ModelName>>) {
    this.channel = channel;
    channel.listen(this);
  }

  read(): ValueOf<ModelName> {
    return this.channel.read();
  }
}

class Option<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Listener<ValueOf<"Boolean">>
{
  private readonly condition: Field<"Boolean">;
  private readonly result: Field;
  private readonly opposite?: Field;
  private lastValue: ValueOf<ModelName>;

  constructor(option: Abstract.Option<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.result = new Field(option.result, scope);
    this.opposite = new Field(option.opposite, scope);

    this.condition = new Field<"Boolean">(option.condition, scope);
    this.condition.listen(this);

    this.lastValue = (this.condition.read() ? this.result : this.opposite)?.read();
  }

  read() {
    return this.lastValue;
  }

  take(value: ValueOf<"Boolean">) {
    this.lastValue = (value ? this.result : this.opposite)?.read();
    this.publish(this.lastValue ?? undefined);
  }
}

class FieldPointer<ModelName extends string = string> extends Channel<ValueOf<ModelName>> {
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

    let nextMember: ScopeMember = scope[getNextKey()];

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

    this.field = nextMember as Field<ModelName>;
    this.field.listen(this);
  }

  read() {
    return this.field.read();
  }
}

// TODO Should I handle higher-order methods?
class MethodPointer<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Listener<void>
{
  private readonly argument?: Field;
  private readonly continuation?: FieldPointer | MethodPointer;
  private readonly method: Method<ModelName>;
  private readonly methodPath: Array<string>;
  private lastValue: ValueOf<ModelName>;

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

    let nextMember: ScopeMember = scope[getNextKey()];

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

    this.argument = Abstract.isField(methodPointer.argument)
      ? new Field(methodPointer.argument, scope)
      : undefined;

    this.method = nextMember;

    this.continuation = this.method.connect(this, scope, this.argument, methodPointer.continuation);
  }

  take() {
    this.lastValue = this.method.call(this.argument?.read() ?? null);

    if (this.lastValue !== undefined) {
      this.publish(this.lastValue);
    }
  }
}

class MutableSlot<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>
{
  readonly modelName: ModelName;
  private channel?: Channel<ValueOf<ModelName>>;

  constructor(slot: Abstract.MutableSlot<Abstract.Model<ModelName>>) {
    super();

    this.modelName = slot.modelName;
  }

  fill(channel: Publisher<ValueOf<ModelName>> & Channel<ValueOf<ModelName>>) {
    this.channel = channel;
    channel.listen(this);
  }

  read(): ValueOf<ModelName> {
    return this.channel.read();
  }

  reset(): void {
    return this.channel.reset();
  }

  write(value: Abstract.Value<Abstract.Model<ModelName>>): void {
    this.channel.write(value);
  }
}

class Store<ModelName extends string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>
{
  readonly firstValue: ValueOf<ModelName>;
  private lastValue: ValueOf<ModelName>;
  readonly modelName: ModelName;

  constructor(store: Abstract.Store<Abstract.Model<ModelName>>) {
    super();

    this.firstValue = store.value;
    this.lastValue = store.value;
    this.modelName = store.modelName;

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
    this.write(this.firstValue);
  }

  write(value: ValueOf<ModelName>) {
    this.lastValue = value;
    this.take(value);
  }
}

class Component extends Channel<HTMLElement> {
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
      if (Abstract.isField(property)) {
        const field = new Field(property, this.scope);

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
              } else if (Abstract.isFieldPointer(child)) {
                const fieldPointer = new FieldPointer(child, this.scope);
                fieldPointer.listen({
                  take: populate,
                });
              } else if (Abstract.isMethodPointer(child)) {
                const methodPointer = new MethodPointer(child, this.scope);
                methodPointer.listen({
                  take: populate,
                });
              } else if (Abstract.isOption(child)) {
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

        field.listen({ take });
        this.properties[propertyKey] = field;
      } else if (Abstract.isAction(property)) {
        const action = new Action(property, scope);

        Dom.listen(htmlElement, propertyKey, () => {
          // TODO Transform Events into Abstract.Values, and pass them to action.take:
          action.take(null);
        });

        this.properties[propertyKey] = action;
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

class Landscape extends Channel<HTMLElement> {
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
      this.scope[featureKey] = Abstract.isField(feature) ? new Field(feature) : new Stream(feature);
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

      if (Abstract.isField(property)) {
        if (feature instanceof Stream) {
          throw new ViewScriptError(`Cannot construct a field for stream name \`${propertyKey}\``);
        }

        const field = new Field(property, this.scope);
        field.listen(feature);
        this.properties[propertyKey] = field;
      } else if (Abstract.isAction(property)) {
        if (feature instanceof Field) {
          throw new ViewScriptError(`Cannot construct an action for field name \`${propertyKey}\``);
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
        handle: window.console.log,
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
      handle: (arg) => store.read() && (arg as boolean),
    },
    not: {
      kind: "method",
      modelName: "Boolean",
      handle: () => !store.read(),
    },
    disable: {
      kind: "action",
      handle: () => store.take(false),
    },
    enable: {
      kind: "action",
      handle: () => store.take(true),
    },
    toggle: {
      kind: "action",
      handle: () => store.take(!store.read()),
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
      handle: (arg) => store.read() == (arg as number),
    },
    isAtLeast: {
      kind: "method",
      modelName: "Boolean",
      handle: (arg) => store.read() >= (arg as number),
    },
    add: {
      kind: "action",
      handle: (arg) => store.take(store.read() + (arg as number)),
    },
    multiplyBy: {
      kind: "action",
      handle: (arg) => store.take(store.read() * (arg as number)),
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
      handle: (arg) =>
        store.take(
          store.read().concat({
            kind: "field",
            modelName: "Component",
            channel: {
              kind: "store",
              value: arg,
            },
          }),
        ),
    },
  },
});
