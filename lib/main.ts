import * as Abstract from "./abstract";
import * as Dom from "./dom";

type Method = Abstract.Method | ((argument?: Field) => unknown);
type Action = Abstract.Action | ((argument?: Field) => unknown);

interface Dictionary {
  getField(name: string): Field;
}

interface FieldScope extends Dictionary {
  getMethod(name: string): Method;
  getAction(name: string): Action;
}

interface ConcreteNode<Kind extends string> {
  source: Abstract.Node<Kind>;
}

interface Subscriber<T> {
  take(value: T): void;
}

abstract class Publisher<T> {
  private readonly takes: Array<Subscriber<T>["take"]> = [];
  private value?: T;

  getValue() {
    return this.value;
  }

  protected publish(value: T) {
    this.value = value;

    this.takes.forEach((take) => {
      take(value);
    });
  }

  sendTo(target: Subscriber<T> | Subscriber<T>["take"]) {
    const take = typeof target === "function" ? target : target.take;

    if (this.value !== undefined) {
      take(this.value);
    }

    this.takes.push(take);
  }
}

abstract class Proxy<T> extends Publisher<T> implements Subscriber<T> {
  take(value: T) {
    this.publish(value);
  }
}

class Scope implements FieldScope {
  private readonly base?: Field | Scope;
  private readonly fields: Record<string, Field> = {};
  private readonly methods: Record<string, Method> = {};
  private readonly actions: Record<string, Action> = {};

  constructor(base?: Field | Scope) {
    this.base = base;
  }

  addField(name: string, property: Field): Scope {
    this.fields[name] = property;
    return this;
  }

  addMethod(name: string, method: Method): Scope {
    this.methods[name] = method;
    return this;
  }

  addAction(name: string, action: Action): Scope {
    this.actions[name] = action;
    return this;
  }

  getField(name: string): Field {
    try {
      if (this.base !== undefined) {
        const field = this.base.getField(name);
        return field;
      }

      throw new Error();
    } catch (error) {
      const field = this.fields[name];

      if (field instanceof Field) {
        return field;
      }

      throw error;
    }
  }

  getMethod(name: string): Method {
    try {
      if (this.base !== undefined) {
        const method = this.base.getMethod(name);
        return method;
      }

      throw new Error();
    } catch (error) {
      const method = this.methods[name];

      if (Abstract.isMethod(method) || typeof method == "function") {
        return method;
      }

      throw error;
    }
  }

  getAction(name: string): Action {
    try {
      if (this.base !== undefined) {
        const action = this.base.getAction(name);
        return action;
      }

      throw new Error();
    } catch (error) {
      const action = this.actions[name];

      if (Abstract.isAction(action) || typeof action == "function") {
        return action;
      }

      throw error;
    }
  }
}

/* Tier 0 */

export class App implements ConcreteNode<"app"> {
  readonly source: Abstract.App;
  private readonly renderable: Renderable;

