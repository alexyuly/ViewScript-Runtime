import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Channel, Publisher, Subscriber } from "./pubsub";

type Scope = Record<string, Field | Method | Action | Stream | ((argument: unknown) => unknown)>;

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

class FeatureDataSource implements Subscriber {
  private readonly cleanupTasks: Array<() => void> = [];
  private readonly htmlElement: HTMLElement;
  private readonly name: string;

  constructor(htmlElement: HTMLElement, name: string) {
    this.htmlElement = htmlElement;
    this.name = name;
  }

  handleEvent(value: unknown): void {
    this.cleanupTasks.forEach((cleanupTask) => {
      cleanupTask();
    });

    if (this.name === "content") {
      const result: Array<any> = [];

      if (value instanceof Array) {
        value.forEach((arrayElement, index) => {
          if (arrayElement instanceof Publisher) {
            const target = (arrayElementValue: any) => {
              if (result[index] === undefined) {
                result[index] = arrayElementValue;
              } else {
                this.htmlElement.replaceChild(arrayElementValue, result[index]);
              }
            };
            arrayElement.connect(target);
            const cleanupTask = () => {
              arrayElement.disconnect(target);
            };
            this.cleanupTasks.push(cleanupTask);
          } else {
            result[index] = this.htmlElement;
          }
        });
      } else {
        result.push(value);
      }

      this.htmlElement.replaceChildren(...result);
    } else if (CSS.supports(this.name, value as string)) {
      this.htmlElement.style.setProperty(this.name, value as string);
    } else if (value === true) {
      this.htmlElement.setAttribute(this.name, this.name);
    } else if (value === false || value === null || value === undefined) {
      this.htmlElement.style.removeProperty(this.name);
      this.htmlElement.removeAttribute(this.name);
    } else {
      this.htmlElement.setAttribute(this.name, value as string);
    }
  }
}

class Feature extends Publisher<HTMLElement> {
  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const htmlElement = document.createElement(source.tagName);

    Object.entries(source.properties).forEach(([name, property]) => {
      if (Guard.isField(property)) {
        const publisher = new Field(property, domain, scope);
        const subscriber = new FeatureDataSource(htmlElement, name);
        publisher.connect(subscriber);
      } else if (Guard.isFieldCall(property)) {
        const publisher = new FieldCall(property, domain, scope);
        const subscriber = new FeatureDataSource(htmlElement, name);
        publisher.connect(subscriber);
      } else if (Guard.isMethodCall(property)) {
        const publisher = new MethodCall(property, domain, scope);
        const subscriber = new FeatureDataSource(htmlElement, name);
        publisher.connect(subscriber);
      } else if (Guard.isSwitch(property)) {
        const publisher = new Switch(property, domain, scope);
        const subscriber = new FeatureDataSource(htmlElement, name);
        publisher.connect(subscriber);
      } else if (Guard.isAction(property)) {
        const subscriber = new Action(property, domain, scope);
        htmlElement.addEventListener(name, subscriber);
      } else if (Guard.isActionCall(property)) {
        const subscriber = new ActionCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber);
      } else if (Guard.isStreamCall(property)) {
        const subscriber = new StreamCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber);
      } else {
        throw new Error(`Feature property "${name}" is not valid.`);
      }
    });

    this.publish(htmlElement);
  }
}

class Landscape extends Channel<HTMLElement> {
  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const view = domain[source.viewName];

    if (!Guard.isView(view)) {
      throw new Error(`View "${source.viewName}" is not valid.`);
    }

    const innerScope: Scope = {};

    for (const [name, member] of Object.entries(view.scope)) {
      if (Guard.isField(member)) {
        innerScope[name] = new Field(member, domain, innerScope);
      } else if (Guard.isStream(member)) {
        innerScope[name] = new Stream();
      } else {
        throw new Error(`Member "${name}" of view "${source.viewName}" is not valid.`);
      }
    }

    for (const [name, property] of Object.entries(source.properties)) {
      if (Guard.isField(property)) {
        innerScope[name] = new Field(property, domain, scope);
      } else if (Guard.isFieldCall(property)) {
        innerScope[name] = new FieldCall(property, domain, scope);
      } else if (Guard.isMethodCall(property)) {
        innerScope[name] = new MethodCall(property, domain, scope);
      } else if (Guard.isSwitch(property)) {
        innerScope[name] = new Switch(property, domain, scope);
      } else if (Guard.isAction(property)) {
        innerScope[name] = new Action(property, domain, scope);
      } else if (Guard.isActionCall(property)) {
        innerScope[name] = new ActionCall(property, domain, scope);
      } else if (Guard.isStreamCall(property)) {
        innerScope[name] = new StreamCall(property, domain, scope);
      } else {
        throw new Error(`Landscape property "${name}" is not valid.`);
      }
    }

    const render = Guard.isFeature(view.render)
      ? new Feature(view.render, domain, innerScope)
      : new Landscape(view.render, domain, innerScope);

    render.connect(this);
  }
}

class Field extends Channel {
  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let publisher: Publisher;

