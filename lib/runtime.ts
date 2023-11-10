import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Domain = Record<string, DomainMember>;
type DomainMember = Abstract.View | Abstract.Model | DomainModelFactory;
type DomainModelFactory = (publisher: Publisher<unknown>) => Record<string, Handle>;

type FieldMember = Abstract.Model | Field | Abstract.Method | Abstract.Action | Handle;
type Handle = (argument: any) => unknown;

type Scope = Record<string, ScopeMember>;
type ScopeMember = FieldMember | Abstract.Stream;

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

const globalScope: Record<string, Abstract.Model> = {
  browser: {
    kind: "model",
    name: "Browser",
    members: {
      console: {
        kind: "model",
        name: "Console",
        members: {
          log: window.console.log,
        },
      },
    },
  },
};

const defaultDomain: Record<string, DomainModelFactory> = {
  Boolean: (publisher) => {
    const members: Record<string, Handle> = {
      and: (argument) => publisher.getValue() && argument,
      not: () => !publisher.getValue(),
    };

    if (publisher instanceof Channel) {
      members.disable = () => publisher.take(false);
      members.enable = () => publisher.take(true);
      members.toggle = () => publisher.take(!publisher.getValue());
    }

    return members;
  },
};

/* Tier 0 */

export class App implements ConcreteNode<"app"> {
  readonly abstractNode: Abstract.App;

  private readonly renderable: Renderable;

  constructor(app: Abstract.App) {
    this.abstractNode = app;

    const scope = { ...globalScope };
    const domain = { ...defaultDomain, ...app.domain };

    this.renderable = new Renderable(app.renderable, scope, domain);
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

  getMember(name: string): FieldMember {
    const member =
      this.publisher instanceof Data || this.publisher instanceof Store
        ? this.publisher.getMember(name)
        : this.publisher.getField().getMember(name);

    return member;
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

class Data extends Publisher<unknown> implements ConcreteNode<"data"> {
  readonly abstractNode: Abstract.Data;

  private readonly members: Record<string, FieldMember>;

  constructor(abstractNode: Abstract.Data, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    const value = Data.hydrate(abstractNode.value, scope, domain);

    this.publish(value);

    // TODO assign fields and methods from model
  }

  getMember(name: string): FieldMember {
    // TODO
  }

  static hydrate(value: Abstract.Data["value"], scope: Scope, domain: Domain) {
    return value instanceof Array
      ? value.map((item) => new Field(item, scope, domain))
      : typeof value === "boolean" || typeof value === "number" || typeof value === "string"
      ? value
      : typeof value === "object" && value && "kind" in value && value.kind === "renderable"
      ? new Renderable(value as Abstract.Renderable, scope, domain)
      : typeof value === "object" && value && "kind" in value && value.kind === "structure"
      ? new Structure(value as Abstract.Structure, scope, domain)
      : value;
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

  private readonly seedData: Data;
  private readonly members: Record<string, FieldMember>;

  constructor(abstractNode: Abstract.Store, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.seedData = new Data(abstractNode.seedData, scope, domain);
    // TODO assign fields, methods, and actions from model
  }

  getMember(name: string): FieldMember {
    // TODO
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

    // TODO
  }
}