  constructor(source: Abstract.App) {
    this.source = source;

    this.renderable = new Renderable(source.renderable, source.domain);
    this.renderable.sendTo(Dom.render);

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

/* Tier 1 */

class Renderable extends Proxy<HTMLElement> implements ConcreteNode<"renderable"> {
  readonly source: Abstract.Renderable;
  private readonly element: Feature | Landscape;

  constructor(
    source: Abstract.Renderable,
    domain: Abstract.App["domain"],
    scope: Scope = new Scope(),
  ) {
    super();

    this.source = source;

    this.element =
      source.element.kind === "feature"
        ? new Feature(source.element, domain, scope)
        : new Landscape(source.element, domain, scope);

    this.element.sendTo(this);
  }
}

/* Tier 2 */

class Field extends Proxy<unknown> implements FieldScope, ConcreteNode<"field"> {
  readonly source: Abstract.Field;
  readonly id: ReturnType<typeof window.crypto.randomUUID>;
  private readonly scope;
  private readonly publisher: Store | Switch | Pointer | MethodCall;

  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;
    this.id = window.crypto.randomUUID();
    this.scope = new Scope(scope);

    this.publisher =
      source.publisher.kind === "store"
        ? new Store(source.publisher, domain, this.scope)
        : source.publisher.kind === "switch"
        ? new Switch(source.publisher, domain, this.scope)
        : source.publisher.kind === "pointer"
        ? new Pointer(source.publisher, domain, this.scope)
        : source.publisher.kind === "methodCall"
        ? new MethodCall(source.publisher, domain, this.scope)
        : (() => {
            throw new Error();
          })();

    this.publisher.sendTo(this);

    if (!(this.publisher instanceof Store)) {
      return;
    }

    const model = domain[source.publisher.modelName];

    if (Abstract.isModel(model)) {
      Object.entries(model.fields).forEach(([name, member]) => {
        if (!Abstract.isParameter(member.publisher)) {
          const field = new Field(member, domain, scope);
          scope.addField(name, field);
        }
      });
      const structure = source.publisher.kind === "store" ? source.publisher.value : undefined;
      // TODO methods...
      // TODO actions...
    } else if (source.publisher.modelName === "Array") {
      if (this.publisher instanceof Store) {
        const store = this.publisher;

        scope.addAction("push", (argument) => {
          if (argument) {
            const currentValue = this.getValue() as Array<Field>;
            store.take([...currentValue, argument]);
          }
        });
      }
    } else if (source.publisher.modelName === "Boolean") {
      scope
        .addMethod("and", (argument) => this.getValue() && argument?.getValue())
        .addMethod("not", () => !this.getValue());

      if (this.publisher instanceof Store) {
        const store = this.publisher;

        scope
          .addAction("setTo", (argument) => {
            if (argument) {
              store.take(argument.getValue());
            }
          })
          .addAction("toggle", () => store.take(!this.getValue()));
      }
    } else if (source.publisher.modelName === "Number") {
      if (this.publisher instanceof Store) {
        const store = this.publisher;

        scope
          .addAction("add", (argument) => {
            if (argument) {
              const currentValue = this.getValue() as number;
              const argumentValue = this.getValue() as number;
              store.take(currentValue + argumentValue);
            }
          })
          .addAction("setTo", (argument) => {
            if (argument) {
              store.take(argument.getValue());
            }
          });
      }
    } else if (source.publisher.modelName === "String") {
      const store = this.publisher;

      scope.addAction("setTo", (argument) => {
        if (argument) {
          store.take(argument.getValue());
        }
      });
    } else if (source.publisher.modelName !== "Renderable") {
      // Renderable fields have no members.
      throw new Error();
    }
  }

  getField(name: string): Field {
    const scope =
      this.publisher instanceof Store || this.publisher instanceof Store
        ? this.scope
        : this.publisher.getField();

    const property = scope.getField(name);
    return property;
  }

  getMethod(name: string): Method {
    const scope =
      this.publisher instanceof Store || this.publisher instanceof Store
        ? this.scope
        : this.publisher.getField();

    const method = scope.getMethod(name);
    return method;
  }

  getAction(name: string): Action {
    if (!(this.publisher instanceof Store || this.publisher instanceof Pointer)) {
      throw new Error();
    }

    const scope = this.publisher instanceof Store ? this.scope : this.publisher.getField();
    const action = scope.getAction(name);
    return action;
  }
}

class Feature extends Proxy<HTMLElement> implements ConcreteNode<"feature"> {
  readonly source: Abstract.Feature;

  constructor(source: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    const domElement = Dom.create(source.tagName);

    // TODO Define a new scope.

    Object.entries(source.properties).forEach(([name, property]) => {
      const field = new Field(property, domain, scope);

      field.sendTo((value) => {
        if (name === "content") {
          // TODO Populate the domElement...
        } else {
          // TODO Update Dom.attribute to handle styles...
          Dom.attribute(domElement, name, value);
        }
      });
    });

    // TODO Add the reactions...
  }
}

class Landscape extends Proxy<HTMLElement> implements ConcreteNode<"landscape"> {
  readonly source: Abstract.Landscape;

  constructor(source: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;
    // TODO
    // TODO Define a new scope, which inherits from the given scope and adds properties...
  }
}

/* Tiers 3 and greater */

class Store extends Proxy<unknown> implements Dictionary, ConcreteNode<"store"> {
  readonly source: Abstract.Store;
  private readonly structure?: Structure;

