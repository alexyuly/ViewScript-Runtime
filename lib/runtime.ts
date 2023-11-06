import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Domain = Abstract.App["domain"];
type Scope = Record<string, ScopeMember>;
type ScopeMember = Abstract.Model | Field | Method | Action | Stream | ((argument: any) => unknown);

interface ConcreteNode<Kind extends string> {
  abstractNode: Abstract.Node<Kind>;
}

interface Readable<T> {
  getValue(): T | undefined;
}

interface Subscriber<T> {
  take(value: T): void;
}

abstract class Publisher<T> implements Readable<T> {
  private readonly takes: Array<Subscriber<T>["take"]> = [];
  private value?: T;

  getValue() {
    return this.value;
  }

  protected publish(value: T) {
    this.value = value;

    this.takes.forEach((take) => {
      take(value);
    });
  }

  sendTo(target: Subscriber<T> | Subscriber<T>["take"]) {
    const take = typeof target === "function" ? target : target.take;

    if (this.value !== undefined) {
      take(this.value);
    }

    this.takes.push(take);
  }
}

abstract class Channel<T> extends Publisher<T> implements Subscriber<T> {
  take(value: T) {
    this.publish(value);
  }
}

const globalScope: Record<string, Abstract.Model> = {
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

export class App implements ConcreteNode<"app"> {
  readonly abstractNode: Abstract.App;
  private readonly renderable: Renderable;

  constructor(app: Abstract.App) {
    this.abstractNode = app;

    const scope = { ...globalScope };
    const domain = { ...app.domain };

    this.renderable = new Renderable(app.renderable, scope, domain);
    this.renderable.sendTo(Dom.render);

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

class Renderable extends Channel<HTMLElement> implements ConcreteNode<"renderable"> {
  readonly abstractNode: Abstract.Renderable;
  private readonly element: Feature | Landscape;

  constructor(renderable: Abstract.Renderable, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = renderable;

    this.element =
      renderable.element.kind === "feature"
        ? new Feature(renderable.element, scope, domain)
        : new Landscape(renderable.element, scope, domain);

    this.element.sendTo(this);
  }
}

class Feature extends Publisher<HTMLElement> implements ConcreteNode<"feature"> {
  readonly abstractNode: Abstract.Feature;

  private readonly properties: Record<string, Field> = {};
  private readonly reactions: Record<string, Action> = {};

  private children: Array<Renderable | string> = [];
  private readonly scope: Scope;

  constructor(feature: Abstract.Feature, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = feature;
    this.scope = scope;

    const htmlElement = Dom.create(feature.tagName);

    Object.entries(feature.properties).forEach(([key, property]) => {
      this.properties[key] = new Field(property, this.scope, domain);

      this.properties[key].sendTo(
        key === "content"
          ? (value) => {
              this.children = [];

              const htmlElementChildren: Array<HTMLElement | string> = [];

              const populate = (nextValue: Value) => {
                if (nextValue instanceof Array) {
                  nextValue.forEach((field) => {
                    if (field instanceof Field) {
                      field.sendTo(populate);
                    }
                    // else throw an Error ?
                  });
                } else if (typeof nextValue === "object" && nextValue.kind === "renderable") {
                  const elementChild = new Renderable(nextValue, this.scope, domain);

                  this.children.push(elementChild);

                  elementChild.sendTo((htmlElementChild) => {
                    htmlElementChildren.push(htmlElementChild);
                  });
                } else {
                  const textContent = String(nextValue);

                  this.children.push(textContent);

                  htmlElementChildren.push(textContent);
                }
              };

              populate(value);

              Dom.populate(htmlElement, htmlElementChildren);
            }
          : Style.supports(key)
          ? (value) => {
              Dom.styleProp(htmlElement, key, value);
            }
          : (value) => {
              Dom.attribute(htmlElement, key, value);
            },
      );
    });

    Object.entries(feature.reactions).forEach(([key, reaction]) => {
      this.reactions[key] = new Action(reaction, scope, domain);

      Dom.listen(htmlElement, key, (event) => {
        // TODO Transform Events into Abstract.Values, and pass them to action.take:
        this.reactions[key].take(event);
      });
    });

    this.publish(htmlElement);
  }
}

class Landscape extends Channel<HTMLElement> {
  private readonly element: Renderable;
  private readonly properties: Record<string, Action | Field>;
  private readonly scope: Scope;

  constructor(landscape: Abstract.Landscape, scope: Scope, domain: Domain) {
    super();

    const view = domain[landscape.viewName];

    if (view.kind !== "view") {
      throw new ViewScriptError(`Cannot construct unknown view "${landscape.viewName}"`);
    }

    this.properties = {};
    this.scope = scope;

    Object.entries(view.scope).forEach(([featureKey, feature]) => {
      this.scope[featureKey] = Abstract.isField(feature) ? new Field(feature) : new Stream(feature);
    });

    Object.entries(landscape.properties).forEach(([propertyKey, property]) => {
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
        field.sendTo(feature);
        this.properties[propertyKey] = field;
      } else if (Abstract.isAction(property)) {
        if (feature instanceof Field) {
          throw new ViewScriptError(`Cannot construct an action for field name \`${propertyKey}\``);
        }

        const sideEffect = new Action(property, this.scope);
        feature.sendTo(sideEffect);
        this.properties[propertyKey] = sideEffect;
      } else {
        throw new ViewScriptError(
          `Cannot construct a property of unknown kind "${
            (property as { kind: unknown }).kind
          } for view of key \`${this.key}\`"`,
        );
      }
    });

    this.element = new Renderable(renders.element, branches, this.scope);
    this.element.sendTo(this);
  }
}

type ValueOf<ModelName extends string> = Abstract.Value<Abstract.Model<ModelName>>;

type Value<M extends Abstract.Model = Abstract.Model> = M["name"] extends "Array"
  ? Array<Field>
  : M["name"] extends "Boolean"
  ? boolean
  : M["name"] extends "Number"
  ? number
  : M["name"] extends "String"
  ? string
  : M["name"] extends "Renderable"
  ? Renderable
  : Array<Field> | boolean | number | string | Renderable | Abstract.Structure<M>;

// TODO Do we really need this interface?
interface Modeled<ModelName extends string = string> {
  modelName: ModelName;
}

interface Writer<T = unknown> {
  reset(): void;
  write(value: T): void;
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

  constructor(field: Abstract.Field<Abstract.Model<ModelName>>, scope: Scope, domain: Domain) {
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

    this.channel.sendTo(this);
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptError(`Cannot get unknown member "${name}" of field`); // TODO should fields still have keys?
    }

    return this.members[name];
  }

  getValue(): ValueOf<ModelName> | undefined {
    return this.channel.getValue();
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
      this.sendTo(methodPointer);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.method.parameter !== undefined && argument !== undefined) {
      const parameter = new Field(this.method.parameter);
      argument.sendTo(parameter);
      stepTerrain[this.method.parameter.name] = parameter;
    }

    const result = new Field(this.method.result, stepTerrain);

    // if (abstractContinuation) {
    //   const continuation =
    //     abstractContinuation.kind === "fieldPointer"
    //       ? new FieldPointer(abstractContinuation, scope) // TODO Replace scope with method result's members
    //       : new MethodPointer(abstractContinuation, scope); // TODO Replace scope with method result's members

    //   continuation.sendTo(result);
    //   result.sendTo(continuation);

    //   return continuation;
    // }

    result.sendTo(methodPointer);
  }
}

