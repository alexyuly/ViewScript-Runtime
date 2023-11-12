import * as Abstract from "./abstract";
import * as Dom from "./dom";

type Method = Abstract.Method | ((argument?: Field) => unknown);
type Action = Abstract.Action | ((argument?: Field) => unknown);

interface Dictionary {
  getProperty(name: string): Field;
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
  private readonly members: Record<string, Field | Method | Action> = {};

  constructor(base?: Field | Scope) {
    this.base = base;
  }

  addProperty(name: string, property: Field): Scope {
    this.members[name] = property;
    return this;
  }

  addMethod(name: string, method: Method): Scope {
    this.members[name] = method;
    return this;
  }

  addAction(name: string, action: Action): Scope {
    this.members[name] = action;
    return this;
  }

  getProperty(name: string): Field {
    try {
      if (this.base !== undefined) {
        const property = this.base.getProperty(name);
        return property;
      }

      throw new Error();
    } catch (error) {
      const property = this.members[name];

      if (property instanceof Field) {
        return property;
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
      const method = this.members[name];

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
      const action = this.members[name];

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
  private readonly publisher: Data | Store | Switch | Pointer | MethodCall;

  constructor(source: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;
    this.id = window.crypto.randomUUID();
    this.scope = new Scope(scope);

    this.publisher =
      source.publisher.kind === "data"
        ? new Data(source.publisher, domain, this.scope)
        : source.publisher.kind === "store"
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

    if (!(this.publisher instanceof Data || this.publisher instanceof Store)) {
      return;
    }

    const model = domain[source.publisher.modelName];

    if (this.publisher instanceof Store) {
      const store = this.publisher;
      const initialValue = this.getValue();

      scope
        .addAction("reset", () => {
          store.setTo(initialValue);
        })
        .addAction("setTo", (argument) => {
          if (argument) {
            store.setTo(argument.getValue());
          }
        });
    }

    if (Abstract.isModel(model)) {
      Object.entries(model.members).forEach(([name, member]) => {
        if (Abstract.isField(member)) {
          // TODO Fix all of this field stuff...
          const structure =
            source.publisher.kind === "data"
              ? source.publisher.value
              : source.publisher.kind === "store"
              ? source.publisher.data.value
              : undefined;

          if (!Abstract.isStructure(structure)) {
            throw new Error();
          }

          let abstractField: Abstract.Field | undefined;
          if (Abstract.isParameter(member.publisher)) {
            const property = structure.properties[name];
            if (Abstract.isField(property)) {
              abstractField = property; // TODO Fix the typing of property?
            }
          } else {
            abstractField = member;
          }

          if (!Abstract.isField(abstractField)) {
            throw new Error();
          }

          // TODO Do not add already constructed Fields that exist in the Data publisher:
          const field = new Field(abstractField, domain, scope);
          scope.addProperty(name, field);
        } else if (Abstract.isMethod(member)) {
          // TODO Add methods...
        } else if (this.publisher instanceof Store) {
          // TODO Add actions...
        }
      });
    } else if (source.publisher.modelName === "Array") {
      if (this.publisher instanceof Store) {
        const store = this.publisher;

        scope.addAction("push", (argument) => {
          if (argument) {
            const currentValue = this.getValue() as Array<Field>;
            store.setTo([...currentValue, argument]);
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
          .addAction("disable", () => store.setTo(false))
          .addAction("enable", () => store.setTo(true))
          .addAction("toggle", () => store.setTo(!this.getValue()));
      }
    } else if (source.publisher.modelName === "Number") {
      if (this.publisher instanceof Store) {
        const store = this.publisher;

        scope.addAction("add", (argument) => {
          if (argument) {
            const currentValue = this.getValue() as number;
            const argumentValue = this.getValue() as number;
            store.take(currentValue + argumentValue);
          }
        });
      }
    } else if (source.publisher.modelName === "String") {
      // TODO
    } else if (source.publisher.modelName !== "Renderable") {
      // TODO Renderable fields have no members.
      throw new Error();
    }
  }

  getProperty(name: string): Field {
    const scope =
      this.publisher instanceof Data || this.publisher instanceof Store
        ? this.scope
        : this.publisher.getField();

    const property = scope.getProperty(name);
    return property;
  }

  getMethod(name: string): Method {
    const scope =
      this.publisher instanceof Data || this.publisher instanceof Store
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

class Data extends Proxy<unknown> implements Dictionary, ConcreteNode<"data"> {
  readonly source: Abstract.Data;
  private readonly structure?: Structure;

  constructor(source: Abstract.Data, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    const data = Data.hydrate(source.value, domain, scope);
    this.publish(data);

    if (data instanceof Structure) {
      this.structure = data;
    }
  }

  getProperty(name: string): Field {
    if (this.structure === undefined) {
      throw new Error();
    }

    const property = this.structure.getProperty(name);
    return property;
  }

  static hydrate(value: Abstract.Data["value"], domain: Abstract.App["domain"], scope: Scope) {
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

class Store extends Proxy<unknown> implements ConcreteNode<"store"> {
  readonly source: Abstract.Store;
  private readonly data: Data;

  constructor(source: Abstract.Store, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.source = source;

    this.data = new Data(source.data, domain, scope);
    this.data.sendTo(this);
  }

  setTo(value: unknown) {
    this.data.take(value);
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

      terminal = propertyOwner.getProperty(nextStop);
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

      terminal = propertyOwner.getProperty(nextStop);
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
            kind: "data",
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
            : new Scope(realScope).addProperty(parameterName, argument);

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

  getProperty(name: string): Field {
    if (!(name in this.properties)) {
      throw new Error();
    }

    const property = this.properties[name];
    return property;
  }
}
