import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Channel, Publisher, Subscriber } from "./pubsub";

type Logic = (argument: unknown) => unknown;
type Scope = Record<string, Logic | Method | Publisher | Subscriber>;

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

class Feature extends Publisher<HTMLElement> {
  private readonly properties: Record<string, Publisher | Subscriber> = {};

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
                result[index] = htmlElement;
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
        htmlElement.addEventListener(name, subscriber);
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

  getOuterScope(): Scope {
    return {};
  }
}

class Landscape extends Channel<HTMLElement> {
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
      } else if (Guard.isStream(member)) {
        this.innerScope[name] = new Stream();
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

    const render = Guard.isFeature(view.render)
      ? new Feature(view.render, domain, this.innerScope)
      : new Landscape(view.render, domain, this.innerScope);

    render.connect(this);
  }

  getOuterScope(): Scope {
    return {};
  }
}

class Primitive extends Publisher {
  constructor(source: Abstract.Primitive, domain: Abstract.App["domain"], scope: Scope) {
    super();

    // TODO Handle arrays...

    this.publish(source.value);
  }

  getOuterScope(): Scope {
    // TODO
    return {};
  }
}

class Structure {
  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  getOuterScope(): Scope {
    // TODO
    return {};
  }
}

class Field extends Channel {
  private readonly delegate: { getOuterScope(): Scope };

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
      const delegate = new Primitive(source.delegate, domain, scope);
      delegate.connect(this);
      this.delegate = delegate;
    } else if (Guard.isStructure(source.delegate)) {
      this.delegate = new Structure(source.delegate, domain, scope);
    } else {
      throw new Error(`Field delegate is not valid.`);
    }
  }

  getOuterScope(): Scope {
    return this.delegate.getOuterScope();
  }
}

class FieldCall extends Channel {
  private readonly field: Field;

  constructor(source: Abstract.FieldCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getOuterScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getOuterScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getOuterScope();
    }

    const field = realScope[source.name];

    if (!(field instanceof Field)) {
      throw new Error(`Field call to "${source.name}" is not valid.`);
    }

    this.field = field;
    this.field.connect(this);
  }

  getOuterScope(): Scope {
    return this.field.getOuterScope();
  }
}

class Method {
  private readonly source: Abstract.Method;
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;

  constructor(source: Abstract.Method, domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  createResult(argument?: Publisher): Field | MethodCall {
    const innerScope: Scope = { ...this.scope };

    if (this.source.parameter && argument) {
      innerScope[this.source.parameter] = argument;
    }

    const result = Guard.isField(this.source.result)
      ? new Field(this.source.result, this.domain, innerScope)
      : new MethodCall(this.source.result, this.domain, innerScope);

    return result;
  }
}

class MethodCall extends Channel {
  private readonly result: Field | MethodCall;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.context)) {
      realScope = new Field(source.context, domain, scope).getOuterScope();
    } else if (Guard.isFieldCall(source.context)) {
      realScope = new FieldCall(source.context, domain, scope).getOuterScope();
    } else if (Guard.isMethodCall(source.context)) {
      realScope = new MethodCall(source.context, domain, scope).getOuterScope();
    }

    let argument: Publisher | undefined;

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
    } else if (typeof method === "function") {
      this.result = new Field(
        {
          kind: "field",
          delegate: {
            kind: "primitive",
            value: method(argument), // TODO Keep this value up to date.
          },
        },
        domain,
        scope,
      );
    } else {
      throw new Error(`Method call to "${source.name}" is not valid.`);
    }
  }

  getOuterScope(): Scope {
    return this.result.getOuterScope();
  }
}

class Switch extends Channel {
  private readonly condition: Publisher;
  private readonly publisher: Publisher;
  private readonly alternative?: Publisher;

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
    }

    this.condition.connect((value) => {
      const nextValue = value ? this.publisher.getValue() : this.alternative?.getValue();
      this.publish(nextValue);
    });
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

  handleEvent(event: unknown) {
    const innerScope: Scope = { ...this.scope };

    if (this.source.parameter) {
      innerScope[this.source.parameter] =
        event instanceof Field
          ? event
          : new Field(
              {
                kind: "field",
                delegate: {
                  kind: "primitive",
                  value: event,
                },
              },
              this.domain,
              innerScope,
            );
    }

    this.source.steps.forEach((step) => {
      if (Guard.isActionCall(step)) {
        const subscriber = new ActionCall(step, this.domain, innerScope);
        subscriber.handleEvent(event);
      } else if (Guard.isStreamCall(step)) {
        const subscriber = new StreamCall(step, this.domain, innerScope);
        subscriber.handleEvent(event);
      } else if (Guard.isException(step)) {
        const subscriber = new Exception(step, this.domain, innerScope);
        subscriber.handleEvent(event);
      } else {
        throw new Error(`Action step is not valid.`);
      }
    });
  }
}

class ActionCall implements Subscriber {
  constructor(source: Abstract.ActionCall, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}

class Stream extends Channel {
  constructor() {
    super();
  }
}

class StreamCall implements Subscriber {
  constructor(source: Abstract.StreamCall, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}

class Exception implements Subscriber {
  constructor(source: Abstract.Exception, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}
