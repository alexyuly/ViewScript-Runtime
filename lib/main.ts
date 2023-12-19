import { Abstract } from "./abstract";
import { Subscriber, Publisher, Channel } from "./pubsub";

// Root:

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
          atom.connect((htmlElement) => {
            window.document.body.append(htmlElement);
          });
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props);
          viewInstance.connect((htmlElement) => {
            window.document.body.append(htmlElement);
          });
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

// Properties:

class Field extends Channel implements Valuable {
  private readonly content: Atom | ViewInstance | ModelInstance | RawValue | Invocation | Implication | Reference;

  constructor(source: Abstract.Field, propsInScope: Props) {
    super();

    switch (source.content.kind) {
      case "atom": {
        const atom = new Atom(source.content, propsInScope);
        atom.connect(this);
        this.content = atom;
        break;
      }
      case "viewInstance": {
        const viewInstance = new ViewInstance(source.content, propsInScope);
        viewInstance.connect(this);
        this.content = viewInstance;
        break;
      }
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
    if (this.content instanceof Atom || this.content instanceof ViewInstance) {
      return new StoredProps({});
    }

    return this.content.getProps();
  }
}

class Action implements Subscriber<Field | undefined> {
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

  handleEvent(argument?: Field) {
    return this.target.handleEvent(argument);
  }
}

// Stage actors:

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
                } else if (!(fieldValue === false || fieldValue === null || fieldValue === undefined)) {
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
            } else {
              element.setAttribute(key, fieldValue as string);
            }
          });
          this.props.addMember(key, field);
          break;
        }
        case "action": {
          const action = new Action(value, propsInScope);
          element.addEventListener(key.toLowerCase(), (event) => {
            const abstractArgument: Abstract.Field = {
              kind: "field",
              content: {
                kind: "rawValue",
                value: event,
              },
            };
            const argument = new Field(abstractArgument, new StoredProps({}));
            action.handleEvent(argument);
          });
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

// Field content:

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
        push: (field) => {
          const nextValue = [...hydratedArray, field];
          this.publish(nextValue);
        },
        set: (field) => {
          const nextValue = field?.getValue();
          this.publish(nextValue);
        },
      });

      this.publish(hydratedArray);
    } else {
      if (Abstract.isRawObject(source.value)) {
        this.props = new RawObjectProps(source.value);
      } else {
        const props = new StoredProps({
          set: (field) => {
            const nextValue = field?.getValue();
            this.publish(nextValue);
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

    this.condition = new Field(source.condition, propsInScope);
    this.condition.connect((conditionalValue) => {
      const impliedField = conditionalValue ? this.consequence : this.alternative;
      const impliedValue = impliedField?.getValue();
      this.publish(impliedValue);
    });

    this.consequence = new Field(source.consequence, propsInScope);
    this.consequence.connect((impliedValue) => {
      const conditionalValue = this.condition.getValue();
      if (conditionalValue) {
        this.publish(impliedValue);
      }
    });

    if (source.alternative) {
      this.alternative = new Field(source.alternative, propsInScope);
      this.alternative.connect((impliedValue) => {
        const conditionalValue = this.condition.getValue();
        if (!conditionalValue) {
          this.publish(impliedValue);
        }
      });
    }
  }

  getProps(): Props {
    const conditionalValue = this.condition.getValue();
    const impliedField = conditionalValue ? this.consequence : this.alternative;
    const impliedProps = impliedField?.getProps() ?? new StoredProps({});
    return impliedProps;
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
      throw new Error(`Cannot reference a component which is not a field: ${source.fieldName}`);
    }
  }

  getProps(): Props {
    return this.field.getProps();
  }
}

// Action targets:

class Procedure implements Subscriber<Field | undefined> {
  private readonly steps: Array<Abstract.Action>;
  private readonly parameterName?: string;
  private readonly props: Props;

  constructor(source: Abstract.Procedure, propsInScope: Props) {
    this.steps = source.steps;
    this.parameterName = source.parameterName;
    this.props = propsInScope;
  }

  handleEvent(argument?: Field): void {
    let stepsProps = this.props;

    if (this.parameterName && argument) {
      stepsProps = new StoredProps(
        {
          [this.parameterName]: argument,
        },
        this.props,
      );
    }

    for (const step of this.steps) {
      const action = new Action(step, stepsProps);
      const caughtException = action.handleEvent();
      if (caughtException) {
        break;
      }
    }
  }
}

class Exception implements Subscriber<void> {
  private readonly condition: Field;
  private readonly steps: Array<Abstract.Action>;
  private readonly props: Props;

  constructor(source: Abstract.Exception, propsInScope: Props) {
    this.condition = new Field(source.condition, propsInScope);
    this.steps = source.steps ?? [];
    this.props = propsInScope;
  }

  handleEvent(): boolean {
    const conditionalValue = Boolean(this.condition.getValue());

    if (conditionalValue) {
      for (const step of this.steps) {
        const action = new Action(step, this.props);
        action.handleEvent();
      }
    }

    return conditionalValue;
  }
}

class Call implements Subscriber<void> {
  private readonly action: Subscriber<Field | undefined>;
  private readonly argument?: Field;

  constructor(source: Abstract.Call, propsInScope: Props) {
    const context = source.context ? new Field(source.context, propsInScope).getProps() : propsInScope;

    const action = context.getMember(source.actionName);

    if (action instanceof Action) {
      this.action = action;
    } else if (typeof action === "function") {
      this.action = {
        handleEvent: action,
      };
    } else {
      throw new Error(`Cannot call a component which is not an action or function: ${source.actionName}`);
    }

    if (source.argument) {
      this.argument = new Field(source.argument, propsInScope);
    }
  }

  handleEvent(): void {
    this.action.handleEvent(this.argument);
  }
}

// Base types:

interface Valuable {
  getProps(): Props;
}

interface Props {
  getMember(key: string): Property;
}

type Property =
  | Abstract.View
  | Abstract.Task
  | Abstract.Model
  | Abstract.Method
  | Field
  | Action
  | ((argument?: Field) => unknown);

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
