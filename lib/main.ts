import type { Abstract } from "./abstract";
import { isSubscriber, Subscriber, Publisher, Channel } from "./pubsub";

type Component = { kind: string };
type Property = Action | Field | Method | Abstract.Model | Abstract.Task | Abstract.View;

export class Application {
  private readonly props: Record<string, Property> = {};
  private readonly stage: Array<Task | View | AtomicElement> = [];

  constructor(source: Abstract.Application) {
    Object.entries(source.props).forEach(([key, value]) => {
      switch (value.kind) {
        case "action":
          this.props[key] = new Action(value, this.props);
          break;
        case "field":
          this.props[key] = new Field(value, this.props);
          break;
        case "method":
          this.props[key] = new Method(value, this.props);
          break;
        case "model":
          this.props[key] = value;
          break;
        case "task":
          this.props[key] = value;
          break;
        case "view":
          this.props[key] = value;
          break;
        default:
          throw new Error(`Application cannot construct prop ${key} of unknown kind: ${(value as Component).kind}`);
      }
    });

    this.stage = source.stage.map((component) => {
      switch (component.kind) {
        case "task":
          return new Task(component, this.props);
        case "view":
          return new View(component, this.props);
        case "atomicElement":
          return new AtomicElement(component, this.props);
        default:
          throw new Error(`Application cannot stage a component of unknown kind: ${(component as Component).kind}`);
      }
    });
  }
}

class Action implements Subscriber {
  private readonly target: Procedure | Call | Exception;

  constructor(source: Abstract.Action, props: Record<string, Property>) {
    switch (source.target.kind) {
      case "procedure":
        this.target = new Procedure(source.target, props);
        break;
      case "call":
        this.target = new Call(source.target, props);
        break;
      case "exception":
        this.target = new Exception(source.target, props);
        break;
      default:
        throw new Error(`Action cannot target a component of unknown kind: ${(source.target as Component).kind}`);
    }
  }

  handleEvent(value: unknown): void {
    this.target.handleEvent(value);
  }
}

class Field extends Channel {
  private readonly content: Store | Result | Reference | Implication;

  constructor(source: Abstract.Field, props: Record<string, Property>) {
    super();

    switch (source.content.kind) {
      case "store":
        this.content = new Store(source.content, props);
        break;
      case "result":
        this.content = new Result(source.content, props);
        break;
      case "reference":
        this.content = new Reference(source.content, props);
        break;
      case "implication":
        this.content = new Implication(source.content, props);
        break;
      default:
        throw new Error(`Field cannot contain content of unknown kind: ${(source.content as Component).kind}`);
    }

    this.content.connect(this);
  }
}

class Method {
  private readonly source: Abstract.Method;
  private readonly props: Record<string, Property>;

  constructor(source: Abstract.Method, props: Record<string, Property>) {
    this.source = source;
    this.props = props;
  }

  invoke(argument?: Field): Field {
    // TODO Add argument to props
    // TODO Use a class for props
    return new Field(this.source.result, this.props);
  }
}
