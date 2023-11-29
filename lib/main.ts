import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Channel, Publisher, Subscriber, isSubscriber } from "./pubsub";

type Data = Field | FieldCall | MethodCall | Primitive | Switch;
type Property = Action | ActionCall | Field | FieldCall | MethodCall | StreamCall | Switch;
type Reducer = (argument?: Data) => unknown;
type Scope = Record<string, Method | Primitive | Property>;

interface Scoped {
  getScope(): Scope;
}

export class App {
  constructor(source: Abstract.App) {
    let render: Feature | Landscape;

    if (Guard.isFeature(source.render)) {
      render = new Feature(source.render, source.domain, {});
    } else if (Guard.isLandscape(source.render)) {
      render = new Landscape(source.render, source.domain, {});
    } else {
      throw new Error(`App render is not valid.`);
    }

    render.connect(document.body.append);
  }
}

class Feature extends Publisher<HTMLElement> implements Scoped {
  private readonly properties: Record<string, Property> = {};

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

    Object.entries(source.properties).forEach(([name, property]) => {
      if (Guard.isField(property)) {
        const publisher = new Field(property, domain, scope);
        publisher.connect(propertyListener(name));
        this.properties[name] = publisher;
      } else if (Guard.isFieldCall(property)) {
        const publisher = new FieldCall(property, domain, scope);
        publisher.connect(propertyListener(name));
        this.properties[name] = publisher;
      } else if (Guard.isMethodCall(property)) {
        const publisher = new MethodCall(property, domain, scope);
        publisher.connect(propertyListener(name));
        this.properties[name] = publisher;
      } else if (Guard.isSwitch(property)) {
        const publisher = new Switch(property, domain, scope);
        publisher.connect(propertyListener(name));
        this.properties[name] = publisher;
      } else if (Guard.isAction(property)) {
        const subscriber = new Action(property, domain, scope);
        htmlElement.addEventListener(name, (value) => {
          const event = new Primitive(value, domain, scope);
          subscriber.handleEvent(event);
        });
        this.properties[name] = subscriber;
      } else if (Guard.isActionCall(property)) {
        const subscriber = new ActionCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber);
        this.properties[name] = subscriber;
      } else if (Guard.isStreamCall(property)) {
        const subscriber = new StreamCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber);
        this.properties[name] = subscriber;
      } else {
        throw new Error(`Feature property "${name}" is not valid.`);
      }
    });

    this.publish(htmlElement);
  }

  getScope(): Scope {
    return {};
  }
}

class Landscape extends Channel<HTMLElement> implements Scoped {
  private readonly innerScope: Scope = {};

  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const view = domain[source.viewName];

    if (!Guard.isView(view)) {
      throw new Error(`View "${source.viewName}" is not valid.`);
    }

    Object.entries(view.scope).forEach(([name, member]) => {
      if (Guard.isField(member)) {
        this.innerScope[name] = new Field(member, domain, this.innerScope);
      } else {
        throw new Error(`Member "${name}" of view "${source.viewName}" is not valid.`);
      }
    });

    Object.entries(source.properties).forEach(([name, property]) => {
      if (Guard.isField(property)) {
        this.innerScope[name] = new Field(property, domain, scope);
      } else if (Guard.isFieldCall(property)) {
        this.innerScope[name] = new FieldCall(property, domain, scope);
      } else if (Guard.isMethodCall(property)) {
        this.innerScope[name] = new MethodCall(property, domain, scope);
      } else if (Guard.isSwitch(property)) {
        this.innerScope[name] = new Switch(property, domain, scope);
      } else if (Guard.isAction(property)) {
        this.innerScope[name] = new Action(property, domain, scope);
      } else if (Guard.isActionCall(property)) {
        this.innerScope[name] = new ActionCall(property, domain, scope);
      } else if (Guard.isStreamCall(property)) {
        this.innerScope[name] = new StreamCall(property, domain, scope);
      } else {
        throw new Error(`Landscape property "${name}" is not valid.`);
      }
    });

    let render: Feature | Landscape;

    if (Guard.isFeature(view.render)) {
      render = new Feature(view.render, domain, this.innerScope);
    } else if (Guard.isLandscape(view.render)) {
      render = new Landscape(view.render, domain, this.innerScope);
    } else {
      throw new Error(`Render of view "${source.viewName}" is not valid.`);
    }

    render.connect(this);
  }

  getScope(): Scope {
    return {};
  }
}

class Primitive extends Channel implements Scoped {
  private readonly outerScope: Scope = {};

