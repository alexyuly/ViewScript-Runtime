import type { Abstract } from "./abstract";
import { isSubscriber, Subscriber, Publisher, Channel } from "./pubsub";

type Component = { kind: string };
type Property = Action | Field | Method | Abstract.Model | Abstract.Task | Abstract.View;

interface Props {
  getMember(key: string): Property;
}

interface Valuable {
  getProps(): Props;
}

class StaticProps implements Props {
  private readonly props: Record<string, Property>;
  private readonly base?: Props;

  constructor(props: Record<string, Property>, base?: Props) {
    this.props = props;
    this.base = base;
  }

  addMember(key: string, value: Property) {
    this.props[key] = value;
  }

  getMember(key: string): Property {
    if (key in this.props) {
      return this.props[key];
    }

    if (this.base) {
      return this.base.getMember(key);
    }

    throw new Error(`Prop ${key} not found`);
  }
}

export class Application {
  private readonly props = new StaticProps({});
  private readonly stage: Array<TaskInstance | ViewInstance | Atom> = [];

  constructor(source: Abstract.Application) {
    Object.entries(source.props).forEach(([key, value]) => {
      switch (value.kind) {
        case "action":
          this.props.addMember(key, new Action(value, this.props));
          break;
        case "field":
          this.props.addMember(key, new Field(value, this.props));
          break;
        case "method":
          this.props.addMember(key, new Method(value, this.props));
          break;
        case "model":
        case "task":
        case "view":
          this.props.addMember(key, value);
          break;
        default:
          throw new Error(`Application cannot construct prop ${key} of unknown kind: ${(value as Component).kind}`);
      }
    });

    this.stage = source.stage.map((component) => {
      switch (component.kind) {
        case "taskInstance":
          return new TaskInstance(component, this.props);
        case "viewInstance": {
          const view = new ViewInstance(component, this.props);
          view.connect(window.document.body.append);
          return view;
        }
        case "atom": {
          const atomicElement = new Atom(component, this.props);
          atomicElement.connect(window.document.body.append);
          return atomicElement;
        }
        default:
          throw new Error(`Application cannot stage a component of unknown kind: ${(component as Component).kind}`);
      }
    });
  }
}

class Action implements Subscriber {
  private readonly target: Subscriber["handleEvent"] | Procedure | Exception | Call;

  constructor(source: Subscriber["handleEvent"] | Abstract.Action, props: Props) {
    if (typeof source === "function") {
      this.target = source;
    } else {
      switch (source.target.kind) {
        case "procedure":
          this.target = new Procedure(source.target, props);
          break;
        case "exception":
          this.target = new Exception(source.target, props);
          break;
        case "call":
          this.target = new Call(source.target, props);
          break;
        default:
          throw new Error(`Action cannot target a component of unknown kind: ${(source.target as Component).kind}`);
      }
    }
  }

  handleEvent(value: unknown): void {
    if (typeof this.target === "function") {
      this.target(value);
    } else {
      this.target.handleEvent(value);
    }
  }
}

class Field extends Channel implements Valuable {
  private readonly content: Store | Invocation | Implication | Reference;

  constructor(source: Abstract.Field, props: Props) {
    super();

    switch (source.content.kind) {
      case "store":
        this.content = new Store(source.content, props);
        break;
      case "invocation":
        this.content = new Invocation(source.content, props);
        break;
      case "implication":
        this.content = new Implication(source.content, props);
        break;
      case "reference":
        this.content = new Reference(source.content, props);
        break;
      default:
        throw new Error(`Field cannot contain content of unknown kind: ${(source.content as Component).kind}`);
    }

    this.content.connect(this);
  }

  getProps(): Props {
    return this.content.getProps();
  }
}

class Method {
  private readonly source: Abstract.Method;
  private readonly props: Props;

  constructor(source: Abstract.Method, props: Props) {
    this.source = source;
    this.props = props;
  }

  invoke(argument?: Field): Field {
    const invocationProps = new StaticProps(
      argument
        ? {
            [this.source.parameterName ?? "it"]: argument,
          }
        : {},
      this.props,
    );
    const invocation = new Field(this.source.invocationResult, invocationProps);
    return invocation;
  }
}

class TaskInstance {
  constructor(source: Abstract.TaskInstance, props: Props) {
    // TODO
  }
}

class ViewInstance {
  constructor(source: Abstract.ViewInstance, props: Props) {
    // TODO
  }
}
