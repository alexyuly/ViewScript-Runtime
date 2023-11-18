import type { Abstract } from "./abstract";
import { isFeature, isLandscape, isField, isMethod, isAction } from "./abstract/guards";

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

    render.sendTo(window.document.body.append);
  }
}

class Feature {
  constructor(source: Abstract.Feature) {
    const htmlElement = window.document.createElement(source.tagName);

    for (const [name, property] of Object.entries(source.properties)) {
      if (isField(property)) {
        const field = new Field(property);
        field.sendTo((value) => {
          if (CSS.supports(name, value)) {
            if (value === false || value === null || value === undefined) {
              htmlElement.style.removeProperty(name);
            } else {
              htmlElement.style.setProperty(name, value);
            }
          } else {
            if (value === false || value === null || value === undefined) {
              htmlElement.removeAttribute(name);
            } else {
              htmlElement.setAttribute(name, value);
            }
          }
        });
      } else if (isAction(property)) {
        const action = new Action(property);
        htmlElement.addEventListener(name, action);
      } else {
        throw new Error(`Invalid property: ${property}`);
      }
    }
  }

  sendTo(app: App) {
    // TODO
  }
}

class Landscape {
  constructor(source: Abstract.Landscape) {
    // TODO
  }

  sendTo(app: App) {
    // TODO
  }
}
