import type { Abstract } from "./abstract";
import { Guard } from "./abstract/guard";
import { Publisher, Pubsubber, Subscriber } from "./pubsub";

type Scope = {}; // TODO

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
        if (value instanceof Array) {
          // TODO
        } else if (value instanceof HTMLElement) {
          // TODO
        } else {
          // TODO
        }
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
        throw new Error(`Property ${name} is not valid.`);
      }
    }

    this.publish(element);
  }
}
