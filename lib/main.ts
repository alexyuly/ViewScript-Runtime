import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Publisher, Pubsubber, Subscriber } from "./pubsub";

type Scope = Field | Method | Action | Stream;

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

    const element = document.createElement(source.tagName);

    const argumentListener = (name: string) => (value: unknown) => {
      if (name === "content") {
        const result: Array<HTMLElement | string> = [];
        if (value instanceof Array) {
          for (const [index, element] of Object.entries(value)) {
            if (element instanceof Publisher) {
              element.sendTo((elementValue) => {
                result[index as unknown as number] =
                  elementValue instanceof HTMLElement ? elementValue : String(elementValue);
              });
            } else {
              result[index as unknown as number] =
                element instanceof HTMLElement ? element : String(element);
            }
          }
        } else if (value instanceof HTMLElement) {
          result.push(value);
        } else {
          result.push(String(value));
        }
        element.replaceChildren(...result);
      } else if (CSS.supports(name, String(value))) {
        element.style.setProperty(name, String(value));
      } else if (value === true) {
        element.setAttribute(name, name);
      } else if (value === false || value === null || value === undefined) {
        element.style.removeProperty(name);
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, String(value));
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
        element.addEventListener(name, subscriber.handleEvent);
      } else if (Guard.isActionCall(property)) {
        const subscriber = new ActionCall(property, domain, scope);
        element.addEventListener(name, subscriber.handleEvent);
      } else if (Guard.isStreamCall(property)) {
        const subscriber = new StreamCall(property, domain, scope);
        element.addEventListener(name, subscriber.handleEvent);
      } else {
        throw new Error(`Feature property "${name}" is not valid.`);
      }
    }

    this.publish(element);
  }
}

class Landscape extends Pubsubber<HTMLElement> {
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
        innerScope[name] = new Stream(member, domain, innerScope);
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

class Field extends Pubsubber {
  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    let publisher: Publisher;

    if (Guard.isFeature(source.publisher)) {
      publisher = new Feature(source.publisher, domain, scope);
    } else if (Guard.isLandscape(source.publisher)) {
      publisher = new Landscape(source.publisher, domain, scope);
    } else if (Guard.isPrimitive(source.publisher)) {
      publisher = new Primitive(source.publisher, domain, scope);
    } else if (Guard.isStructure(source.publisher)) {
      publisher = new Structure(source.publisher, domain, scope);
    } else {
      throw new Error(`Field publisher is not valid.`);
    }

    publisher.sendTo(this);
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

  generate() {
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
