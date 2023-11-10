import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Helpers from "./helpers";
import * as Style from "./style";

type Action = Abstract.Action | ((argument: any) => unknown);
type Domain = Record<string, DomainMember>;
type DomainMember = Abstract.Model | Abstract.View;
type Method = Abstract.Method | ((argument: any) => unknown);
type Scope = Record<string, ScopeMember>;
type ScopeMember = Abstract.Model | Field | Method | Action | Abstract.Stream;

interface ConcreteNode<Kind extends string> {
  abstractNode: Abstract.Node<Kind>;
}

interface Readable<T> {
  getValue(): T | undefined;
}

interface Subscriber<T> {
  take(value: T): void;
}

abstract class Publisher<T> implements Readable<T> {
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

abstract class Channel<T> extends Publisher<T> implements Subscriber<T> {
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

    this.renderable = new Renderable(app.renderable, Helpers.getGlobalScope(), app.domain);
    this.renderable.sendTo(Dom.render);

    window.console.log(`[VSR] 🟢 Start app:`);
    window.console.log(this);
  }
}

/* Tier 1 */

class Renderable extends Channel<HTMLElement> implements ConcreteNode<"renderable"> {
  readonly abstractNode: Abstract.Renderable;
  private readonly element: Feature | Landscape;

  constructor(abstractNode: Abstract.Renderable, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.element =
      abstractNode.element.kind === "feature"
        ? new Feature(abstractNode.element, scope, domain)
        : new Landscape(abstractNode.element, scope, domain);

    this.element.sendTo(this);
  }
}

/* Tier 2 */

class Field extends Channel<unknown> implements ConcreteNode<"field"> {
  readonly abstractNode: Abstract.Field;

  private readonly publisher:
    | Data
    | Parameter
    | Pointer
    | Switch
    | MethodCall
    | Store
    | WritableParameter
    | WritablePointer;

  constructor(abstractNode: Abstract.Field, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.publisher =
      abstractNode.publisher.kind === "data"
        ? new Data(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "parameter"
        ? new Parameter(abstractNode.publisher)
        : abstractNode.publisher.kind === "pointer"
        ? new Pointer(abstractNode.publisher, scope)
        : abstractNode.publisher.kind === "switch"
        ? new Switch(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "methodCall"
        ? new MethodCall(abstractNode.publisher, scope)
        : abstractNode.publisher.kind === "store"
        ? new Store(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "writableParameter"
        ? new WritableParameter(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "writablePointer"
        ? new WritablePointer(abstractNode.publisher, scope, domain)
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
      this.publisher instanceof WritableParameter ||
      this.publisher instanceof WritablePointer
    ) {
      const field = this.publisher instanceof Store ? this.publisher : this.publisher.getField();
      const action = field.getAction(name);
      return action;
    }

    throw new Error();
  }
}

class Feature extends Channel<HTMLElement> implements ConcreteNode<"feature"> {
  readonly abstractNode: Abstract.Feature;

  constructor(abstractNode: Abstract.Feature, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

class Landscape extends Channel<HTMLElement> implements ConcreteNode<"landscape"> {
  readonly abstractNode: Abstract.Landscape;

  constructor(abstractNode: Abstract.Landscape, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

/* Tier 3 */

class Data extends Channel<unknown> implements ConcreteNode<"data"> {
  readonly abstractNode: Abstract.Data;
  private readonly methods: Record<string, Method> = {};

  constructor(abstractNode: Abstract.Data, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.publish(Data.hydrate(abstractNode.value, scope, domain));

    if (abstractNode.modelName === "Boolean") {
      this.methods.and = (argument) => this.getValue() && argument;
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

  static hydrate(value: Abstract.Data["value"], scope: Scope, domain: Domain) {
    const hydratedValue =
      value instanceof Array
        ? value.map((item) => new Field(item, scope, domain))
        : Helpers.isRenderable(value)
        ? new Renderable(value, scope, domain)
        : Helpers.isStructure(value)
        ? new Structure(value, scope, domain)
        : value;

    return hydratedValue;
  }
}

class Parameter extends Channel<unknown> implements ConcreteNode<"parameter"> {
  readonly abstractNode: Abstract.Parameter;

  constructor(abstractNode: Abstract.Parameter) {
    super();

    this.abstractNode = abstractNode;
  }

  getField(): Field {
    // TODO
  }
}

class Pointer extends Channel<unknown> implements ConcreteNode<"pointer"> {
  readonly abstractNode: Abstract.Pointer;

  constructor(abstractNode: Abstract.Pointer, scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }

  getField(): Field {
    // TODO
  }
}

class Switch extends Channel<unknown> implements ConcreteNode<"switch"> {
  readonly abstractNode: Abstract.Switch;

  constructor(abstractNode: Abstract.Switch, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }

  getField(): Field {
    // TODO
  }
}

class MethodCall extends Channel<unknown> implements ConcreteNode<"methodCall"> {
  readonly abstractNode: Abstract.MethodCall;

  constructor(abstractNode: Abstract.MethodCall, scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }

  getField(): Field {
    // TODO
  }
}

class Store extends Channel<unknown> implements ConcreteNode<"store"> {
  readonly abstractNode: Abstract.Store;
  private readonly data: Data;
  private readonly initialValue: unknown;
  private readonly actions: Record<string, Action> = {};

  constructor(abstractNode: Abstract.Store, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.data = new Data(abstractNode.data, scope, domain);
    this.data.sendTo(this);

    this.initialValue = this.getValue();

    this.actions.reset = () => this.data.take(this.initialValue);
    this.actions.setTo = (argument) => this.data.take(argument);

    if (abstractNode.modelName === "Array") {
      this.actions.push = (argument) => {
        const value = this.getValue() as Array<unknown>;
        value.push(argument); // TODO Do we want to mutate the value?
        this.data.take(value);
      };
    } else if (abstractNode.modelName === "Boolean") {
      this.actions.disable = () => this.data.take(false);
      this.actions.enable = () => this.data.take(true);
      this.actions.toggle = () => this.data.take(!this.getValue());
    } else if (abstractNode.modelName === "Number") {
      this.actions.add = (argument) => this.data.take(this.getValue() + argument);
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

class WritableParameter extends Channel<unknown> implements ConcreteNode<"writableParameter"> {
  readonly abstractNode: Abstract.WritableParameter;

  constructor(abstractNode: Abstract.WritableParameter, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }

  getField(): Field {
    // TODO
  }
}

class WritablePointer extends Channel<unknown> implements ConcreteNode<"writablePointer"> {
  readonly abstractNode: Abstract.WritablePointer;

  constructor(abstractNode: Abstract.WritablePointer, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }

  getField(): Field {
    // TODO
  }
}

/* Tier 4 */

class Structure extends Publisher<unknown> implements ConcreteNode<"structure"> {
  readonly abstractNode: Abstract.Structure;

  constructor(abstractNode: Abstract.Structure, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    // TODO Add fields from the model...
  }

  getProperty(name: string): Field {
    // TODO
  }
}
