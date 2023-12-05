import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { isSubscriber, Subscriber, Publisher, Channel } from "./pubsub";

type Data = Field | FieldCall | MethodCall | Primitive | Switch;
type Property = Action | ActionCall | Field | FieldCall | MethodCall | Output | Switch;
type RawScope = Record<string, Method | Primitive | Property | Reducer>;
type Reducer = (argument?: Data) => unknown;

interface Scope {
  getMember(name: string): RawScope[string];
}

interface Scoped {
  getScope(): Scope;
}

class StaticScope implements Scope {
  private readonly rawScope: RawScope;
  private readonly baseScope?: Scope;

  constructor(rawScope: RawScope = {}, baseScope?: Scope) {
    this.rawScope = rawScope;
    this.baseScope = baseScope;
  }

  addMember(name: string, member: RawScope[string]) {
    this.rawScope[name] = member;
  }

  addMembers(members: RawScope) {
    Object.assign(this.rawScope, members);
  }

  getMember(name: string): RawScope[string] {
    if (name in this.rawScope) {
      return this.rawScope[name];
    }

    if (this.baseScope) {
      return this.baseScope.getMember(name);
    }

    throw new Error(`Member "${name}" is not found.`);
  }
}

class DynamicScope implements Scope {
  private readonly primitive: Primitive;

  constructor(primitive: Primitive) {
    this.primitive = primitive;
  }

  getMember(name: string): RawScope[string] {
    const value = this.primitive.getValue();
    const memberValue = Guard.isRawObject(value) ? (value as any)[name] : undefined;

    if (typeof memberValue === "function") {
      return (argument?: Data) => memberValue(argument?.getValue());
    }

    if (Guard.isRawObject(memberValue)) {
      const rawObjectPrimitive = new Primitive(memberValue);
      const rawObjectScope = rawObjectPrimitive.getScope();

      return rawObjectScope.getMember(name);
    }

    return new Primitive(memberValue);
  }
}

export class App {
  constructor(source: Abstract.App) {
    let render: Feature | Landscape | View;

    const scope = new StaticScope({
      window: new Primitive(window),
    });

    if (Guard.isFeature(source.render)) {
      render = new Feature(source.render, source.domain, scope);
    } else if (Guard.isLandscape(source.render)) {
      render = new Landscape(source.render, source.domain, scope);
    } else if (Guard.isView(source.render)) {
      render = new View(source.render, source.domain, scope);
    } else {
      throw new Error(`App render is not valid.`);
    }

    render.connect(document.body.append);
  }
}

class View extends Channel<HTMLElement> {
  private readonly scope: StaticScope;

  constructor(view: Abstract.View, domain: Abstract.App["domain"], scope: StaticScope) {
    super();

    this.scope = scope;

    Object.entries(view.scope).forEach(([name, member]) => {
      if (Guard.isField(member)) {
        this.scope.addMember(name, new Field(member, domain, this.scope));
      } else if (Guard.isFieldCall(member)) {
        this.scope.addMember(name, new FieldCall(member, domain, this.scope));
      } else if (Guard.isMethodCall(member)) {
        this.scope.addMember(name, new MethodCall(member, domain, this.scope));
      } else if (Guard.isSwitch(member)) {
        this.scope.addMember(name, new Switch(member, domain, this.scope));
      } else {
        throw new Error(`Member "${name}" of view is not valid.`);
      }
    });

    let render: Feature | Landscape;

    if (Guard.isFeature(view.render)) {
      render = new Feature(view.render, domain, this.scope);
    } else if (Guard.isLandscape(view.render)) {
      render = new Landscape(view.render, domain, this.scope);
    } else {
      throw new Error(`Render of view is not valid.`);
    }

    render.connect(this);
  }
}

class Feature extends Publisher<HTMLElement> implements Scoped {
  private readonly innerScope = new StaticScope();
  private readonly outerScope = new StaticScope();

  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const htmlElement = document.createElement(source.tagName);

