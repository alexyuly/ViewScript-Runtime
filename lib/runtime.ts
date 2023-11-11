import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Helpers from "./helpers";
import * as Style from "./style";

type Action = Abstract.Action | ((argument?: Field) => unknown);
type Method = Abstract.Method | ((argument?: Field) => unknown);

interface Dictionary {
  getProperty(name: string): Field;
}

interface Readable extends Dictionary {
  getMethod(name: string): Method;
}

interface Writable extends Readable {
  getAction(name: string): Action;
}

// interface Listenable extends Dictionary {
//   getStream(name: string): Stream;
// }

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

  constructor(abstractNode: Abstract.Renderable, domain: Abstract.App["domain"]) {
    super();

    this.abstractNode = abstractNode;

    this.element =
      abstractNode.element.kind === "feature"
        ? new Feature(abstractNode.element, domain)
        : new Landscape(abstractNode.element, domain);

    this.element.sendTo(this);
  }
}

/* Tier 2 */

class Field extends Proxy<unknown> implements Writable, ConcreteNode<"field"> {
  readonly abstractNode: Abstract.Field;
  private readonly publisher: Data | Parameter | Pointer | Switch | MethodCall | Store;

  constructor(abstractNode: Abstract.Field, domain: Abstract.App["domain"], scope: Readable) {
    super();

    this.abstractNode = abstractNode;

    this.publisher =
      abstractNode.publisher.kind === "data"
        ? new Data(abstractNode.publisher, domain, scope)
        : abstractNode.publisher.kind === "store"
        ? new Store(abstractNode.publisher, domain, scope)
        : abstractNode.publisher.kind === "parameter"
        ? new Parameter(abstractNode.publisher)
        : abstractNode.publisher.kind === "pointer"
        ? new Pointer(abstractNode.publisher, domain, scope)
        : abstractNode.publisher.kind === "switch"
        ? new Switch(abstractNode.publisher, domain, scope)
        : abstractNode.publisher.kind === "methodCall"
        ? new MethodCall(abstractNode.publisher, domain, scope)
        : (() => {
            throw new Error();
          })();

    this.publisher.sendTo(this);
  }

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
    if (
      this.publisher instanceof Store ||
      this.publisher instanceof Parameter ||
      this.publisher instanceof Pointer
    ) {
      const field = this.publisher instanceof Store ? this.publisher : this.publisher.getField();
      const action = field.getAction(name);
      return action;
    }

    throw new Error();
  }
}

class Feature extends Proxy<HTMLElement> implements ConcreteNode<"feature"> {
  readonly abstractNode: Abstract.Feature;

  constructor(abstractNode: Abstract.Feature, domain: Abstract.App["domain"]) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

class Landscape extends Proxy<HTMLElement> implements ConcreteNode<"landscape"> {
  readonly abstractNode: Abstract.Landscape;

  constructor(abstractNode: Abstract.Landscape, domain: Abstract.App["domain"]) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

/* Tier 3 */

class Data extends Proxy<unknown> implements Readable, ConcreteNode<"data"> {
  readonly abstractNode: Abstract.Data;
  private readonly methods: Record<string, Method> = {};

  constructor(abstractNode: Abstract.Data, domain: Abstract.App["domain"], scope: Readable) {
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

  static hydrate(value: Abstract.Data["value"], domain: Abstract.App["domain"], scope: Readable) {
    const hydratedValue =
      value instanceof Array
        ? value.map((item) => new Field(item, domain, scope))
        : Helpers.isRenderable(value)
        ? new Renderable(value, domain)
        : Helpers.isStructure(value)
        ? new Structure(value, domain)
        : value;

    return hydratedValue;
  }
}

class Store extends Proxy<unknown> implements Writable, ConcreteNode<"store"> {
  readonly abstractNode: Abstract.Store;
  private readonly data: Data;
  private readonly actions: Record<string, Action> = {};

