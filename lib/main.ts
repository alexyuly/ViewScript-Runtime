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
  isActionCall,
  isStreamCall,
  isException,
  isPrimitive,
  isStructure,
} from "./abstract/guards";
import { Publisher, Pubsubber, Subscriber } from "./pubsub";

type PrimitiveMethod = {
  store: Store;
  getResultValue: (argument: unknown) => unknown;
};

type Scope = Record<string, Stream | Field | Method | Action>;

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
      } else if (isActionCall(property)) {
        const actionCall = new ActionCall(property, domain, scope);
        htmlElement.addEventListener(name, actionCall);
      } else if (isStreamCall(property)) {
        const streamCall = new StreamCall(property, domain, scope);
        htmlElement.addEventListener(name, streamCall);
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
        if (isField(member)) {
          const property = source.properties[name];
          const propertyOrMember = isField(property) ? property : member;
          accumulator[name] = new Field(propertyOrMember, domain, accumulator);
        } else if (isStream(member)) {
          const property = source.properties[name];
          const action = isAction(property) ? new Action(property, domain, accumulator) : undefined;
          if (action) {
            const stream = new Stream();
            stream.sendTo(action);
            accumulator[name] = stream;
          }
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

class Method {
  private readonly source: Abstract.Method | PrimitiveMethod;
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;

  constructor(source: Method["source"], domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  getResult(argument?: Field): Pubsubber {
    if (isMethod(this.source)) {
      const resultScope = { ...this.scope };

      if (this.source.parameter && argument) {
        resultScope[this.source.parameter.name] = argument;
      }

      const result = new Field(this.source.result, this.domain, resultScope);
      return result;
    }

    const { store, getResultValue } = this.source;
    const result = new Pubsubber();

    store.sendTo(() => {
      const resultValue = getResultValue(argument?.getValue());
      result.handleEvent(resultValue);
    });

    return result;
  }
}

class Action implements Subscriber<Field | undefined> {
  private readonly source: Abstract.Action | Subscriber<Field | undefined>;
  private readonly domain: Abstract.App["domain"];
  private readonly scope: Scope;

  constructor(source: Action["source"], domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.domain = domain;
    this.scope = scope;
  }

  handleEvent(argument?: Field): void {
    if (isAction(this.source)) {
      const stepScope = { ...this.scope };

      if (this.source.parameter && argument) {
        stepScope[this.source.parameter.name] = argument;
      }

      for (const abstractStep of this.source.steps) {
        let step: ActionCall | StreamCall | Exception;
        if (isActionCall(abstractStep)) {
          step = new ActionCall(abstractStep, this.domain, this.scope);
        } else if (isStreamCall(abstractStep)) {
          step = new StreamCall(abstractStep, this.domain, this.scope);
        } else if (isException(abstractStep)) {
          step = new Exception(abstractStep, this.domain, this.scope);
        } else {
          throw new Error(`Invalid step: ${JSON.stringify(abstractStep)}`);
        }
        if (!(step instanceof Exception) || step.getConditionalValue()) {
          step.handleEvent();
        }
        if (step instanceof Exception) {
          break;
        }
      }
    } else {
      this.source.handleEvent(argument);
    }
  }
}

class Stream extends Pubsubber {
  constructor() {
    super();
  }
}

/* Tier IV */

class Store extends Pubsubber {
  private readonly content: Feature | Landscape | Primitive | Structure;

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
    } else if (isPrimitive(source.content)) {
      const primitive = new Primitive(source.content, domain, scope, this);
      primitive.sendTo(this);
      this.content = primitive;
    } else if (isStructure(source.content)) {
      const structure = new Structure(source.content, domain, scope);
      structure.sendTo(this);
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
    const result = conditionalValue ? this.positive : this.negative;
    return result.getScope();
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
  private readonly result: Pubsubber;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const callScope = source.scope ? new Field(source.scope, domain, scope).getScope() : scope;
    const method = callScope[source.name];

    if (!(method instanceof Method)) {
      throw new Error(`Invalid method at \`${source.name}\`: ${JSON.stringify(method)}`);
    }

    const argument = source.argument && new Field(source.argument, domain, scope);
    this.result = method.getResult(argument);
    this.result.sendTo(this);
  }

  getScope(): Scope {
    if (!(this.result instanceof Field)) {
      return {};
    }

    return this.result.getScope();
  }
}

class ActionCall implements Subscriber<void> {
  private readonly action: Action;
  private readonly argument?: Field;

  constructor(source: Abstract.ActionCall, domain: Abstract.App["domain"], scope: Scope) {
    const callScope = source.scope ? new Field(source.scope, domain, scope).getScope() : scope;
    const action = callScope[source.name];

    if (!(action instanceof Action)) {
      throw new Error(`Invalid action at \`${source.name}\`: ${JSON.stringify(action)}`);
    }

    this.action = action;
    this.argument = source.argument && new Field(source.argument, domain, scope);
  }

  handleEvent(): void {
    this.action.handleEvent(this.argument);
  }
}

class StreamCall implements Subscriber<void> {
  private readonly source: Abstract.StreamCall;
  private readonly scope: Scope;
  private readonly argument?: Field;

  constructor(source: Abstract.StreamCall, domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;
    this.scope = scope;
    this.argument = source.argument && new Field(source.argument, domain, scope);
  }

  handleEvent(): void {
    const stream = this.scope[this.source.name];

    if (stream instanceof ActionCall || stream instanceof StreamCall) {
      stream.handleEvent(this.argument);
    } else {
      throw new Error(`Invalid stream at \`${this.source.name}\`: ${JSON.stringify(stream)}`);
    }
  }
}

class Exception implements Subscriber<void> {
  constructor(source: Abstract.Exception, domain: Abstract.App["domain"], scope: Scope) {
    // TODO
  }

  getConditionalValue(): boolean {
    // TODO
    return false;
  }

  handleEvent(): void {
    // TODO
  }
}

/* Tier V */

class Primitive extends Publisher {
  private readonly scope: Scope = {};

  constructor(
    source: Abstract.Primitive,
    domain: Abstract.App["domain"],
    scope: Scope,
    store: Store,
  ) {
    super();

    if (source.value instanceof Array) {
      // scope.map = (argumentValue) => {
      //   if (isMethod(argumentValue)) {
      //     // TODO
      //   }
      // };
      scope.push = new Action(
        {
          handleEvent(argument) {
            if (argument instanceof Field) {
              const storedValue = store.getValue();
              const nextValue = [...(storedValue instanceof Array ? storedValue : []), argument];
              store.handleEvent(nextValue);
            }
          },
        },
        domain,
        scope,
      );
      scope.setTo = new Action(
        {
          handleEvent(argument) {
            const nextValue = argument?.getValue();
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
      // TODO More...?
    } else if (typeof source.value === "boolean") {
      scope.not = new Method(
        {
          store,
          getResultValue() {
            const nextValue = !store.getValue();
            return nextValue;
          },
        },
        domain,
        scope,
      );
      scope.setTo = new Action(
        {
          handleEvent(argument) {
            const nextValue = argument?.getValue();
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
      scope.toggle = new Action(
        {
          handleEvent() {
            const nextValue = !store.getValue();
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
      // TODO More...?
    } else if (typeof source.value === "number") {
      scope.add = new Action(
        {
          handleEvent(argument) {
            const storedValue = store.getValue() as number;
            const argumentValue = argument?.getValue() as number;
            const nextValue = storedValue + argumentValue;
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
      // TODO:
      // scope.is = (argumentValue) => {
      //   const storedValue = store.getValue();
      //   const nextValue = storedValue === argumentValue;
      //   return nextValue;
      // };
      // scope.isAtLeast = (argumentValue) => {
      //   const storedValue = store.getValue();
      //   const nextValue = (storedValue as number) >= (argumentValue as number);
      //   return nextValue;
      // };
      scope.setTo = new Action(
        {
          handleEvent(argument) {
            const nextValue = argument?.getValue();
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
      // TODO More...?
    } else if (typeof source.value === "string") {
      scope.setTo = new Action(
        {
          handleEvent(argument) {
            const nextValue = argument?.getValue();
            store.handleEvent(nextValue);
          },
        },
        domain,
        scope,
      );
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

class Structure extends Publisher<Abstract.Structure> {
  private readonly scope: Scope;

  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    super();

    const model = domain[source.modelName];

    if (!isModel(model)) {
      throw new Error(`Invalid model at \`${source.modelName}\`: ${JSON.stringify(model)}`);
    }

    this.scope = Object.entries(model.scope).reduce<Scope>((accumulator, [name, member]) => {
      if (isField(member)) {
        const property = source.properties[name];
        const field = isField(property)
          ? new Field(property, domain, scope)
          : new Field(member, domain, accumulator);

        accumulator[name] = field;
      } else if (isMethod(member)) {
        accumulator[name] = new Method(member, domain, accumulator);
      } else if (isAction(member)) {
        accumulator[name] = new Action(member, domain, accumulator);
      } else {
        throw new Error(`Invalid member at \`${name}\`: ${JSON.stringify(member)}`);
      }
      return accumulator;
    }, {});

    this.publish(source);
  }

  getScope(): Scope {
    return this.scope;
  }
}