    const propertyListener = (name: string) => {
      const cleanupTasks: Array<() => void> = [];

      return (value: unknown) => {
        while (cleanupTasks.length > 0) {
          cleanupTasks.shift()?.();
        }

        if (name === "content") {
          const result: Array<any> = [];

          if (value instanceof Array) {
            value.forEach((arrayElement, index) => {
              if (arrayElement instanceof Publisher) {
                const target = (arrayElementValue: any) => {
                  if (result[index] === undefined) {
                    result[index] = arrayElementValue;
                  } else {
                    htmlElement.replaceChild(arrayElementValue, result[index]);
                  }
                };
                arrayElement.connect(target);
                const cleanupTask = () => {
                  arrayElement.disconnect(target);
                };
                cleanupTasks.push(cleanupTask);
              } else {
                result[index] = arrayElement;
              }
            });
          } else {
            result.push(value);
          }

          htmlElement.replaceChildren(...result);
        } else if (CSS.supports(name, value as string)) {
          htmlElement.style.setProperty(name, value as string);
        } else if (value === true) {
          htmlElement.setAttribute(name, name);
        } else if (value === false || value === null || value === undefined) {
          htmlElement.style.removeProperty(name);
          htmlElement.removeAttribute(name);
        } else {
          htmlElement.setAttribute(name, value as string);
        }
      };
    };

    this.innerScope.addMembers(
      Object.entries(source.properties).reduce((result, [name, property]) => {
        if (Guard.isField(property)) {
          const publisher = new Field(property, domain, scope);
          publisher.connect(propertyListener(name));
          result[name] = publisher;
        } else if (Guard.isFieldCall(property)) {
          const publisher = new FieldCall(property, domain, scope);
          publisher.connect(propertyListener(name));
          result[name] = publisher;
        } else if (Guard.isMethodCall(property)) {
          const publisher = new MethodCall(property, domain, scope);
          publisher.connect(propertyListener(name));
          result[name] = publisher;
        } else if (Guard.isSwitch(property)) {
          const publisher = new Switch(property, domain, scope);
          publisher.connect(propertyListener(name));
          result[name] = publisher;
        } else if (Guard.isAction(property)) {
          const subscriber = new Action(property, domain, scope);
          htmlElement.addEventListener(name, (value) => {
            const event = new Primitive(value);
            subscriber.handleEvent(event);
          });
          result[name] = subscriber;
        } else if (Guard.isActionCall(property)) {
          const subscriber = new ActionCall(property, domain, scope);
          htmlElement.addEventListener(name, subscriber);
          result[name] = subscriber;
        } else if (Guard.isOutput(property)) {
          const subscriber = new Output(property, domain, scope);
          htmlElement.addEventListener(name, subscriber);
          result[name] = subscriber;
        } else {
          throw new Error(`Feature property "${name}" is not valid.`);
        }
        return result;
      }, {} as RawScope),
    );

    this.publish(htmlElement);
  }

  getScope(): Scope {
    return this.outerScope;
  }
}

class Landscape extends Channel<HTMLElement> implements Scoped {
  private readonly innerScope = new StaticScope();
  private readonly outerScope = new StaticScope();

  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.innerScope.addMembers(
      Object.entries(source.properties).reduce((result, [name, property]) => {
        if (Guard.isField(property)) {
          result[name] = new Field(property, domain, scope);
        } else if (Guard.isFieldCall(property)) {
          result[name] = new FieldCall(property, domain, scope);
        } else if (Guard.isMethodCall(property)) {
          result[name] = new MethodCall(property, domain, scope);
        } else if (Guard.isSwitch(property)) {
          result[name] = new Switch(property, domain, scope);
        } else if (Guard.isAction(property)) {
          result[name] = new Action(property, domain, scope);
        } else if (Guard.isActionCall(property)) {
          result[name] = new ActionCall(property, domain, scope);
        } else if (Guard.isOutput(property)) {
          result[name] = new Output(property, domain, scope);
        } else {
          throw new Error(`Landscape property "${name}" is not valid.`);
        }
        return result;
      }, {} as RawScope),
    );

    const view = domain[source.viewName];

    if (!Guard.isView(view)) {
      throw new Error(`View "${source.viewName}" is not valid.`);
    }

    const publisher = new View(view, domain, this.innerScope);
    publisher.connect(this);
  }

  getScope(): Scope {
    return this.outerScope;
  }
}

class Primitive extends Channel implements Scoped {
  private readonly outerScope: StaticScope;

