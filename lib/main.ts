import { Abstract } from "./abstract";
import { Subscriber, Publisher, Channel } from "./pubsub";

type Property =
  | Abstract.View
  | Abstract.Task
  | Abstract.Model
  | Abstract.Method
  | Field
  | Action
  | ((argument: Field) => unknown);

interface Props {
  getMember(key: string): Property;
}

class StoredProps implements Props {
  private readonly properties: Record<string, Property>;
  private readonly propsInScope?: Props;

  constructor(properties: Record<string, Property>, propsInScope?: Props) {
    this.properties = properties;
    this.propsInScope = propsInScope;
  }

  addMember(key: string, value: Property) {
    this.properties[key] = value;
  }

  getMember(key: string): Property {
    if (key in this.properties) {
      return this.properties[key];
    }

    if (this.propsInScope) {
      return this.propsInScope.getMember(key);
    }

    throw new Error(`Prop ${key} not found`);
  }
}

class RawObjectProps implements Props {
  private readonly value: any;

  constructor(value: any) {
    this.value = value;
  }

  getMember(key: string): Property {
    if (!(key in this.value)) {
      throw new Error(`Prop ${key} not found`);
    }

    if (typeof this.value[key] === "function") {
      return this.value[key];
    }

    const abstractField: Abstract.Field = {
      kind: "field",
      content: {
        kind: "rawValue",
        value: this.value[key],
      },
    };

    const field = new Field(abstractField, new StoredProps({}));
    return field;
  }
}

interface Valuable {
  getProps(): Props;
}

export class App {
  private readonly props = new StoredProps({});
  private readonly stage: Array<TaskInstance | ViewInstance | Atom> = [];

