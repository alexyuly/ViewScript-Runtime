import type { Abstract } from "./abstract";
import {
  isView,
  isFeature,
  isLandscape,
  isField,
  isMethod,
  isAction,
  isStream,
  isParameter,
  isStore,
  isSwitch,
  isFieldCall,
  isMethodCall,
  isPart,
  isStructure,
} from "./abstract/guards";
import { Publisher, Pubsubber, Subscriber } from "./pubsub";

type Scope = Record<string, Field | Abstract.Method | Action | Stream>;

/* Tier I */

export class App {
  constructor(source: Abstract.App) {
    let render: Feature | Landscape;

    if (isFeature(source.render)) {
      render = new Feature(source.render, source.domain);
    } else if (isLandscape(source.render)) {
      render = new Landscape(source.render, source.domain);
    } else {
      throw new Error(`Invalid app render: ${JSON.stringify(source.render)}`);
    }

    render.sendTo(document.body.append);
  }
}

/* Tier II */

class Feature extends Publisher<HTMLElement> {
  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    const htmlElement = document.createElement(source.tagName);

    for (const [name, property] of Object.entries(source.properties)) {
      if (isField(property)) {
        const field = new Field(property, domain);
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
        const action = new Action(property, domain);
        htmlElement.addEventListener(name, action);
      } else {
        throw new Error(`Invalid property at \`${name}\`: ${JSON.stringify(property)}`);
      }
    }

    this.publish(htmlElement);
  }
}

class Landscape extends Pubsubber<HTMLElement> {
  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    const view = domain[source.viewName];

    if (!isView(view)) {
      throw new Error(`Invalid view at \`${source.viewName}\`: ${JSON.stringify(view)}`);
    }

    const viewScope = Object.entries(view.scope).reduce<Scope>(
      (scope, [name, member]) => {
        const appliedMember = name in source.properties ? source.properties[name] : member;
        if (isField(appliedMember)) {
          scope[name] = new Field(appliedMember, domain);
        } else if (isMethod(appliedMember)) {
          scope[name] = appliedMember;
        } else if (isAction(appliedMember)) {
          scope[name] = new Action(appliedMember, domain);
        } else if (isStream(appliedMember)) {
          scope[name] = new Stream(appliedMember);
        } else {
          throw new Error(`Invalid member at \`${name}\`: ${JSON.stringify(member)}`);
        }
        return scope;
      },
      { ...scope },
    );

    let render: Feature | Landscape;

    if (isFeature(view.render)) {
      render = new Feature(view.render, domain, viewScope);
    } else if (isLandscape(view.render)) {
      render = new Landscape(view.render, domain, viewScope);
    } else {
      throw new Error(`Invalid view render: ${JSON.stringify(view.render)}`);
    }

    render.sendTo(this);
  }
}

/* Tier III */

class Field extends Pubsubber {
  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    let publisher: Store | Switch | FieldCall | MethodCall;

    if (isParameter(source.publisher)) {
      throw new Error(`Parametric field is not allowed: ${JSON.stringify(source.publisher)}`);
    } else if (isStore(source.publisher)) {
      publisher = new Store(source.publisher, domain, scope);
    } else if (isSwitch(source.publisher)) {
      publisher = new Switch(source.publisher, domain, scope);
    } else if (isFieldCall(source.publisher)) {
      publisher = new FieldCall(source.publisher, domain, scope);
    } else if (isMethodCall(source.publisher)) {
      publisher = new MethodCall(source.publisher, domain, scope);
    } else {
      throw new Error(`Invalid field publisher: ${JSON.stringify(source.publisher)}`);
    }

    publisher.sendTo(this);
  }
}

class Action implements Subscriber {
  constructor(source: Abstract.Action, domain: Abstract.App["domain"]) {
    // TODO
  }

  handleEvent(event: unknown) {
    // TODO
  }
}

class Stream extends Pubsubber {
  constructor(source: Abstract.Stream) {
    super();
    // TODO Anything else?
  }
}

/* Tier IV */

class Store extends Pubsubber {
  constructor(source: Abstract.Store, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    if (isFeature(source.content)) {
      const feature = new Feature(source.content, domain, scope);
      feature.sendTo(this);
    } else if (isLandscape(source.content)) {
      const landscape = new Landscape(source.content, domain, scope);
      landscape.sendTo(this);
    } else if (isPart(source.content)) {
      this.publish(source.content.value);
    } else if (isStructure(source.content)) {
      new Structure(source.content, domain, scope);
    } else {
      throw new Error(`Invalid store content: ${JSON.stringify(source.content)}`);
    }
  }
}

/* Tier V */

class Structure {
  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope = {}) {
    // TODO
  }
}
