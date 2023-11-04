import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type AppMembers = Record<string, Abstract.Model | Abstract.View>;
type Scope = Record<string, ScopeMember>;
type ScopeMember = Stream | Field | Method | Action | ((argument: any) => unknown);
type ValueOf<ModelName extends string> = Abstract.Value<Abstract.Model<ModelName>>;

// TODO Do we really need this interface?
interface Modeled<ModelName extends string = string> {
  modelName: ModelName;
}

interface Writer<T = unknown> {
  reset(): void;
  write(value: T): void;
}

interface Reader<T = unknown> {
  read(): T | undefined;
}

interface Listener<T = unknown> {
  take(value: T): void;
}

abstract class Publisher<T = unknown> implements Reader<T> {
  private lastValue?: T;

  private readonly listeners: Array<Listener<T>> = [];

  listen(listener: Listener<T>) {
    if (this.lastValue !== undefined) {
      listener.take(this.lastValue);
    }

    this.listeners.push(listener);
  }

  protected publish(value: T) {
    this.lastValue = value;

    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  read() {
    return this.lastValue;
  }
}

class Channel<T = unknown> extends Publisher<T> implements Listener<T> {
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
  implements Modeled<ModelName>
{
  readonly channel:
    | Slot<ModelName>
    | MutableSlot<ModelName>
    | Store<ModelName>
    | Option<ModelName>
    | FieldPointer<ModelName>
    | MethodPointer<ModelName>;

  readonly members: Record<string, Field | Method | Action | ((argument: any) => unknown)>;
  readonly modelName: ModelName;

  constructor(
    field: Abstract.Field<Abstract.Model<ModelName>>,
    scope: Scope,
    appMembers: AppMembers,
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

    const isChannelMutable = this.channel instanceof MutableSlot || this.channel instanceof Store;

    // TODO Implement the consumption of abstract models.
    // TODO Use model to define fields, methods, and actions
    Object.entries(model.members).forEach(([memberKey, member]) => {
      if (typeof member === "function") {
        this.members[memberKey] = member;
      } else if (member.kind === "field") {
        this.members[memberKey] = new Field(member, this.members, appMembers);
      } else if (member.kind === "method") {
        this.members[memberKey] = new Method(member, this.members, appMembers);
      } else if (member.kind === "action") {
        if (isChannelMutable) {
          this.members[memberKey] = new Action(member, this.members, appMembers);
        }
      } else {
        throw new ViewScriptError(
          `Cannot construct a field with member of unknown kind "${
            (member as { kind: unknown }).kind
          }"`,
        );
      }
    });

    if (isChannelMutable) {
      const channel = this.channel;
      this.members.reset = () => channel.reset();
      this.members.write = (value: ValueOf<ModelName>) => channel.take(value);
    }

    this.channel.listen(this);
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptError(`Cannot get unknown member "${name}" of field`); // TODO should fields still have keys?
    }

    return this.members[name];
  }

  read(): ValueOf<ModelName> | undefined {
    return this.channel.read();
  }
}

class Method<ModelName extends string = string> extends Publisher<ValueOf<ModelName>> {
  private readonly method: Abstract.Method<Abstract.Model<ModelName>>;
  private readonly scope: Scope;

  constructor(
    method: Abstract.Method<Abstract.Model<ModelName>>,
    scope: Scope,
    appMembers: AppMembers,
  ) {
    super();

    this.method = method;
    this.scope = scope;
  }

  // TODO wire up pub/sub in constructor, and remove this method:
  connect(
    methodPointer: MethodPointer,
    scope: Scope,
    argument?: Field,
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

    // if (abstractContinuation) {
    //   const continuation =
    //     abstractContinuation.kind === "fieldPointer"
    //       ? new FieldPointer(abstractContinuation, scope) // TODO Replace scope with method result's members
    //       : new MethodPointer(abstractContinuation, scope); // TODO Replace scope with method result's members

    //   continuation.listen(result);
    //   result.listen(continuation);

    //   return continuation;
    // }

    result.listen(methodPointer);
  }
}

class Action<ModelName extends string = string> implements Listener<ValueOf<ModelName>> {
  private readonly action: Abstract.Action<Abstract.Model<ModelName>>;
  private readonly scope: Scope;

  constructor(
    action: Abstract.Action<Abstract.Model<ModelName>>,
    scope: Scope,
    appMembers: AppMembers,
  ) {
    this.action = action;
    this.scope = scope;
  }

  // TODO wire up pub/sub in constructor, and remove this method:
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