  constructor(abstractNode: Abstract.Store, domain: Abstract.App["domain"], scope: Readable) {
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

class Parameter extends Proxy<unknown> implements ConcreteNode<"parameter"> {
  readonly abstractNode: Abstract.Parameter;
  field?: Field; // TODO When does this get assigned?

  constructor(abstractNode: Abstract.Parameter) {
    super();

    this.abstractNode = abstractNode;
  }

  getField(): Field {
    if (this.field !== undefined) {
      return this.field;
    }

    throw new Error();
  }
}

class Pointer extends Proxy<unknown> implements ConcreteNode<"pointer"> {
  readonly abstractNode: Abstract.Pointer;
  private readonly field: Field;

  constructor(abstractNode: Abstract.Pointer, domain: Abstract.App["domain"], scope: Readable) {
    super();

    this.abstractNode = abstractNode;

    const realScope = abstractNode.scope
      ? new MethodCall(abstractNode.scope, domain, scope).getField()
      : scope;

    const route = abstractNode.address.slice();

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      terminal = (terminal ?? realScope).getProperty(nextStop);
      nextStop = route.shift();
    }

    if (terminal !== undefined) {
      this.field = terminal;
      this.field.sendTo(this);
    } else {
      throw new Error();
    }
  }

  getField(): Field {
    return this.field;
  }
}

class Switch extends Publisher<unknown> implements ConcreteNode<"switch"> {
  readonly abstractNode: Abstract.Switch;
  private readonly condition: Field;
  private readonly positive: Field;
  private readonly negative: Field;

  constructor(abstractNode: Abstract.Switch, domain: Abstract.App["domain"], scope: Readable) {
    super();

    this.abstractNode = abstractNode;

    this.positive = new Field(abstractNode.positive, domain, scope);
    this.negative = new Field(abstractNode.negative, domain, scope);
    this.condition = new Field(abstractNode.condition, domain, scope);

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

class MethodCall extends Proxy<unknown> implements ConcreteNode<"methodCall"> {
  readonly abstractNode: Abstract.MethodCall;
  private readonly result: Field;

  constructor(abstractNode: Abstract.MethodCall, domain: Abstract.App["domain"], scope: Readable) {
    super();

    this.abstractNode = abstractNode;

    const realScope = abstractNode.scope
      ? new MethodCall(abstractNode.scope, domain, scope).getField()
      : scope;

    const route = abstractNode.address.slice(0, abstractNode.address.length - 1);

    let terminal: Field | undefined;
    let nextStop = route.shift();

    while (nextStop !== undefined) {
      terminal = (terminal ?? realScope).getProperty(nextStop);
      nextStop = route.shift();
    }

    const methodName = abstractNode.address.slice(-1)[0];
    const argument = abstractNode.argument && new Field(abstractNode.argument, domain, scope);

    if (methodName !== undefined) {
      const method: Method = (terminal ?? realScope).getMethod(methodName);

      if (typeof method === "function") {
        const abstractResult: Abstract.Field = {
          kind: "field",
          publisher: {
            kind: "parameter",
            modelName: abstractNode.modelName,
          },
        };

        this.result = new Field(abstractResult, domain, realScope);

        const methodOwner = terminal ?? scope;

        if (methodOwner instanceof Publisher) {
          methodOwner.sendTo(() => {
            this.result.take(method(argument));
          });
        } else {
          throw new Error();
        }
      } else {
        const closure = argument ? new Closure(argument, realScope) : realScope;

        this.result = new Field(method.result, domain, closure);
      }

      this.result.sendTo(this);
    } else {
      throw new Error();
    }
  }

  getField(): Field {
    return this.result;
  }
}

/* Tier 4 */

class Structure extends Publisher<unknown> implements Dictionary, ConcreteNode<"structure"> {
  readonly abstractNode: Abstract.Structure;

  constructor(abstractNode: Abstract.Structure, domain: Abstract.App["domain"]) {
    super();

    this.abstractNode = abstractNode;

    // TODO Add fields from the model...
  }

  getProperty(name: string): Field {
    // TODO
  }
}