  constructor(source: Abstract.App) {
    Object.entries(source.innerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "view":
        case "task":
        case "model":
        case "method":
          this.props.addMember(key, value);
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

class Field extends Channel implements Valuable {
  private readonly content: ModelInstance | RawValue | Invocation | Implication | Reference;

  constructor(source: Abstract.Field, propsInScope: Props) {
    super();

    switch (source.content.kind) {
      case "modelInstance": {
        const modelInstance = new ModelInstance(source.content, propsInScope);
        this.content = modelInstance;
        break;
      }
      case "rawValue": {
        const rawValue = new RawValue(source.content, propsInScope);
        rawValue.connect(this);
        this.content = rawValue;
        break;
      }
      case "invocation": {
        const invocation = new Invocation(source.content, propsInScope);
        invocation.connect(this);
        this.content = invocation;
        break;
      }
      case "implication": {
        const implication = new Implication(source.content, propsInScope);
        implication.connect(this);
        this.content = implication;
        break;
      }
      case "reference": {
        const reference = new Reference(source.content, propsInScope);
        reference.connect(this);
        this.content = reference;
        break;
      }
      default:
        throw new Error(
          `Field cannot contain a component of invalid kind: ${(source.content as Abstract.Component).kind}`,
        );
    }
  }

  getProps(): Props {
    return this.content.getProps();
  }
}

class Action implements Subscriber {
  private readonly target: Procedure | Exception | Call;

  constructor(source: Abstract.Action, propsInScope: Props) {
    switch (source.target.kind) {
      case "procedure":
        this.target = new Procedure(source.target, propsInScope);
        break;
      case "exception":
        this.target = new Exception(source.target, propsInScope);
        break;
      case "call":
        this.target = new Call(source.target, propsInScope);
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
  private readonly props = new StoredProps({});

  constructor(source: Abstract.Atom, propsInScope: Props) {
    super();

    const element = window.document.createElement(source.tagName);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field": {
          const field = new Field(value, propsInScope);
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
          const action = new Action(value, propsInScope);
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
  private readonly props = new StoredProps({});
  private readonly stage: Array<TaskInstance | ViewInstance | Atom> = [];

  constructor(source: Abstract.ViewInstance, propsInScope: Props) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : propsInScope.getMember(source.view);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error(`Cannot construct invalid view: ${JSON.stringify(source.view)}`);
    }

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field":
          this.props.addMember(key, new Field(value, propsInScope));
          break;
        case "action":
          this.props.addMember(key, new Action(value, propsInScope));
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
          this.props.addMember(key, value);
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
  constructor(source: Abstract.TaskInstance, propsInScope: Props) {
    // TODO: ViewScript v0.5
  }
}

class ModelInstance implements Valuable {
  private readonly props = new StoredProps({});

  constructor(source: Abstract.ModelInstance, propsInScope: Props) {
    // TODO: ViewScript v0.5
  }

  getProps(): Props {
    return this.props;
  }
}

class RawValue extends Channel implements Valuable {
  private readonly props: Props;

  constructor(source: Abstract.RawValue, propsInScope: Props) {
    super();

    if (source.value instanceof Array) {
      const hydratedArray: Array<Field> = source.value.map((value) => {
        if (!(Abstract.isComponent(value) && value.kind === "field")) {
          throw new Error(`Cannot hydrate an array element which is not an abstract field: ${JSON.stringify(value)}`);
        }
        const hydratedField = new Field(value as Abstract.Field, propsInScope);
        return hydratedField;
      });

      this.props = new StoredProps({
        push: (value) => {
          const nextValue = [...hydratedArray, value];
          this.publish(nextValue);
        },
        setTo: (value) => {
          this.publish(value);
        },
      });

      this.publish(hydratedArray);
    } else {
      if (Abstract.isRawObject(source.value)) {
        this.props = new RawObjectProps(source.value);
      } else {
        const props = new StoredProps({
          setTo: (value) => {
            this.publish(value);
          },
        });

        if (typeof source.value === "boolean") {
          props.addMember("toggle", () => {
            const nextValue = !this.getValue();
            this.publish(nextValue);
          });
        }

        this.props = props;
      }

      this.publish(source.value);
    }
  }

  getProps(): Props {
    return this.props;
  }
}

class Invocation extends Channel implements Valuable {
  constructor(source: Abstract.Invocation, propsInScope: Props) {
    super();

    // TODO: ViewScript v0.5
  }

  getProps(): Props {
    return new StoredProps({});
  }
}

class Implication extends Channel implements Valuable {
  private readonly condition: Field;
  private readonly consequence: Field;
  private readonly alternative?: Field;

  constructor(source: Abstract.Implication, propsInScope: Props) {
    super();

    this.consequence = new Field(source.consequence, propsInScope);
    this.consequence.connect(this);

    if (source.alternative) {
      this.alternative = new Field(source.alternative, propsInScope);
      this.alternative.connect(this);
    }

    this.condition = new Field(source.condition, propsInScope);
    this.condition.connect((conditionalValue) => {
      const impliedField = conditionalValue ? this.consequence : this.alternative;
      const impliedValue = impliedField?.getValue();
      this.publish(impliedValue);
    });
  }

  getProps(): Props {
    const conditionalValue = this.condition.getValue();
    const impliedField = conditionalValue ? this.consequence : this.alternative;
    return impliedField?.getProps() ?? new StoredProps({});
  }
}

class Reference extends Channel implements Valuable {
  private readonly field: Field;

  constructor(source: Abstract.Reference, propsInScope: Props) {
    super();

    const context = source.context ? new Field(source.context, propsInScope).getProps() : propsInScope;

    const field = context.getMember(source.fieldName);

    if (field instanceof Field) {
      field.connect(this);
      this.field = field;
    } else {
      throw new Error(`Reference cannot point to a component which is not a field: ${source.fieldName}`);
    }
  }

  getProps(): Props {
    return this.field.getProps();
  }
}

class Procedure implements Subscriber {
  // TODO
  constructor(source: Abstract.Procedure, propsInScope: Props) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}

class Exception implements Subscriber {
  // TODO
  constructor(source: Abstract.Exception, propsInScope: Props) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}

class Call implements Subscriber {
  // TODO
  // Finish RawValue first
  constructor(source: Abstract.Call, propsInScope: Props) {
    // TODO
  }

  handleEvent(value: unknown): void {
    // TODO
  }
}