    if (Guard.isPrimitive(source.publisher)) {
      publisher = new Primitive(source.publisher, domain, scope);
    } else if (Guard.isStructure(source.publisher)) {
      publisher = new Structure(source.publisher, domain, scope);
    } else if (Guard.isFeature(source.publisher)) {
      publisher = new Feature(source.publisher, domain, scope);
    } else if (Guard.isLandscape(source.publisher)) {
      publisher = new Landscape(source.publisher, domain, scope);
    } else {
      throw new Error(`Field publisher is not valid.`);
    }

    publisher.connect(this);
  }

  getScope(): Scope {
    // TODO
    return {};
  }

  getValue() {
    // TODO
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

  createResult(argument?: Field): Field | MethodCall {
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
                publisher: {
                  kind: "primitive",
                  value: event,
                },
              },
              this.domain,
              innerScope,
            );
    }

    for (const step of this.source.steps) {
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
    }
  }
}

/**
 * A stream is functionally equivalent to a channel, but with different semantics because of its usage.
 * A stream is a member of a view which publishes to its parent view.
 */
class Stream extends Channel {
  constructor() {
    super();
  }
}

class FieldCall extends Channel {
  private readonly field: Field;

  constructor(source: Abstract.FieldCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.scope)) {
      realScope = new Field(source.scope, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.scope)) {
      realScope = new FieldCall(source.scope, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.scope)) {
      realScope = new MethodCall(source.scope, domain, scope).getScope();
    }

    const field = realScope[source.name];

    if (!(field instanceof Field)) {
      throw new Error(`Field call to "${source.name}" is not valid.`);
    }

    this.field = field;
  }

  getField(): Field {
    return this.field;
  }

  getScope(): Scope {
    return this.field.getScope();
  }
}

class MethodCall extends Channel {
  private readonly result: Field | MethodCall;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let realScope = scope;

    if (Guard.isField(source.scope)) {
      realScope = new Field(source.scope, domain, scope).getScope();
    } else if (Guard.isFieldCall(source.scope)) {
      realScope = new FieldCall(source.scope, domain, scope).getScope();
    } else if (Guard.isMethodCall(source.scope)) {
      realScope = new MethodCall(source.scope, domain, scope).getScope();
    }

    let argument: Field | undefined;

    if (Guard.isField(source.argument)) {
      argument = new Field(source.argument, domain, scope);
    } else if (Guard.isFieldCall(source.argument)) {
      argument = new FieldCall(source.argument, domain, scope).getField();
    } else if (Guard.isMethodCall(source.argument)) {
      argument = new MethodCall(source.argument, domain, scope).getField();
    } else if (Guard.isSwitch(source.argument)) {
      // argument = new Switch(source.argument, domain, scope).getField();
    }

    const method = realScope[source.name];

    if (method instanceof Method) {
      this.result = method.createResult(argument);
    } else if (typeof method === "function") {
      // TODO Publish a new result when the method's owner changes:
      this.result = new Field(
        {
          kind: "field",
          publisher: {
            kind: "primitive",
            value: method(argument),
          },
        },
        domain,
        scope,
      );
    } else {
      throw new Error(`Method call to "${source.name}" is not valid.`);
    }
  }

  getField(): Field {
    return this.result;
  }

  getScope(): Scope {
    return this.result.getScope();
  }
}

class Switch extends Channel {
  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let condition: Publisher;

    if (Guard.isField(source.condition)) {
      condition = new Field(source.condition, domain, scope);
    } else if (Guard.isFieldCall(source.condition)) {
      condition = new FieldCall(source.condition, domain, scope).getField();
    } else if (Guard.isMethodCall(source.condition)) {
      condition = new MethodCall(source.condition, domain, scope).getField();
    }

    let publisherIfTrue: Publisher;

    if (Guard.isField(source.publisherIfTrue)) {
      publisherIfTrue = new Field(source.publisherIfTrue, domain, scope);
    } else if (Guard.isFieldCall(source.publisherIfTrue)) {
      publisherIfTrue = new FieldCall(source.publisherIfTrue, domain, scope).getField();
    } else if (Guard.isMethodCall(source.publisherIfTrue)) {
      publisherIfTrue = new MethodCall(source.publisherIfTrue, domain, scope).getField();
    } else if (Guard.isSwitch(source.publisherIfTrue)) {
      publisherIfTrue = new Switch(source.publisherIfTrue, domain, scope).getField();
    }

    let publisherIfFalse: Publisher;

    if (Guard.isField(source.publisherIfFalse)) {
      publisherIfFalse = new Field(source.publisherIfFalse, domain, scope);
    } else if (Guard.isFieldCall(source.publisherIfFalse)) {
      publisherIfFalse = new FieldCall(source.publisherIfFalse, domain, scope).getField();
    } else if (Guard.isMethodCall(source.publisherIfFalse)) {
      publisherIfFalse = new MethodCall(source.publisherIfFalse, domain, scope).getField();
    } else if (Guard.isSwitch(source.publisherIfFalse)) {
      publisherIfFalse = new Switch(source.publisherIfFalse, domain, scope).getField();
    }
  }
}
