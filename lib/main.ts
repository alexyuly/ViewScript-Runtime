import type { Abstract } from "./abstract";
import { isFeature, isLandscape, isField, isAction } from "./abstract/guards";
import { Publisher, Subscriber } from "./pubsub";

export class App {
  constructor(source: Abstract.App) {
    let render: Feature | Landscape;

    if (isFeature(source.render)) {
      render = new Feature(source.render);
    } else if (isLandscape(source.render)) {
      render = new Landscape(source.render);
    } else {
      throw new Error(`Invalid render: ${source.render}`);
    }

    render.sendTo(document.body.append);
  }
}

class Feature extends Publisher<HTMLElement> {
  constructor(source: Abstract.Feature) {
    super();

    const htmlElement = document.createElement(source.tagName);

    for (const [name, property] of Object.entries(source.properties)) {
      if (isField(property)) {
        const field = new Field(property);
        field.sendTo((value) => {
          if (name === "content") {
            htmlElement.replaceChildren(
              ...(function r(nextValue = value) {
                const result: Array<HTMLElement | string> = [];
                if (nextValue instanceof Array) {
                  for (const child of nextValue) {
                    result.push(...r(child));
                  }
                } else if (nextValue instanceof Feature || nextValue instanceof Landscape) {
                  nextValue.sendTo(result.push);
                } else {
                  result.push((nextValue ?? "") as string);
                }
                return result;
              })(),
            );
          } else if (CSS.supports(name, value as string)) {
            htmlElement.style.setProperty(name, value as string);
          } else if (value === true) {
            htmlElement.setAttribute(name, name);
          } else if (value !== false && value !== null && value !== undefined) {
            htmlElement.setAttribute(name, value as string);
          } else {
            htmlElement.style.removeProperty(name);
            htmlElement.removeAttribute(name);
          }
        });
      } else if (isAction(property)) {
        const action = new Action(property);
        htmlElement.addEventListener(name, action);
      } else {
        throw new Error(`Invalid property: ${property}`);
      }
    }

    this.publish(htmlElement);
  }
}

class Landscape extends Publisher<HTMLElement> {
  constructor(source: Abstract.Landscape) {
    super();
    // TODO
  }
}

class Field extends Publisher {
  constructor(source: Abstract.Field) {
    super();
    // TODO
  }
}

class Action implements Subscriber {
  constructor(source: Abstract.Action) {
    // TODO
  }

  handleEvent(event: unknown) {
    // TODO
  }
}