  constructor(value: unknown, domain: Abstract.App["domain"] = {}, scope: Scope = new StaticScope()) {
    super();

    this.outerScope = new StaticScope({}, Guard.isRawObject(value) ? new DynamicScope(this) : undefined);
    this.outerScope.addMembers({
      is: new Method([this, (argument) => Object.is(this.getValue(), argument?.getValue())], domain, scope),
      setTo: (argument) => this.publish(argument?.getValue()),
    });

    if (value instanceof Array) {
      this.outerScope.addMembers({
        map: new Method(
          [
            this,
            (argument) => {
              const argumentValue = argument?.getValue();
              if (!Guard.isMethod(argumentValue)) {
                throw new Error(`Array map method is not valid.`);
              }
              const innerMethod = new Method(argumentValue, domain, scope);
              const outerResult = (this.getValue() as Array<Data>).map((innerValue) => {
                const innerResult = innerMethod.getResult(innerValue);
                return innerResult;
              });
              return outerResult;
            },
          ],
          domain,
          scope,
        ),
        push: (argument) => this.publish([...(this.getValue() as Array<Data>), argument]),
      });

      const hydratedValue: Array<Data> = value.map((arrayElement) => {
        if (Guard.isField(arrayElement)) return new Field(arrayElement, domain, scope);
        if (Guard.isFieldCall(arrayElement)) return new FieldCall(arrayElement, domain, scope);
        if (Guard.isMethodCall(arrayElement)) return new MethodCall(arrayElement, domain, scope);
        if (Guard.isSwitch(arrayElement)) return new Switch(arrayElement, domain, scope);
        return new Primitive(arrayElement);
      });

      this.publish(hydratedValue);
    } else {
      if (typeof value === "number") {
        const addition = (argument?: Data) => (this.getValue() as number) + (argument?.getValue() as number);
        const multiplication = (argument?: Data) => (this.getValue() as number) * (argument?.getValue() as number);

        this.outerScope.addMembers({
          add: (argument) => this.publish(addition(argument)),
          isAtLeast: new Method(
            [this, (argument) => (this.getValue() as number) >= (argument?.getValue() as number)],
            domain,
            scope,
          ),
          multiply: (argument) => this.publish(multiplication(argument)),
          plus: new Method([this, addition], domain, scope),
          times: new Method([this, multiplication], domain, scope),
        });
      } else if (typeof value === "boolean") {
        const inversion = (argument?: Data) => !argument?.getValue();

        this.outerScope.addMembers({
          and: new Method([this, (argument) => this.getValue() && argument?.getValue()], domain, scope),
          not: new Method([this, inversion], domain, scope),
          or: new Method([this, (argument) => this.getValue() || argument?.getValue()], domain, scope),
          toggle: (argument) => this.publish(inversion(argument)),
        });
      }

      this.publish(value);
    }
  }

  getScope(): Scope {
    return this.outerScope;
  }
}

class Structure implements Scoped {
  private readonly outerScope = new StaticScope();

  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    const model = domain[source.modelName];

    if (!Guard.isModel(model)) {
      throw new Error(`Model "${source.modelName}" is not valid.`);
    }

    this.outerScope.addMembers(
      Object.entries(source.properties).reduce((result, [name, property]) => {
        if (Guard.isField(property)) {
          result[name] = new Field(property, domain, scope);
        } else if (Guard.isFieldCall(property)) {
          result[name] = new FieldCall(property, domain, scope);
        } else if (Guard.isMethodCall(property)) {
          result[name] = new MethodCall(property, domain, scope);
        } else if (Guard.isSwitch(property)) {
          result[name] = new Switch(property, domain, scope);
        } else {
          throw new Error(`Structure property "${name}" is not valid.`);
        }
        return result;
      }, {} as RawScope),
    );

    Object.entries(model.scope).forEach(([name, member]) => {
      if (Guard.isField(member)) {
        this.outerScope.addMember(name, new Field(member, domain, this.outerScope));
      } else if (Guard.isFieldCall(member)) {
        this.outerScope.addMember(name, new FieldCall(member, domain, this.outerScope));
      } else if (Guard.isMethodCall(member)) {
        this.outerScope.addMember(name, new MethodCall(member, domain, this.outerScope));
      } else if (Guard.isSwitch(member)) {
        this.outerScope.addMember(name, new Switch(member, domain, this.outerScope));
      } else if (Guard.isMethod(member)) {
        this.outerScope.addMember(name, new Method(member, domain, this.outerScope));
      } else if (Guard.isAction(member)) {
        this.outerScope.addMember(name, new Action(member, domain, this.outerScope));
      } else {
        throw new Error(`Member "${name}" of model "${source.modelName}" is not valid.`);
      }
    });
  }

  getScope(): Scope {
    return this.outerScope;
  }
}

class Field extends Channel implements Scoped {
  private readonly delegate: Scoped;

  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    if (Guard.isFeature(source.delegate)) {
      const delegate = new Feature(source.delegate, domain, scope);
      delegate.connect(this);
      this.delegate = delegate;
    } else if (Guard.isLandscape(source.delegate)) {
      const delegate = new Landscape(source.delegate, domain, scope);
      delegate.connect(this);
      this.delegate = delegate;
    } else if (Guard.isPrimitive(source.delegate)) {
      const delegate = new Primitive(source.delegate.value, domain, scope);
      delegate.connect(this);
      this.delegate = delegate;
    } else if (Guard.isStructure(source.delegate)) {
      this.delegate = new Structure(source.delegate, domain, scope);
    } else {
      throw new Error(`Field delegate is not valid.`);
    }
  }

  getScope(): Scope {
    return this.delegate.getScope();
  }
}