class Action<ModelName extends string = string> implements Subscriber<ValueOf<ModelName>> {
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
      actionPointer.sendTo(this);
      return;
    }

    const stepTerrain = { ...this.scope, ...scope };

    if (this.action.parameter !== undefined && argument !== undefined) {
      const parameter = new Field(this.action.parameter);
      argument.sendTo(parameter);
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

    actionPointer.sendTo({
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
  implements Subscriber<void>
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
    const nextValue = this.argument?.getValue();
    this.publish(nextValue ?? null); // TODO allow publishing null (or undefined?) when ModelName is null
  }
}

class StreamPointer<ModelName extends string = string>
  extends Publisher<ValueOf<ModelName>>
  implements Subscriber<void>
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
    this.sendTo(this.stream);
  }

  take() {
    const nextValue = this.argument?.getValue();
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
  implements Subscriber<ValueOf<"Boolean">>
{
  private readonly condition: Field<"Boolean">;
  private readonly result: Field<ModelName>;
  private readonly opposite: Field<ModelName>;

  constructor(option: Abstract.Option<Abstract.Model<ModelName>>, scope: Scope) {
    super();

    this.result = new Field(option.result, scope);
    this.opposite = new Field(option.opposite, scope);

    this.condition = new Field<"Boolean">(option.condition, scope);
    this.condition.sendTo(this);
  }

  take(conditionalValue: ValueOf<"Boolean">) {
    const nextValue = (conditionalValue ? this.result : this.opposite)?.getValue();

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
    this.field.sendTo(this);
  }

  getValue() {
    return this.field.getValue();
  }
}

// TODO Should I handle higher-order methods?
class MethodPointer<ModelName extends string = string>
  extends Channel<ValueOf<ModelName>>
  implements Subscriber<void>
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

const factories = {
  Array: {
    methods: () => ({}),
    actions: (writer: Writer<ValueOf<"Array">>, reader: Readable<ValueOf<"Array">>) => ({
      push: (argument: Field) => {
        const value = reader.getValue() ?? [];
        value.push(argument);
        writer.write(value);
      },
    }),
  },
  Boolean: {
    methods: (reader: Readable<ValueOf<"Boolean">>) => ({
      and: (argument: Field<"Boolean">) => reader.getValue() && argument.getValue(),
      not: () => !reader.getValue(),
    }),
    actions: (writer: Writer<ValueOf<"Boolean">>, reader: Readable<ValueOf<"Boolean">>) => ({
      disable: () => writer.write(false),
      enable: () => writer.write(true),
      toggle: () => writer.write(!reader.getValue()),
    }),
  },
  Number: {
    methods: (reader: Readable<ValueOf<"Number">>) => ({
      equals: (argument: Field<"Number">) => reader.getValue() == argument.getValue(),
      isAtLeast: (argument: Field<"Number">) =>
        (reader.getValue() ?? NaN) >= (argument.getValue() ?? NaN),
    }),
    actions: (writer: Writer<ValueOf<"Number">>, reader: Readable<ValueOf<"Number">>) => ({
      add: (argument: Field<"Number">) =>
        writer.write((reader.getValue() ?? NaN) + (argument.getValue() ?? NaN)),
      multiplyBy: (argument: Field<"Number">) =>
        writer.write((reader.getValue() ?? NaN) * (argument.getValue() ?? NaN)),
    }),
  },
  String: {
    methods: () => ({}),
    actions: () => ({}),
  },
  Renderable: {
    methods: () => ({}),
    actions: () => ({}),
  },
};
