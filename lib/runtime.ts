import * as Abstract from "./abstract";
import * as Guards from "./abstractGuards";
import * as Dom from "./runtimeDom";

type Action = Abstract.Action | ((argument?: Field) => unknown);
type Method = Abstract.Method | ((argument?: Field) => unknown);

interface Dictionary {
  getProperty(name: string): Field;
}

interface DataScope extends Dictionary {
  getMethod(name: string): Method;
}

interface FieldScope extends DataScope {
  getAction(name: string): Action;
}

interface ConcreteNode<Kind extends string> {
  abstractNode: Abstract.Node<Kind>;
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

      if (Guards.isMethod(method) || typeof method == "function") {
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

      if (Guards.isAction(action) || typeof action == "function") {
        return action;
      }

      throw error;
    }
  }
}

/* Tier 0 */

export class App implements ConcreteNode<"app"> {
  readonly abstractNode: Abstract.App;
  private readonly renderable: Renderable;

  constructor(app: Abstract.App) {
    this.abstractNode = app;

    this.renderable = new Renderable(app.renderable, app.domain);
    this.renderable.sendTo(Dom.render);

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

/* Tier 1 */

class Renderable extends Proxy<HTMLElement> implements ConcreteNode<"renderable"> {
  readonly abstractNode: Abstract.Renderable;
  private readonly element: Feature | Landscape;

  constructor(
    abstractNode: Abstract.Renderable,
    domain: Abstract.App["domain"],
    scope: Scope = new Scope(),
  ) {
    super();

    this.abstractNode = abstractNode;

    this.element =
      abstractNode.element.kind === "feature"
        ? new Feature(abstractNode.element, domain, scope)
        : new Landscape(abstractNode.element, domain, scope);

    this.element.sendTo(this);
  }
}

/* Tier 2 */

class Field extends Proxy<unknown> implements FieldScope, ConcreteNode<"field"> {
  readonly abstractNode: Abstract.Field;
  private readonly publisher: Data | Store | Switch | Pointer | MethodCall;
  private readonly scope;

  constructor(abstractNode: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;
    this.scope = new Scope(scope);

    // TODO (WIP) Move the definition of properties, methods, and actions up from the publisher classes, to here...

    const model = domain[abstractNode.publisher.modelName];

    if (!Guards.isModel(model)) {
      // TODO Account for native types: modelName === "Boolean", modelName === "Number", etc...

      throw new Error();
    }

    Object.entries(model.members).forEach(([name, abstractMember]) => {
      if (Guards.isField(abstractMember)) {
        if (!Guards.isParameter(abstractMember.publisher)) {
          const property = new Field(abstractMember, domain, scope);
          scope.addProperty(name, property);
        }
      } else if (Guards.isMethod(abstractMember)) {
        // TODO
      } else {
        // TODO
      }
    });

    this.publisher =
      abstractNode.publisher.kind === "data"
        ? new Data(abstractNode.publisher, domain, this.scope)
        : abstractNode.publisher.kind === "store"
        ? new Store(abstractNode.publisher, domain, this.scope)
        : abstractNode.publisher.kind === "switch"
        ? new Switch(abstractNode.publisher, domain, this.scope)
        : abstractNode.publisher.kind === "pointer"
        ? new Pointer(abstractNode.publisher, domain, this.scope)
        : abstractNode.publisher.kind === "methodCall"
        ? new MethodCall(abstractNode.publisher, domain, this.scope)
        : (() => {
            throw new Error();
          })();

    this.publisher.sendTo(this);
  }

  // TODO Update these following 3 methods to use the scope...

  getProperty(name: string): Field {
    const field =
      this.publisher instanceof Data || this.publisher instanceof Store
        ? this.publisher
        : this.publisher.getField();

    const property = field.getProperty(name);
    return property;
  }

  getMethod(name: string): Method {
    const field =
      this.publisher instanceof Data || this.publisher instanceof Store
        ? this.publisher
        : this.publisher.getField();

    const method = field.getMethod(name);
    return method;
  }

  getAction(name: string): Action {
    if (this.publisher instanceof Store || this.publisher instanceof Pointer) {
      const field = this.publisher instanceof Store ? this.publisher : this.publisher.getField();
      const action = field.getAction(name);
      return action;
    }

    throw new Error();
  }
}

class Feature extends Proxy<HTMLElement> implements ConcreteNode<"feature"> {
  readonly abstractNode: Abstract.Feature;

  constructor(abstractNode: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    // TODO...
    const domElement = Dom.create(abstractNode.tagName);
    // TODO Define a new scope, which inherits from the given scope and adds properties...

    Object.entries(abstractNode.properties).forEach(([name, property]) => {
      const field = new Field(property, domain, scope);

      field.sendTo((value) => {
        if (name === "content") {
          // TODO Populate the domElement...
        } else {
          Dom.attribute(domElement, name, value);
        }
      });
    });

    // TODO Add the reactions...
  }
}

class Landscape extends Proxy<HTMLElement> implements ConcreteNode<"landscape"> {
  readonly abstractNode: Abstract.Landscape;

  constructor(abstractNode: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

/* Tiers 3 and greater */

class Data extends Proxy<unknown> implements DataScope, ConcreteNode<"data"> {
  readonly abstractNode: Abstract.Data;

  constructor(abstractNode: Abstract.Data, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    this.publish(Data.hydrate(abstractNode.value, domain, scope));

    if (abstractNode.modelName === "Boolean") {
      this.methods.and = (argument) => this.getValue() && argument?.getValue();
      this.methods.not = () => !this.getValue();
    }

    // TODO Add methods for all models...
  }

  getProperty(name: string): Field {
    const value = this.getValue();

    if (value instanceof Structure) {
      const property = value.getProperty(name);
      return property;
    }

    throw new Error();
  }

  getMethod(name: string): Method {
    if (name in this.methods) {
      const method = this.methods[name];
      return method;
    }

    throw new Error();
  }

  static hydrate(value: Abstract.Data["value"], domain: Abstract.App["domain"], scope: Scope) {
    const hydratedValue =
      value instanceof Array
        ? value.map((item) => new Field(item, domain, scope))
        : Guards.isRenderable(value)
        ? new Renderable(value, domain, scope)
        : Guards.isStructure(value)
        ? new Structure(value, domain, scope)
        : value;

    return hydratedValue;
  }
}

class Store extends Proxy<unknown> implements FieldScope, ConcreteNode<"store"> {
  readonly abstractNode: Abstract.Store;
  private readonly data: Data;

  constructor(abstractNode: Abstract.Store, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    this.data = new Data(abstractNode.data, domain, scope);
    this.data.sendTo(this);

    const initialValue = this.getValue();

    this.actions.reset = () => {
      this.data.take(initialValue);
    };
    this.actions.setTo = (argument) => {
      if (argument) {
        this.data.take(argument.getValue());
      }
    };

    if (abstractNode.modelName === "Array") {
      this.actions.push = (argument) => {
        if (argument) {
          this.data.take([...(this.getValue() as Array<Field>), argument]);
        }
      };
    } else if (abstractNode.modelName === "Boolean") {
      this.actions.disable = () => {
        this.data.take(false);
      };
      this.actions.enable = () => {
        this.data.take(true);
      };
      this.actions.toggle = () => {
        this.data.take(!this.getValue());
      };
    } else if (abstractNode.modelName === "Number") {
      this.actions.add = (argument) => {
        if (argument) {
          this.data.take((this.getValue() as number) + (argument.getValue() as number));
        }
      };
    }

    // TODO Add actions for all models...
  }

  getProperty(name: string): Field {
    const property = this.data.getProperty(name);
    return property;
  }

  getMethod(name: string): Method {
    const method = this.data.getMethod(name);
    return method;
  }

  getAction(name: string): Action {
    if (name in this.actions) {
      const action = this.actions[name];
      return action;
    }

    throw new Error();
  }
}

class Switch extends Publisher<unknown> implements ConcreteNode<"switch"> {
  readonly abstractNode: Abstract.Switch;
  private readonly condition: Field;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(abstractNode: Abstract.Switch, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    this.condition = new Field(abstractNode.condition, domain, scope);
    this.positive = new Field(abstractNode.positive, domain, scope);
    this.negative = new Field(abstractNode.negative, domain, scope);

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
  readonly abstractNode: Abstract.Pointer;
  private readonly field: Field;

  constructor(abstractNode: Abstract.Pointer, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    const realScope = abstractNode.scope
      ? new Scope(new MethodCall(abstractNode.scope, domain, scope).getField())
      : scope;

    const route = abstractNode.address.slice();

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      const propertyOwner = terminal ?? realScope;

      terminal = propertyOwner.getProperty(nextStop);
      nextStop = route.shift();
    }

    if (terminal !== undefined) {
      this.field = terminal;
      this.field.sendTo(this);
    } else {
      // TODO Resolve properties on window...

      throw new Error();
    }
  }

  getField(): Field {
    return this.field;
  }
}

class MethodCall extends Proxy<unknown> implements ConcreteNode<"methodCall"> {
  readonly abstractNode: Abstract.MethodCall;
  private readonly result: Field;

  constructor(abstractNode: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    const realScope = abstractNode.scope
      ? new Scope(new MethodCall(abstractNode.scope, domain, scope).getField())
      : scope;

    const route = abstractNode.address.slice(0, abstractNode.address.length - 1);

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      const propertyOwner = terminal ?? realScope;

      terminal = propertyOwner.getProperty(nextStop);
      nextStop = route.shift();
    }

    const methodOwner = terminal ?? realScope;
    const methodName = abstractNode.address.slice(-1)[0];
    const argument = abstractNode.argument && new Field(abstractNode.argument, domain, scope);

    if (methodOwner instanceof Field && methodName !== undefined) {
      const method = methodOwner.getMethod(methodName);

      if (typeof method === "function") {
        const abstractResult: Abstract.Field = {
          kind: "field",
          publisher: {
            kind: "parameter",
            modelName: abstractNode.modelName,
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

class Structure extends Publisher<unknown> implements Dictionary, ConcreteNode<"structure"> {
  readonly abstractNode: Abstract.Structure;
  private readonly properties: Record<string, Field> = {};

  constructor(abstractNode: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    const model = domain[abstractNode.modelName];

    if (!Guards.isModel(model)) {
      throw new Error();
    }

    Object.entries(abstractNode.properties).forEach(([name, property]) => {
      if (Guards.isField(property)) {
        // TODO If possible, fix the typing here, so that property isn't never:
        const abstractField = property as Abstract.Field;
        this.properties[name] = new Field(abstractField, domain, scope);
      }
    });
  }

  getProperty(name: string): Field {
    if (name in this.properties) {
      const method = this.properties[name];
      return method;
    }

    throw new Error();
  }
}