class FieldCall extends Channel implements Scoped {
  private readonly field: Field;

  constructor(source: Abstract.FieldCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getScope();
    } else if (Guard.isSwitch(source.context)) {
      realScope = new Switch(source.context, domain, scope).getScope();
    }

    const field = realScope.getMember(source.name);

    if (!(field instanceof Field)) {
      throw new Error(`Field call to "${source.name}" is not valid.`);
    }

    this.field = field;
    this.field.connect(this);
  }

  getScope(): Scope {
    return this.field.getScope();
  }
}

class Method {
  private readonly source: Abstract.Method | [Primitive, Reducer];
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;
  private readonly memory: Map<Data | undefined, Data> = new Map();

  constructor(source: Abstract.Method | [Primitive, Reducer], domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  getResult(argument?: Data): Data {
    if (argument && this.memory.has(argument)) {
      return this.memory.get(argument)!;
    }

    if (Guard.isMethod(this.source)) {
      const innerScope = new StaticScope({}, this.scope);

      if (this.source.parameter && argument) {
        innerScope.addMembers({
          [this.source.parameter]: argument,
        });
      }

      let result: Data | undefined;

      if (Guard.isField(this.source.result)) {
        result = new Field(this.source.result, this.domain, innerScope);
      } else if (Guard.isFieldCall(this.source.result)) {
        result = new FieldCall(this.source.result, this.domain, innerScope);
      } else if (Guard.isMethodCall(this.source.result)) {
        result = new MethodCall(this.source.result, this.domain, innerScope);
      } else if (Guard.isSwitch(this.source.result)) {
        result = new Switch(this.source.result, this.domain, innerScope);
      } else {
        throw new Error(`Method result is not valid.`);
      }

      if (argument) {
        this.memory.set(argument, result);
      }

      return result;
    }

    const [publisher, reducer] = this.source;
    const value = reducer(argument);
    const result = new Primitive(value);

    const handler = () => {
      const nextValue = reducer(argument);
      result.handleEvent(nextValue);
    };

    publisher.connect(handler);
    argument?.connect(handler);

    if (argument) {
      this.memory.set(argument, result);
    }

    return result;
  }
}

class MethodCall extends Channel implements Scoped {
  private readonly result: Data;
  private readonly argument?: Data;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getScope();
    } else if (Guard.isSwitch(source.context)) {
      realScope = new Switch(source.context, domain, scope).getScope();
    }

    if (Guard.isField(source.argument)) {
      this.argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      this.argument = new FieldCall(source.argument, domain, scope);
    } else if (Guard.isMethodCall(source.argument)) {
      this.argument = new MethodCall(source.argument, domain, scope);
    } else if (Guard.isSwitch(source.argument)) {
      this.argument = new Switch(source.argument, domain, scope);
    }

    const method = realScope.getMember(source.name);

    if (method instanceof Method) {
      this.result = method.getResult(this.argument);
    } else if (typeof method === "function") {
      this.result = new Primitive(method(this.argument));
    } else {
      throw new Error(`Method call to "${source.name}" is not valid.`);
    }
  }

  getScope(): Scope {
    return this.result.getScope();
  }
}

class Switch extends Channel implements Scoped {
  private readonly condition: Data;
  private readonly publisher: Data;
  private readonly alternative?: Data;

  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    if (Guard.isField(source.condition)) {
      this.condition = new Field(source.condition, domain, scope);
    } else if (Guard.isFieldCall(source.condition)) {
      this.condition = new FieldCall(source.condition, domain, scope);
    } else if (Guard.isMethodCall(source.condition)) {
      this.condition = new MethodCall(source.condition, domain, scope);
    } else if (Guard.isSwitch(source.condition)) {
      this.condition = new Switch(source.condition, domain, scope);
    } else {
      throw new Error(`Switch condition is not valid.`);
    }

    if (Guard.isField(source.publisher)) {
      this.publisher = new Field(source.publisher, domain, scope);
    } else if (Guard.isFieldCall(source.publisher)) {
      this.publisher = new FieldCall(source.publisher, domain, scope);
    } else if (Guard.isMethodCall(source.publisher)) {
      this.publisher = new MethodCall(source.publisher, domain, scope);
    } else if (Guard.isSwitch(source.publisher)) {
      this.publisher = new Switch(source.publisher, domain, scope);
    } else {
      throw new Error(`Switch publisher is not valid.`);
    }

