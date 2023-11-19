import type { Abstract } from "./abstract";
import {
  isModel,
  isView,
  isFeature,
  isLandscape,
  isField,
  isMethod,
  isAction,
  isStream,
  isStore,
  isSwitch,
  isFieldCall,
  isMethodCall,
  isPart,
  isStructure,
} from "./abstract/guards";
import { Publisher, Pubsubber, Subscriber } from "./pubsub";

type Scope = Record<
  string,
  Field | Abstract.Method | Action | Stream | ((argument: Field) => unknown)
>;

/* Tier I */

export class App {
  constructor(source: Abstract.App) {
    let render: Feature | Landscape;

    if (isFeature(source.render)) {
      render = new Feature(source.render, source.domain, {});
    } else if (isLandscape(source.render)) {
      render = new Landscape(source.render, source.domain, {});
    } else {
      throw new Error(`Invalid app render: ${JSON.stringify(source.render)}`);
    }

    render.sendTo(document.body.append);
  }
}

/* Tier II */

class Feature extends Publisher<HTMLElement> {
  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const htmlElement = document.createElement(source.tagName);

    for (const [name, property] of Object.entries(source.properties)) {
      if (isField(property)) {
        const field = new Field(property, domain, scope);
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
        const action = new Action(property, domain, scope);
        htmlElement.addEventListener(name, action);
      } else {
        throw new Error(`Invalid property at \`${name}\`: ${JSON.stringify(property)}`);
      }
    }

    this.publish(htmlElement);
  }
}

class Landscape extends Pubsubber<HTMLElement> {
  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const view = domain[source.viewName];

    if (!isView(view)) {
      throw new Error(`Invalid view at \`${source.viewName}\`: ${JSON.stringify(view)}`);
    }

    const viewScope = Object.entries(view.scope).reduce<Scope>(
      (accumulator, [name, member]) => {
        const appliedMember = name in source.properties ? source.properties[name] : member;
        if (isField(appliedMember)) {
          accumulator[name] = new Field(appliedMember, domain, scope);
        } else if (isMethod(appliedMember)) {
          accumulator[name] = appliedMember;
        } else if (isAction(appliedMember)) {
          accumulator[name] = new Action(appliedMember, domain, scope);
        } else if (isStream(appliedMember)) {
          accumulator[name] = new Stream(appliedMember, domain, scope);
        } else {
          throw new Error(`Invalid member at \`${name}\`: ${JSON.stringify(member)}`);
        }
        return accumulator;
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

  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
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
  constructor(source: Abstract.Action, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  handleEvent(event: unknown) {
    // TODO
  }
}

class Stream extends Pubsubber {
  constructor(source: Abstract.Stream, domain: Abstract.App["domain"], scope: Scope) {
    super();
    // TODO Anything else?
  }
}

/* Tier IV */

class Store extends Pubsubber {
  private readonly content: Feature | Landscape | Part | Structure;

  constructor(source: Abstract.Store, domain: Abstract.App["domain"], scope: Scope) {
    super();

    if (isFeature(source.content)) {
      const feature = new Feature(source.content, domain, scope);
      feature.sendTo(this);
      this.content = feature;
    } else if (isLandscape(source.content)) {
      const landscape = new Landscape(source.content, domain, scope);
      landscape.sendTo(this);
      this.content = landscape;
    } else if (isPart(source.content)) {
      const part = new Part(source.content, domain, scope, this);
      part.sendTo(this);
      this.content = part;
    } else if (isStructure(source.content)) {
      const structure = new Structure(source.content, domain, scope);
      this.content = structure;
    } else {
      throw new Error(`Invalid store content: ${JSON.stringify(source.content)}`);
    }
  }

  getScope(): Scope {
    if (this.content instanceof Feature || this.content instanceof Landscape) {
      return {};
    }

    return this.content.getScope();
  }
}

class Switch extends Publisher {
  private readonly condition: Field;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.condition = new Field(source.condition, domain, scope);
    this.positive = new Field(source.positive, domain, scope);
    this.negative = source.negative && new Field(source.negative, domain, scope);

    this.condition.sendTo((value) => {
      this.publish((value ? this.positive : this.negative).getValue());
    });
  }

  getScope(): Scope {
    const conditionalValue = this.condition.getValue();
    return (conditionalValue ? this.positive : this.negative).getScope();
  }
}

class FieldCall extends Pubsubber {
  private readonly field: Field;

  constructor(source: Abstract.FieldCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const callScope = source.scope ? new Field(source.scope, domain, scope).getScope() : scope;
    const field = callScope[source.name];

    if (!(field instanceof Field)) {
      throw new Error(`Invalid field at \`${source.name}\`: ${JSON.stringify(field)}`);
    }

    this.field = field;
    this.field.sendTo(this);
  }

  getScope(): Scope {
    return this.field.getScope();
  }
}

class MethodCall extends Pubsubber {
  private readonly result: Field;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
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

    this.result = new Field(method.result, domain, resultScope);
    this.result.sendTo(this);
  }

  getScope(): Scope {
    return this.result.getScope();
  }
}

/* Tier V */

class Part extends Publisher {
  private readonly scope: Scope = {};

