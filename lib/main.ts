import { Abstract } from "./abstract";
import { Subscriber, Publisher, Channel } from "./pubsub";

type Property = Abstract.View | Abstract.Task | Abstract.Model | Method | Field | Action;

interface Props {
  getMember(key: string): Property;
}

interface Valuable {
  getProps(): Props;
}

class StaticProps implements Props {
  private readonly properties: Record<string, Property>;
  private readonly scopeProps?: Props;

  constructor(properties: Record<string, Property>, scopeProps?: Props) {
    this.properties = properties;
    this.scopeProps = scopeProps;
  }

  addMember(key: string, value: Property) {
    this.properties[key] = value;
  }

  getMember(key: string): Property {
    if (key in this.properties) {
      return this.properties[key];
    }

    if (this.scopeProps) {
      return this.scopeProps.getMember(key);
    }

    throw new Error(`Prop ${key} not found`);
  }
}

export class App {
  private readonly props = new StaticProps({});
  private readonly stage: Array<TaskInstance | ViewInstance | Atom> = [];

  constructor(source: Abstract.App) {
    Object.entries(source.innerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "view":
        case "task":
        case "model":
          this.props.addMember(key, value);
          break;
        case "method":
          this.props.addMember(key, new Method(value, this.props));
          break;
        case "field":
          this.props.addMember(key, new Field(value, this.props));
          break;
        case "action":
          this.props.addMember(key, new Action(value, this.props));
          break;
        default:
          throw new Error(
            `App cannot construct inner prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    this.stage = source.stage.map((component) => {
      switch (component.kind) {
        case "atom": {
          const atom = new Atom(component, this.props);
          atom.connect(window.document.body.append);
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props);
          viewInstance.connect(window.document.body.append);
          return viewInstance;
        }
        case "taskInstance": {
          const taskInstance = new TaskInstance(component, this.props);
          return taskInstance;
        }
        default:
          throw new Error(`App cannot stage a component of invalid kind: ${(component as Abstract.Component).kind}`);
      }
    });
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
    const invocation = new Field(this.source.result, invocationProps);
    return invocation;
  }
}

class Field extends Channel implements Valuable {
  private readonly content: ModelInstance | RawValue | Invocation | Implication | Reference;

  constructor(source: Abstract.Field, scopeProps: Props) {
    super();

    switch (source.content.kind) {
      case "modelInstance":
        this.content = new ModelInstance(source.content, scopeProps);
        break;
      case "rawValue":
        this.content = new RawValue(source.content, scopeProps);
        break;
      case "invocation":
        this.content = new Invocation(source.content, scopeProps);
        break;
      case "implication":
        this.content = new Implication(source.content, scopeProps);
        break;
      case "reference":
        this.content = new Reference(source.content, scopeProps);
        break;
      default:
        throw new Error(
          `Field cannot contain a component of invalid kind: ${(source.content as Abstract.Component).kind}`,
        );
    }

    this.content.connect(this);
  }

  getProps(): Props {
    return this.content.getProps();
  }
}

class Action implements Subscriber {
  private readonly target: Procedure | Exception | Call;

  constructor(source: Abstract.Action, scopeProps: Props) {
    switch (source.target.kind) {
      case "procedure":
        this.target = new Procedure(source.target, scopeProps);
        break;
      case "exception":
        this.target = new Exception(source.target, scopeProps);
        break;
      case "call":
        this.target = new Call(source.target, scopeProps);
        break;
      default:
        throw new Error(
          `Action cannot target a component of invalid kind: ${(source.target as Abstract.Component).kind}`,
        );
    }
  }

  handleEvent(value: unknown): void {
    this.target.handleEvent(value);
  }
}

class Atom extends Publisher<HTMLElement> {
  private readonly props = new StaticProps({});

  constructor(source: Abstract.Atom, scopeProps: Props) {
    super();

    const element = window.document.createElement(source.tagName);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field": {
          const field = new Field(value, scopeProps);
          field.connect((fieldValue) => {
            if (key === "content") {
              const content: Array<Node | string> = [];
              const handleContentValue = (contentValue: unknown) => {
                if (contentValue instanceof Array) {
                  contentValue.forEach((field: Field) => {
                    field.connect(handleContentValue);
                  });
                } else {
                  content.push(contentValue as Node | string);
                }
              };
              handleContentValue(fieldValue);
              element.replaceChildren(...content);
            } else if (CSS.supports(key, fieldValue as string)) {
              element.style.setProperty(key, fieldValue as string);
            } else if (fieldValue === true) {
              element.setAttribute(key, key);
            } else if (fieldValue === false || fieldValue === null || fieldValue === undefined) {
              element.removeAttribute(key);
              element.style.removeProperty(key);
            }
          });
          this.props.addMember(key, field);
          break;
        }
        case "action": {
          const action = new Action(value, scopeProps);
          element.addEventListener(key, action);
          this.props.addMember(key, action);
          break;
        }
        default:
          throw new Error(
            `Atom cannot construct outer prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    this.publish(element);
  }
}

class ViewInstance extends Channel<HTMLElement> {
  private readonly props = new StaticProps({});
  private readonly stage: Array<TaskInstance | ViewInstance | Atom> = [];

  constructor(source: Abstract.ViewInstance, scopeProps: Props) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : scopeProps.getMember(source.view);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error(`Cannot construct invalid view: ${JSON.stringify(source.view)}`);
    }

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field":
          this.props.addMember(key, new Field(value, scopeProps));
          break;
        case "action":
          this.props.addMember(key, new Action(value, scopeProps));
          break;
        default:
          throw new Error(
            `ViewInstance cannot construct outer prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    Object.entries(view.innerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "method":
          this.props.addMember(key, new Method(value, this.props));
          break;
        case "field":
          this.props.addMember(key, new Field(value, this.props));
          break;
        case "action":
          this.props.addMember(key, new Action(value, this.props));
          break;
        default:
          throw new Error(
            `ViewInstance cannot construct inner prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    this.stage = view.stage.map((component) => {
      switch (component.kind) {
        case "atom": {
          const atom = new Atom(component, this.props);
          atom.connect(this);
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props);
          viewInstance.connect(this);
          return viewInstance;
        }
        case "taskInstance": {
          const taskInstance = new TaskInstance(component, this.props);
          return taskInstance;
        }
        default:
          throw new Error(
            `ViewInstance cannot stage a component of invalid kind: ${(component as Abstract.Component).kind}`,
          );
      }
    });
  }
}

class TaskInstance {
  constructor(source: Abstract.TaskInstance, scopeProps: Props) {
    // TODO: ViewScript v0.5
  }
}

class ModelInstance {
  constructor(source: Abstract.ModelInstance, scopeProps: Props) {
    // TODO: ViewScript v0.5
  }
}

class RawValue extends Channel {
  constructor(source: Abstract.RawValue, scopeProps: Props) {
    super();

    if (source.value instanceof Array) {
      // TODO
    } else {
      this.publish(source.value);
    }
  }
}
