import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Domain = Record<string, DomainMember>;
type DomainMember = Abstract.View | Abstract.Model | DomainModelFactory;
type DomainModelFactory = (
  readable: Readable<unknown>,
  subscriber?: Subscriber<unknown>,
) => Abstract.Model;

type FieldMember = Abstract.Model | Field | Method | Action | Fn;
type Fn = (argument: any) => unknown;

type Scope = Record<string, ScopeMember>;
type ScopeMember = FieldMember | Stream;

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
  Boolean: (readable, subscriber) => {
    const members: Record<string, (argument: any) => unknown> = {
      and: (argument) => readable.getValue() && argument,
      not: () => !readable.getValue(),
    };

    if (subscriber) {
      members.disable = () => subscriber.take(false);
      members.enable = () => subscriber.take(true);
      members.toggle = () => subscriber.take(!readable.getValue());
    }

    return {
      kind: "model",
      name: "Boolean",
      members,
    };
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

  private readonly channel?: Channel<unknown>;
  private readonly publisher: Publisher<unknown>;
  private readonly members: Record<string, FieldMember> = {};

  constructor(abstractNode: Abstract.Field, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.channel =
      abstractNode.publisher.kind === "store"
        ? new Store(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "writableFieldPlan"
        ? new WritableFieldPlan(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "writableFieldPointer"
        ? new WritableFieldPointer(abstractNode.publisher, scope, domain)
        : undefined;

    this.publisher =
      abstractNode.publisher.kind === "value"
        ? new Value(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "fieldPlan"
        ? new FieldPlan(abstractNode.publisher)
        : abstractNode.publisher.kind === "fieldPointer"
        ? new FieldPointer(abstractNode.publisher, scope)
        : abstractNode.publisher.kind === "fieldSwitch"
        ? new FieldSwitch(abstractNode.publisher, scope, domain)
        : abstractNode.publisher.kind === "methodPointer"
        ? new MethodPointer(abstractNode.publisher, scope, domain)
        : this.channel ??
          (() => {
            throw new Error();
          })();

    this.publisher.sendTo(this);

    const model = domain[abstractNode.publisher.modelName];

    if (typeof model === "function") {
      // TODO
    } else if (model.kind === "model") {
      // TODO
    } else {
      throw new Error();
    }

    // TODO Add members from model
  }
}

class Method implements ConcreteNode<"method"> {
  readonly abstractNode: Abstract.Method;

  constructor(abstractNode: Abstract.Method) {
    this.abstractNode = abstractNode;
  }
}

class Action implements ConcreteNode<"action"> {
  readonly abstractNode: Abstract.Action;

  constructor(abstractNode: Abstract.Action) {
    this.abstractNode = abstractNode;
  }
}

class Stream implements ConcreteNode<"stream"> {
  readonly abstractNode: Abstract.Stream;

  constructor(abstractNode: Abstract.Stream) {
    this.abstractNode = abstractNode;
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

class Value extends Publisher<unknown> implements ConcreteNode<"value"> {
  readonly abstractNode: Abstract.Value;

  private readonly content: unknown;

  constructor(abstractNode: Abstract.Value, scope: Scope, domain: Domain) {
    super();

    this.abstractNode = abstractNode;

    this.content = Value.hydrate(abstractNode.content, scope, domain);
  }

  static hydrate(content: Abstract.Value["content"], scope: Scope, domain: Domain) {
    return content instanceof Array
      ? content.map((item) => new Field(item, scope, domain))
      : typeof content === "boolean" || typeof content === "number" || typeof content === "string"
      ? content
      : typeof content === "object" && content && "kind" in content && content.kind === "renderable"
      ? new Renderable(content as Abstract.Renderable, scope, domain)
      : typeof content === "object" && content && "kind" in content && content.kind === "structure"
      ? new Structure(content as Abstract.Structure, scope, domain)
      : content;
  }
}

class FieldPlan extends Channel<unknown> implements ConcreteNode<"fieldPlan"> {
  readonly abstractNode: Abstract.FieldPlan;

  constructor(abstractNode: Abstract.FieldPlan) {
    super();

    this.abstractNode = abstractNode;
  }
}

class FieldPointer extends Channel<unknown> implements ConcreteNode<"fieldPointer"> {
  readonly abstractNode: Abstract.FieldPointer;

  constructor(abstractNode: Abstract.FieldPointer, scope: Scope) {
    super();

    this.abstractNode = abstractNode;

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