    if (Guard.isField(source.alternative)) {
      this.alternative = new Field(source.alternative, domain, scope);
    } else if (Guard.isFieldCall(source.alternative)) {
      this.alternative = new FieldCall(source.alternative, domain, scope);
    } else if (Guard.isMethodCall(source.alternative)) {
      this.alternative = new MethodCall(source.alternative, domain, scope);
    } else if (Guard.isSwitch(source.alternative)) {
      this.alternative = new Switch(source.alternative, domain, scope);
    } else if (source.alternative !== undefined) {
      throw new Error(`Switch alternative is not valid.`);
    }

    this.condition.connect((value) => {
      const nextValue = value ? this.publisher.getValue() : this.alternative?.getValue();
      this.publish(nextValue);
    });
  }

  getScope(): Scope {
    const conditionalValue = this.condition.getValue();
    const nextPublisher = conditionalValue ? this.publisher : this.alternative;

    return nextPublisher?.getScope() ?? new StaticScope();
  }
}

class Action implements Subscriber {
  private readonly source: Abstract.Action;
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;

  constructor(source: Abstract.Action, domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  handleEvent(argument?: Data): void {
    const innerScope = new StaticScope({}, this.scope);

    if (this.source.parameter && argument) {
      innerScope.addMembers({
        [this.source.parameter]: argument,
      });
    }

    this.source.steps.forEach((step) => {
      if (Guard.isActionCall(step)) {
        const subscriber = new ActionCall(step, this.domain, innerScope);
        subscriber.handleEvent();
      } else if (Guard.isOutput(step)) {
        const subscriber = new Output(step, this.domain, innerScope);
        subscriber.handleEvent();
      } else if (Guard.isException(step)) {
        const subscriber = new Exception(step, this.domain, innerScope);
        subscriber.handleEvent();
      } else {
        throw new Error(`Action step is not valid.`);
      }
    });
  }
}

class ActionCall implements Subscriber<undefined> {
  private readonly eventHandler: Reducer;
  private readonly argument?: Data;

  constructor(source: Abstract.ActionCall, domain: Abstract.App["domain"], scope: Scope) {
    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getScope();
    } else if (Guard.isSwitch(source.context)) {
      realScope = new Switch(source.context, domain, scope).getScope();
    }

    const action = realScope.getMember(source.name);

    if (action instanceof Action) {
      this.eventHandler = action.handleEvent;
    } else if (typeof action === "function") {
      this.eventHandler = action;
    } else {
      throw new Error(`Action call to "${source.name}" is not valid.`);
    }

    if (Guard.isField(source.argument)) {
      this.argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      this.argument = new FieldCall(source.argument, domain, scope);
    } else if (Guard.isMethodCall(source.argument)) {
      this.argument = new MethodCall(source.argument, domain, scope);
    } else if (Guard.isSwitch(source.argument)) {
      this.argument = new Switch(source.argument, domain, scope);
    } else if (source.argument !== undefined) {
      throw new Error(`Action call argument is not valid.`);
    }
  }

  handleEvent(): void {
    this.eventHandler(this.argument);
  }
}

class Output implements Subscriber<undefined> {
  private readonly output: Subscriber;
  private readonly argument?: Data;

  constructor(source: Abstract.Output, domain: Abstract.App["domain"], scope: Scope) {
    let output = scope.getMember(source.name);

    if (!isSubscriber(output)) {
      throw new Error(`Output to "${source.name}" is not valid.`);
    }

    this.output = output;

    if (Guard.isField(source.argument)) {
      this.argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      this.argument = new FieldCall(source.argument, domain, scope);
    } else if (Guard.isMethodCall(source.argument)) {
      this.argument = new MethodCall(source.argument, domain, scope);
    } else if (Guard.isSwitch(source.argument)) {
      this.argument = new Switch(source.argument, domain, scope);
    } else if (source.argument !== undefined) {
      throw new Error(`Output argument is not valid.`);
    }
  }

  handleEvent(): void {
    this.output.handleEvent(this.argument);
  }
}

class Exception implements Subscriber<undefined> {
  constructor(source: Abstract.Exception, domain: Abstract.App["domain"], scope: Scope) {
    // TODO: Implement for v0.5 (Espresso).
  }

  handleEvent(): void {
    // TODO: Implement for v0.5 (Espresso).
  }
}
