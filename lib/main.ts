import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Exchange, Publisher, Subscriber } from "./pubsub";

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

    render.sendTo(document.body.append);
  }
}

class Feature extends Publisher<HTMLElement> {
  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const htmlElement = document.createElement(source.tagName);

    const argumentListener = (name: string) => (value: unknown) => {
      if (name === "content") {
        const result: Array<any> = [];
        if (value instanceof Array) {
          value.forEach((arrayElement, index) => {
            if (arrayElement instanceof Publisher) {
              // TODO Unsubscribe these listeners when a new value is received:
              arrayElement.sendTo((arrayElementValue) => {
                if (result[index] === undefined) {
                  result[index] = arrayElementValue;
                } else {
                  htmlElement.replaceChild(arrayElementValue, result[index]);
                }
              });
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

    for (const [name, property] of Object.entries(source.properties)) {
      if (Guard.isField(property)) {
        const publisher = new Field(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isFieldCall(property)) {
        const publisher = new FieldCall(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isMethodCall(property)) {
        const publisher = new MethodCall(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isSwitch(property)) {
        const publisher = new Switch(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isAction(property)) {
        const subscriber = new Action(property, domain, scope);
        htmlElement.addEventListener(name, subscriber.handleEvent);
      } else if (Guard.isActionCall(property)) {
        const subscriber = new ActionCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber.handleEvent);
      } else if (Guard.isStreamCall(property)) {
        const subscriber = new StreamCall(property, domain, scope);
        htmlElement.addEventListener(name, subscriber.handleEvent);
      } else {
        throw new Error(`Feature property "${name}" is not valid.`);
      }
    }

    this.publish(htmlElement);
  }
}

class Landscape extends Exchange<HTMLElement> {
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

    render.sendTo(this);
  }
}

class Field extends Exchange {
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

    publisher.sendTo(this);
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

  createYield(argument?: Field) {
    // TODO
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

class Stream extends Exchange {
  constructor() {
    super();
  }
}

class FieldCall extends Exchange {
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
      throw new Error(`Field call "${source.name}" is not valid.`);
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

class MethodCall extends Exchange {
  private readonly method: Method | ((argument: unknown) => unknown);

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

    const method = realScope[source.name];

    if (!(method instanceof Method)) {
      throw new Error(`Method call "${source.name}" is not valid.`);
    }

    this.method = method;
  }

  // getScope(): Scope {
  //   return this.method.getScope();
  // }
}