  constructor(source: Abstract.Store, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    const data = Store.hydrate(source.value, domain, scope);
    this.publish(data);

    if (data instanceof Structure) {
      this.structure = data;
    }
  }

  getField(name: string): Field {
    if (this.structure === undefined) {
      throw new Error();
    }

    const property = this.structure.getField(name);
    return property;
  }

  static hydrate(value: Abstract.Store["value"], domain: Abstract.App["domain"], scope: Scope) {
    const hydratedValue =
      value instanceof Array
        ? value.map((item) => new Field(item, domain, scope))
        : Abstract.isRenderable(value)
        ? new Renderable(value, domain, scope)
        : Abstract.isStructure(value)
        ? new Structure(value, domain, scope)
        : value;

    return hydratedValue;
  }
}

class Switch extends Publisher<unknown> implements ConcreteNode<"switch"> {
  readonly source: Abstract.Switch;
  private readonly condition: Field;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(source: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    this.condition = new Field(source.condition, domain, scope);
    this.positive = new Field(source.positive, domain, scope);
    this.negative = new Field(source.negative, domain, scope);

    this.condition.sendTo((value) => {
      const field = value ? this.positive : this.negative;
      const fieldValue = field.getValue();

      this.publish(fieldValue);
    });
  }

  getField(): Field {
    const value = this.getValue();
    const field = value ? this.positive : this.negative;

    return field;
  }
}

class Pointer extends Proxy<unknown> implements ConcreteNode<"pointer"> {
  readonly source: Abstract.Pointer;
  private readonly target: Field;

  constructor(source: Abstract.Pointer, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    const realScope = source.scope
      ? new Scope(new MethodCall(source.scope, domain, scope).getField())
      : scope;

    const route = source.address.slice();

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      const propertyOwner = terminal ?? realScope;

      terminal = propertyOwner.getField(nextStop);
      nextStop = route.shift();
    }

    if (terminal !== undefined) {
      this.target = terminal;
      this.target.sendTo(this);
    } else {
      // TODO Resolve properties on window...

      throw new Error();
    }
  }

  getField(): Field {
    return this.target;
  }
}

class MethodCall extends Proxy<unknown> implements ConcreteNode<"methodCall"> {
  readonly source: Abstract.MethodCall;
  private readonly result: Field;

  constructor(source: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    const realScope = source.scope
      ? new Scope(new MethodCall(source.scope, domain, scope).getField())
      : scope;

    const route = source.address.slice(0, source.address.length - 1);

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      const propertyOwner = terminal ?? realScope;

      terminal = propertyOwner.getField(nextStop);
      nextStop = route.shift();
    }

    const methodOwner = terminal ?? realScope;
    const methodName = source.address.slice(-1)[0];
    const argument = source.argument && new Field(source.argument, domain, scope);

    if (methodOwner instanceof Field && methodName !== undefined) {
      const method = methodOwner.getMethod(methodName);

      if (typeof method === "function") {
        const abstractResult: Abstract.Field = {
          kind: "field",
          publisher: {
            kind: "store",
            modelName: source.modelName,
            value: method(argument),
          },
        };

        this.result = new Field(abstractResult, domain, realScope);

        methodOwner.sendTo(() => {
          const resultingValue = method(argument);
          this.result.take(resultingValue);
        });
      } else {
        const parameterName = method.parameter?.name;

        const closure =
          !argument || !parameterName || !realScope
            ? realScope
            : new Scope(realScope).addField(parameterName, argument);

        this.result = new Field(method.result, domain, closure);
      }

      this.result.sendTo(this);
    } else {
      // TODO Resolve methods on window...

      throw new Error();
    }
  }

  getField(): Field {
    return this.result;
  }
}

class Structure implements Dictionary, ConcreteNode<"structure"> {
  readonly source: Abstract.Structure;
  private readonly properties: Record<string, Field> = {};

  constructor(source: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    this.source = source;

    Object.entries(source.properties).forEach(([name, property]) => {
      // TODO Fix the typing of `property`?
      if (!Abstract.isField(property)) {
        throw new Error();
      }

      this.properties[name] = new Field(property, domain, scope);
    });
  }

  getField(name: string): Field {
    if (!(name in this.properties)) {
      throw new Error();
    }

    const property = this.properties[name];
    return property;
  }
}