  constructor(source: Abstract.Part, domain: Abstract.App["domain"], scope: Scope, store: Store) {
    super();

    if (source.value instanceof Array) {
      scope.push = (argument: Field) => {
        const storedValue = store.getValue();
        const nextValue = [...(storedValue instanceof Array ? storedValue : []), argument];
        store.handleEvent(nextValue);
      };
      scope.setTo = (argument: Field) => {
        const nextValue = argument.getValue();
        store.handleEvent(nextValue);
      };
      // TODO More...?
    } else if (typeof source.value === "boolean") {
      scope.not = () => {
        const nextValue = !store.getValue();
        return nextValue;
      };
      scope.setTo = (argument: Field) => {
        const nextValue = argument.getValue();
        store.handleEvent(nextValue);
      };
      scope.toggle = () => {
        const nextValue = !store.getValue();
        store.handleEvent(nextValue);
      };
      // TODO More...?
    } else if (typeof source.value === "number") {
      scope.add = (argument: Field) => {
        const storedValue = store.getValue();
        const nextValue = (storedValue as number) + (argument.getValue() as number);
        store.handleEvent(nextValue);
      };
      scope.isAtLeast = (argument: Field) => {
        const storedValue = store.getValue();
        const nextValue = (storedValue as number) >= (argument.getValue() as number);
        return nextValue;
      };
      scope.setTo = (argument: Field) => {
        const nextValue = argument.getValue();
        store.handleEvent(nextValue);
      };
      // TODO More...?
    } else if (typeof source.value === "string") {
      scope.setTo = (argument: Field) => {
        const nextValue = argument.getValue();
        store.handleEvent(nextValue);
      };
      // TODO More...?
    } else {
      // TODO More...?
    }

    // TODO Handle bigints?
    // TODO Handle symbols?

    this.publish(source.value);
  }

  getScope(): Scope {
    return this.scope;
  }
}

class Structure {
  private readonly scope: Scope;

  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    const model = domain[source.modelName];

    if (!isModel(model)) {
      throw new Error(`Invalid model at \`${source.modelName}\`: ${JSON.stringify(model)}`);
    }

    this.scope = Object.entries(model.scope).reduce<Scope>((accumulator, [name, member]) => {
      const appliedMember = name in source.properties ? source.properties[name] : member;
      if (isField(appliedMember)) {
        accumulator[name] = new Field(appliedMember, domain, scope);
      } else if (isMethod(appliedMember)) {
        accumulator[name] = appliedMember;
      } else if (isAction(appliedMember)) {
        accumulator[name] = new Action(appliedMember, domain, scope);
      } else {
        throw new Error(`Invalid member at \`${name}\`: ${JSON.stringify(member)}`);
      }
      return accumulator;
    }, {});
  }

  getScope(): Scope {
    return this.scope;
  }
}
