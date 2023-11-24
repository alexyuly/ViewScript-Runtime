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
            if (element instanceof FieldCall) {
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
      if (Guard.isFieldCall(property)) {
        const publisher = new FieldCall(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isMethodCall(property)) {
        const publisher = new MethodCall(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isSwitch(property)) {
        const publisher = new Switch(property, domain, scope);
        publisher.sendTo(argumentListener(name));
      } else if (Guard.isActionCall(property)) {
        const subscriber = new ActionCall(property, domain, scope);
        element.addEventListener(name, subscriber.handleEvent);
      } else if (Guard.isStreamPointer(property)) {
        const subscriber = new StreamPointer(property, domain, scope);
        element.addEventListener(name, subscriber.handleEvent);
      } else {
        throw new Error(`Feature property "${name}" is not valid.`);
      }
    }

    this.publish(element);
  }
}

class Landscape extends Publisher<HTMLElement> {
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
      if (Guard.isFieldCall(property)) {
        innerScope[name] = new FieldCall(property, domain, scope);
      } else if (Guard.isMethodCall(property)) {
        innerScope[name] = new MethodCall(property, domain, scope);
      } else if (Guard.isSwitch(property)) {
        innerScope[name] = new Switch(property, domain, scope);
      } else if (Guard.isActionCall(property)) {
        innerScope[name] = new ActionCall(property, domain, scope);
      } else if (Guard.isStreamPointer(property)) {
        innerScope[name] = new StreamPointer(property, domain, scope);
      } else {
        throw new Error(`Landscape property "${name}" is not valid.`);
      }
    }

    Guard.isFeature(view.render)
      ? new Feature(view.render, domain, innerScope)
      : new Landscape(view.render, domain, innerScope);
  }
}