  constructor(value: unknown, domain: Abstract.App["domain"], scope: Scope) {
    super();

    Object.assign(this.outerScope, {
      is: new Method([this, (argument) => this.getValue() === argument?.getValue()], domain, scope),
      setTo: new Action((argument) => this.publish(argument?.getValue()), domain, scope),
    });

    if (value instanceof Array) {
      // TODO Cache array element results from unchanged elements. See Feature propertyListener for inspiration?

      Object.assign(this.outerScope, {
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
                const innerResult = innerMethod.createResult(innerValue);
                return innerResult;
              });
              return outerResult;
            },
          ],
          domain,
          scope,
        ),
        push: new Action((argument) => this.publish([...(this.getValue() as Array<Data>), argument]), domain, scope),
      });

      const hydratedValue: Array<Data> = value.map((arrayElement) => {
        if (Guard.isField(arrayElement)) return new Field(arrayElement, domain, scope);
        if (Guard.isFieldCall(arrayElement)) return new FieldCall(arrayElement, domain, scope);
        if (Guard.isMethodCall(arrayElement)) return new MethodCall(arrayElement, domain, scope);
        if (Guard.isSwitch(arrayElement)) return new Switch(arrayElement, domain, scope);
        throw new Error(`Array element is not valid.`);
      });

      this.publish(hydratedValue);
    } else {
      if (typeof value === "number") {
        const addition = (argument?: Data) => (this.getValue() as number) + (argument?.getValue() as number);
        const multiplication = (argument?: Data) => (this.getValue() as number) * (argument?.getValue() as number);

        Object.assign(this.outerScope, {
          add: new Action((argument) => this.publish(addition(argument)), domain, scope),
          isAtLeast: new Method(
            [this, (argument) => (this.getValue() as number) >= (argument?.getValue() as number)],
            domain,
            scope,
          ),
          multiply: new Action((argument) => this.publish(multiplication(argument)), domain, scope),
          plus: new Method([this, addition], domain, scope),
          times: new Method([this, multiplication], domain, scope),
        });
      } else if (typeof value === "boolean") {
        const inversion = (argument?: Data) => !argument?.getValue();

        Object.assign(this.outerScope, {
          and: new Method([this, (argument) => this.getValue() && argument?.getValue()], domain, scope),
          not: new Method([this, inversion], domain, scope),
          or: new Method([this, (argument) => this.getValue() || argument?.getValue()], domain, scope),
          toggle: new Action((argument) => this.publish(inversion(argument)), domain, scope),
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
  private readonly outerScope: Scope = {};

  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    const model = domain[source.modelName];

    if (!Guard.isModel(model)) {
      throw new Error(`Model "${source.modelName}" is not valid.`);
    }

    Object.entries(model.scope).forEach(([name, member]) => {
      if (Guard.isField(member)) {
        this.outerScope[name] = new Field(member, domain, this.outerScope);
      } else if (Guard.isMethod(member)) {
        this.outerScope[name] = new Method(member, domain, this.outerScope);
      } else if (Guard.isAction(member)) {
        this.outerScope[name] = new Action(member, domain, this.outerScope);
      } else {
        throw new Error(`Member "${name}" of model "${source.modelName}" is not valid.`);
      }
    });

    Object.entries(source.properties).forEach(([name, property]) => {
      if (Guard.isField(property)) {
        this.outerScope[name] = new Field(property, domain, scope);
      } else if (Guard.isFieldCall(property)) {
        this.outerScope[name] = new FieldCall(property, domain, scope);
      } else if (Guard.isMethodCall(property)) {
        this.outerScope[name] = new MethodCall(property, domain, scope);
      } else if (Guard.isSwitch(property)) {
        this.outerScope[name] = new Switch(property, domain, scope);
      } else {
        throw new Error(`Structure property "${name}" is not valid.`);
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
    }

    const field = realScope[source.name];

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

  constructor(source: Abstract.Method | [Primitive, Reducer], domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  createResult(argument?: Data): Data {
    if (Guard.isMethod(this.source)) {
      const innerScope: Scope = { ...this.scope };

      if (this.source.parameter && argument) {
        innerScope[this.source.parameter] = argument;
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

      return result;
    }

    const [publisher, reducer] = this.source;
    const value = reducer(argument);
    const result = new Primitive(value, this.domain, this.scope);

    const handler = () => {
      const nextValue = reducer(argument);
      result.handleEvent(nextValue);
    };

    publisher.connect(handler);
    argument?.connect(handler);

    return result;
  }
}

class MethodCall extends Channel implements Scoped {
  private readonly result: Data;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getScope();
    }

    let argument: Field | FieldCall | MethodCall | Switch | undefined;

    if (Guard.isField(source.argument)) {
      argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      argument = new FieldCall(source.argument, domain, scope);
    } else if (Guard.isMethodCall(source.argument)) {
      argument = new MethodCall(source.argument, domain, scope);
    } else if (Guard.isSwitch(source.argument)) {
      argument = new Switch(source.argument, domain, scope);
    }

    const method = realScope[source.name];

    if (method instanceof Method) {
      this.result = method.createResult(argument);
    } else {
      throw new Error(`Method call to "${source.name}" is not valid.`);
    }
  }

  getScope(): Scope {
    return this.result.getScope();
  }
}

class Switch extends Channel implements Scoped {
  private readonly condition: Field | FieldCall | MethodCall;
  private readonly publisher: Field | FieldCall | MethodCall | Switch;
  private readonly alternative?: Field | FieldCall | MethodCall | Switch;

  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    if (Guard.isField(source.condition)) {
      this.condition = new Field(source.condition, domain, scope);
    } else if (Guard.isFieldCall(source.condition)) {
      this.condition = new FieldCall(source.condition, domain, scope);
    } else if (Guard.isMethodCall(source.condition)) {
      this.condition = new MethodCall(source.condition, domain, scope);
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

    return nextPublisher?.getScope() ?? {};
  }
}

class Action implements Subscriber {
  private readonly source: Abstract.Action | Reducer;
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;

  constructor(source: Abstract.Action | Reducer, domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  handleEvent(argument?: Data): void {
    if (Guard.isAction(this.source)) {
      const innerScope: Scope = { ...this.scope };

      if (this.source.parameter && argument) {
        innerScope[this.source.parameter] = argument;
      }

      this.source.steps.forEach((step) => {
        if (Guard.isActionCall(step)) {
          const subscriber = new ActionCall(step, this.domain, innerScope);
          subscriber.handleEvent();
        } else if (Guard.isStreamCall(step)) {
          const subscriber = new StreamCall(step, this.domain, innerScope);
          subscriber.handleEvent();
        } else if (Guard.isException(step)) {
          const subscriber = new Exception(step, this.domain, innerScope);
          subscriber.handleEvent();
        } else {
          throw new Error(`Action step is not valid.`);
        }
      });
    } else {
      this.source(argument);
    }
  }
}

class ActionCall implements Subscriber<undefined> {
  private readonly action: Action;
  private readonly argument?: Data;

  constructor(source: Abstract.ActionCall, domain: Abstract.App["domain"], scope: Scope) {
    let action: Action | undefined;
    let currentScope = scope;

    const address = [...source.address];

    if (address.length === 0) {
      throw new Error(`Action call address is empty.`);
    }

    while (address.length > 0) {
      const name = address.shift()!;
      const member = currentScope[name];

      if (address.length === 0 && member instanceof Action) {
        action = member;
      } else if (address.length > 0 && (member instanceof Field || member instanceof FieldCall)) {
        currentScope = member.getScope();
      } else {
        throw new Error(`Action call address is not valid.`);
      }
    }

    if (!(action instanceof Action)) {
      throw new Error(`Action call address is not valid.`);
    }

    this.action = action;

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
    this.action.handleEvent(this.argument);
  }
}

class StreamCall implements Subscriber<undefined> {
  private readonly stream: Subscriber;
  private readonly argument?: Data;

  constructor(source: Abstract.StreamCall, domain: Abstract.App["domain"], scope: Scope) {
    let stream = scope[source.name];

    if (!isSubscriber(stream)) {
      throw new Error(`Stream call to "${source.name}" is not valid.`);
    }

    this.stream = stream;

    if (Guard.isField(source.argument)) {
      this.argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      this.argument = new FieldCall(source.argument, domain, scope);
    } else if (Guard.isMethodCall(source.argument)) {
      this.argument = new MethodCall(source.argument, domain, scope);
    } else if (Guard.isSwitch(source.argument)) {
      this.argument = new Switch(source.argument, domain, scope);
    } else if (source.argument !== undefined) {
      throw new Error(`Stream call argument is not valid.`);
    }
  }

  handleEvent(): void {
    this.stream.handleEvent(this.argument);
  }
}

class Exception implements Subscriber<undefined> {
  constructor(source: Abstract.Exception, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  handleEvent(): void {
    // TODO
  }
}
