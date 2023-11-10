import * as Abstract from "./abstract";
import * as Dom from "./dom";
import * as Style from "./style";

type Scope = Record<string, ScopeMember>;
type ScopeMember = Abstract.Model | Field | Method | Action | Stream | ((argument: any) => unknown);

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

/* Tier 0 */

export class App implements ConcreteNode<"app"> {
  readonly abstractNode: Abstract.App;

  private readonly renderable: Renderable;

  constructor(app: Abstract.App) {
    this.abstractNode = app;

    const scope = { ...globalScope };
    const domain = { ...app.domain };

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

  constructor(abstractNode: Abstract.Renderable, domain: Abstract.App["domain"], scope: Scope) {
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

class Field extends Channel<unknown> implements ConcreteNode<"field"> {
  readonly abstractNode: Abstract.Field;

  private readonly channel: Publisher<unknown>;

  constructor(abstractNode: Abstract.Field, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    this.channel =
      abstractNode.channel.kind === "value"
        ? new Value(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "fieldPlan"
        ? new FieldPlan(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "fieldPointer"
        ? new FieldPointer(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "fieldSwitch"
        ? new FieldSwitch(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "methodPointer"
        ? new MethodPointer(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "store"
        ? new Store(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "writableFieldPlan"
        ? new WritableFieldPlan(abstractNode.channel, domain, scope)
        : abstractNode.channel.kind === "writableFieldPointer"
        ? new WritableFieldPointer(abstractNode.channel, domain, scope)
        : (() => {
            throw new Error();
          })();

    this.channel.sendTo(this);
  }
}

class Method {
  // TODO
}

class Action {
  // TODO
}

class Stream {
  // TODO
}

class Feature extends Channel<HTMLElement> implements ConcreteNode<"feature"> {
  readonly abstractNode: Abstract.Feature;

  constructor(abstractNode: Abstract.Feature, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

class Landscape extends Channel<HTMLElement> implements ConcreteNode<"landscape"> {
  readonly abstractNode: Abstract.Landscape;

  constructor(abstractNode: Abstract.Landscape, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;
    // TODO
  }
}

/* Tier 3 */

class Value extends Publisher<unknown> implements ConcreteNode<"value"> {
  readonly abstractNode: Abstract.Value;

  private readonly content: unknown;

  constructor(abstractNode: Abstract.Value, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    this.content = Value.hydrate(abstractNode.content, domain, scope);
  }

  static hydrate(
    content: Abstract.Value["content"],
    domain: Abstract.App["domain"],
    scope: Scope,
  ): unknown {
    return content instanceof Array
      ? content.map((item) => new Field(item, domain, scope))
      : typeof content === "boolean" || typeof content === "number" || typeof content === "string"
      ? content
      : typeof content === "object" && content && "kind" in content && content.kind === "renderable"
      ? new Renderable(content as Abstract.Renderable, domain, scope)
      : typeof content === "object" && content && "kind" in content && content.kind === "structure"
      ? new Structure(content as Abstract.Structure, domain, scope)
      : content;
  }
}

/* Tier 4 */

class Structure extends Publisher<unknown> implements ConcreteNode<"structure"> {
  readonly abstractNode: Abstract.Structure;

  constructor(abstractNode: Abstract.Structure, domain: Abstract.App["domain"], scope: Scope) {
    super();

    this.abstractNode = abstractNode;

    // TODO
  }
}
