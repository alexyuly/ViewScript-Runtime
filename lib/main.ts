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
  private readonly publisher: Store | Switch | FieldCall | MethodCall;

  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    if (isStore(source.publisher)) {
      this.publisher = new Store(source.publisher, domain, scope);
    } else if (isSwitch(source.publisher)) {
      this.publisher = new Switch(source.publisher, domain, scope);
    } else if (isFieldCall(source.publisher)) {
      this.publisher = new FieldCall(source.publisher, domain, scope);
    } else if (isMethodCall(source.publisher)) {
      this.publisher = new MethodCall(source.publisher, domain, scope);
    } else {
      throw new Error(`Invalid field publisher: ${JSON.stringify(source.publisher)}`);
    }

    this.publisher.sendTo(this);
  }

  getScope(): Scope {
    return this.publisher.getScope();
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
  private readonly scope: Scope;

  constructor(source: Abstract.Store, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    if (isFeature(source.content)) {
      const feature = new Feature(source.content, domain, scope);
      feature.sendTo(this);
      this.scope = {};
    } else if (isLandscape(source.content)) {
      const landscape = new Landscape(source.content, domain, scope);
      landscape.sendTo(this);
      this.scope = {};
    } else if (isPart(source.content)) {
      const part = new Part(source.content, domain, scope);
      part.sendTo(this);
      this.scope = part.getScope();
    } else if (isStructure(source.content)) {
      const structure = new Structure(source.content, domain, scope);
      this.scope = structure.getScope();
    } else {
      throw new Error(`Invalid store content: ${JSON.stringify(source.content)}`);
    }
  }

  getScope(): Scope {
    return this.scope;
  }
}

class Switch extends Publisher {
  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    const condition = new Field(source.condition, domain, scope);
    const positive = new Field(source.positive, domain, scope);
    const negative = source.negative && new Field(source.negative, domain, scope);

    condition.sendTo((value) => {
      this.publish((value ? positive : negative)?.getValue());
    });
  }

  getScope(): Scope {
    // TODO
  }
}

class FieldCall extends Pubsubber {
  constructor(source: Abstract.FieldCall, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    const callScope = source.scope ? new Field(source.scope, domain, scope).getScope() : scope;
    const field = callScope[source.name];

    if (!(field instanceof Field)) {
      throw new Error(`Invalid field at \`${source.name}\`: ${JSON.stringify(field)}`);
    }

    field.sendTo(this);
  }

  getScope(): Scope {
    // TODO
  }
}

class MethodCall extends Pubsubber {
  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    const callScope = source.scope ? new Field(source.scope, domain, scope).getScope() : scope;
    const method = callScope[source.name];

    if (!isMethod(method)) {
      throw new Error(`Invalid method at \`${source.name}\`: ${JSON.stringify(method)}`);
    }

    const resultScope = { ...callScope };

    if (method.parameter && source.argument) {
      resultScope[method.parameter.name] = new Field(source.argument, domain, scope);
    }

    const result = new Field(method.result, domain, resultScope);

    result.sendTo(this);
  }

  getScope(): Scope {
    // TODO
  }
}

/* Tier V */

class Part extends Publisher {
  constructor(source: Abstract.Part, domain: Abstract.App["domain"], scope: Scope = {}) {
    super();

    this.publish(source.value);
  }

  getScope(): Scope {
    // TODO
  }
}

class Structure {
  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope = {}) {
    // TODO
  }

  getScope(): Scope {
    // TODO
  }
}