  take(value: ValueOf<ModelName>) {
    // TODO
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
    this.publish(nextValue ?? null); // TODO allow publishing null (or undefined?) when ModelName is null
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

  constructor(slot: Abstract.Slot<Abstract.Model<ModelName>>) {
    super();

    this.modelName = slot.modelName;
  }
}

class Option<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Listener<ValueOf<"Boolean">>
{
  private readonly condition: Field<"Boolean">;
  private readonly result: Field<ModelName>;
  private readonly opposite: Field<ModelName>;

  constructor(option: Abstract.Option<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.result = new Field(option.result, scope);
    this.opposite = new Field(option.opposite, scope);

    this.condition = new Field<"Boolean">(option.condition, scope);
    this.condition.listen(this);
  }

  take(conditionalValue: ValueOf<"Boolean">) {
    const nextValue = (conditionalValue ? this.result : this.opposite)?.read();

    if (nextValue !== undefined) {
      this.publish(nextValue);
    }
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
  private readonly method: Method<ModelName>;
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

    // this.continuation = this.method.connect(this, scope, this.argument, methodPointer.continuation);
  }
}

class MutableSlot<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>, Writer<ValueOf<ModelName>>
{
  readonly modelName: ModelName;
  onReset?: () => void;
  onWrite?: (value: ValueOf<ModelName>) => void;

  constructor(slot: Abstract.MutableSlot<Abstract.Model<ModelName>>) {
    super();

    this.modelName = slot.modelName;
  }

  reset() {
    this.onReset?.();
  }

  write(value: Abstract.Value<Abstract.Model<ModelName>>) {
    this.onWrite?.(value);
  }
}

class Store<ModelName extends string>
  extends Channel<ValueOf<ModelName>>
  implements Modeled<ModelName>, Writer<ValueOf<ModelName>>
{
  private readonly firstValue: ValueOf<ModelName>;
  readonly modelName: ModelName;

  constructor(store: Abstract.Store<Abstract.Model<ModelName>>) {
    super();

    this.firstValue = store.value;
    this.modelName = store.modelName;

    super.take(store.value);
  }

  reset() {
    this.write(this.firstValue);
  }

  write(value: ValueOf<ModelName>) {
    this.take(value);
  }
}

class Component extends Channel<HTMLElement> {
  private readonly body: Feature | Landscape;

  constructor(component: Abstract.Component, scope: Scope, appMembers: AppMembers) {
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
    properties: Abstract.Feature["properties"],
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
    scope: Scope,
    appMembers: AppMembers,
    properties: Abstract.Landscape["properties"],
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
  private readonly renders: Component;

  constructor(app: Abstract.App) {
    this.renders = new Component(app.renders, {}, { ...globals, ...app.members });
    this.renders.listen({
      take: (htmlElement) => {
        Dom.render(htmlElement);
      },
    });

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

const globals: Record<string, Abstract.Model> = {
  browser: {
    kind: "model",
    name: "Browser",
    members: {
      console: {
        kind: "model",
        name: "Console",
        members: {
          log: window.console.log,
        },
      },
    },
  },
};

const factories = {
  Boolean: {
    methods: (reader: Reader<ValueOf<"Boolean">>) => ({
      and: (argument: Field<"Boolean">) => reader.read() && argument.read(),
      not: () => !reader.read(),
    }),
    actions: (writer: Writer<ValueOf<"Boolean">>, reader: Reader<ValueOf<"Boolean">>) => ({
      disable: () => writer.write(false),
      enable: () => writer.write(true),
      toggle: () => writer.write(!reader.read()),
    }),
  },
  Number: {
    methods: (reader: Reader<ValueOf<"Number">>) => ({
      equals: (argument: Field<"Number">) => reader.read() == argument.read(),
      isAtLeast: (argument: Field<"Number">) => (reader.read() ?? NaN) >= (argument.read() ?? NaN),
    }),
    actions: (writer: Writer<ValueOf<"Number">>, reader: Reader<ValueOf<"Number">>) => ({
      add: (argument: Field<"Number">) =>
        writer.write((reader.read() ?? NaN) + (argument.read() ?? NaN)),
      multiplyBy: (argument: Field<"Number">) =>
        writer.write((reader.read() ?? NaN) * (argument.read() ?? NaN)),
    }),
  },
  String: {
    methods: () => ({}),
    actions: () => ({}),
  },
  Component: {
    methods: () => ({}),
    actions: () => ({}),
  },
  Array: {
    methods: () => ({}),
    actions: (writer: Writer<ValueOf<"Array">>, reader: Reader<ValueOf<"Array">>) => ({
      push: (argument: Field) => {
        const argumentValue = argument.read();
        if (argumentValue !== undefined) {
          const lastValue = reader.read() ?? [];
          lastValue.push(argumentValue);
          writer.write(lastValue);
        }
      },
    }),
  },
};
