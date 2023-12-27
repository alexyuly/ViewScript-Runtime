import { Abstract } from "./abstract";
import { Subscriber, Publisher, SafePublisher, Channel, SafeChannel } from "./pubsub";

/**
 * Foundation:
 */

export class App {
  private readonly props = new StoredProps({});
  private readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.App) {
    Object.entries(source.innerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "view":
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
            document.body.append(htmlElement);
          });
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props);
          viewInstance.connect((htmlElement) => {
            document.body.append(htmlElement);
          });
          return viewInstance;
        }
        default:
          throw new Error(`App cannot stage a component of invalid kind: ${(component as Abstract.Component).kind}`);
      }
    });
  }
}

/**
 * Fields:
 */

class Field extends SafeChannel implements Valuable {
  private readonly fallback?: Action;

  private readonly content:
    | Atom
    | ViewInstance
    | ModelInstance
    | RawValue
    | Reference
    | Expression
    | Expectation
    | Implication;

  constructor(source: Abstract.Field, closure: Props) {
    super();

    this.fallback = source.fallback && new Action(source.fallback, closure);

    switch (source.content.kind) {
      case "atom": {
        const atom = new Atom(source.content, closure);
        atom.connect(this);
        this.content = atom;
        break;
      }
      case "viewInstance": {
        const viewInstance = new ViewInstance(source.content, closure);
        viewInstance.connect(this);
        this.content = viewInstance;
        break;
      }
      case "modelInstance": {
        const modelInstance = new ModelInstance(source.content, closure);
        this.content = modelInstance;
        break;
      }
      case "rawValue": {
        const rawValue = new RawValue(source.content, closure);
        rawValue.connect(this);
        this.content = rawValue;
        break;
      }
      case "reference": {
        const reference = new Reference(source.content, closure);
        reference.connect(this);
        this.content = reference;
        break;
      }
      case "expression": {
        const expression = new Expression(source.content, closure);
        expression.connect(this);
        this.content = expression;
        break;
      }
      case "expectation": {
        const expectation = new Expectation(source.content, closure);
        expectation.connect(this);
        this.content = expectation;
        break;
      }
      case "implication": {
        const implication = new Implication(source.content, closure);
        implication.connect(this);
        this.content = implication;
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

  handleError(error: unknown): void {
    if (this.fallback) {
      const abstractField: Abstract.Field = {
        kind: "field",
        content: {
          kind: "rawValue",
          value: error,
        },
      };
      const field = new Field(abstractField, new StoredProps({}));
      this.fallback.handleEvent([field]);
    } else {
      super.handleError(error);
    }
  }
}

class Atom extends Publisher<HTMLElement> {
  private readonly props = new StoredProps({});

  constructor(source: Abstract.Atom, closure: Props) {
    super();

    const element = document.createElement(source.tagName);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field": {
          const field = new Field(value, closure);
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
          const action = new Action(value, closure);
          const eventType = key.toLowerCase();
          element.addEventListener(eventType, (event) => {
            const abstractArgument: Abstract.Field = {
              kind: "field",
              content: {
                kind: "rawValue",
                value: event,
              },
            };
            const argument = new Field(abstractArgument, new StoredProps({}));
            action.handleEvent([argument]);
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
  private readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.ViewInstance, closure: Props) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : closure.getMember(source.view);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error(`Cannot construct invalid view: ${JSON.stringify(source.view)}`);
    }

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field":
          this.props.addMember(key, new Field(value, closure));
          break;
        case "action":
          this.props.addMember(key, new Action(value, closure));
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
        default:
          throw new Error(
            `ViewInstance cannot stage a component of invalid kind: ${(component as Abstract.Component).kind}`,
          );
      }
    });
  }
}

class ModelInstance implements Valuable {
  private readonly props = new StoredProps({});

  constructor(source: Abstract.ModelInstance, closure: Props) {
    const model = !source.model || Abstract.isComponent(source.model) ? source.model : closure.getMember(source.model);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field":
          this.props.addMember(key, new Field(value, closure));
          break;
        case "action":
          this.props.addMember(key, new Action(value, closure));
          break;
        default:
          throw new Error(
            `ModelInstance cannot construct outer prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    if (Abstract.isComponent(model) && model.kind === "model") {
      Object.entries(model.innerProps).forEach(([key, value]) => {
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
              `ModelInstance cannot construct inner prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
            );
        }
      });
    }
  }

  getProps(): Props {
    return this.props;
  }
}

class RawValue extends Publisher implements Valuable {
  private readonly props: Props;

  constructor(source: Abstract.RawValue, closure: Props) {
    super();

    if (source.value instanceof Array) {
      this.props = new StoredProps({
        push: (field) => {
          const currentValue = this.getValue();
          const nextValue = [...(currentValue instanceof Array ? currentValue : []), field];
          this.publish(nextValue);
        },
        set: (field) => {
          const nextValue = field?.getValue();
          this.publish(nextValue);
        },
      });

      const hydratedArray: Array<Field> = source.value.map((value) => {
        if (!(Abstract.isComponent(value) && value.kind === "field")) {
          throw new Error(`Cannot hydrate an array element which is not an abstract field: ${JSON.stringify(value)}`);
        }
        const hydratedField = new Field(value as Abstract.Field, closure);
        return hydratedField;
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

class Reference extends SafeChannel implements Valuable {
  private readonly field: Field;

  constructor(source: Abstract.Reference, closure: Props) {
    super();

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;
    const field = scope.getMember(source.fieldName);

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

class Expression extends SafeChannel implements Valuable {
  private readonly args: Array<Field>;
  private readonly result: Field;

  constructor(source: Abstract.Expression, closure: Props) {
    super();

    this.args = source.arguments.map((argument) => {
      const arg = new Field(argument, closure);
      return arg;
    });

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;
    const method = scope.getMember(source.methodName);

    if (Abstract.isComponent(method) && method.kind === "method") {
      let parameterizedClosure = closure;

      if (method.parameterName) {
        parameterizedClosure = new StoredProps(
          {
            [method.parameterName]: this.args[0],
          },
          closure,
        );
      }

      this.result = new Field(method.result, parameterizedClosure);
      this.result.connect(this);
    } else if (typeof method === "function") {
      const abstractResult: Abstract.Field = {
        kind: "field",
        content: {
          kind: "rawValue",
          value: method(...this.args), // TODO Memoize calls to this method.
        },
      };

      this.result = new Field(abstractResult, new StoredProps({}));
      this.result.connect(this);

      this.args.forEach((arg) => {
        arg.connect(() => {
          const resultingValue = method(...this.args); // TODO Memoize calls to this method.
          this.result.handleEvent(resultingValue);
        });
      });
    } else {
      throw new Error(`Cannot invoke a component which is not a method or function: ${source.methodName}`);
    }
  }

  getProps(): Props {
    return this.result.getProps();
  }
}

class Expectation extends SafePublisher implements Valuable {
  private readonly expression: Expression;
  private readonly queue: Array<{ id: string; promise: Promise<unknown> }> = [];

  constructor(source: Abstract.Expectation, closure: Props) {
    super();

    this.expression = new Expression(source.expression, closure);

    this.expression.connect((resultingValue) => {
      const attendant = {
        id: crypto.randomUUID(),
        promise: Promise.resolve(resultingValue),
      };
      this.queue.push(attendant);
      attendant.promise
        .then((value) => {
          const index = this.queue.indexOf(attendant);
          if (index !== -1) {
            this.queue.splice(0, index + 1);
            this.publish(value);
          }
        })
        .catch((error) => {
          const index = this.queue.indexOf(attendant);
          if (index !== -1) {
            this.queue.splice(index, 1);
            this.publishError(error);
          }
        });
    });
  }

  getProps(): Props {
    const abstractValue: Abstract.RawValue = {
      kind: "rawValue",
      value: this.getValue(),
    };
    const rawValue = new RawValue(abstractValue, new StoredProps({}));
    return rawValue.getProps();
  }
}

class Implication extends SafeChannel implements Valuable {
  private readonly condition: Field;
  private readonly consequence: Field;
  private readonly alternative?: Field | Action;

  constructor(source: Abstract.Implication, closure: Props) {
    super();

    this.condition = new Field(source.condition, closure);
    this.condition.connect((isConditionMet) => {
      const impliedField = isConditionMet
        ? this.consequence
        : this.alternative instanceof Field
        ? this.alternative
        : undefined;

      const impliedValue = impliedField?.getValue();
      this.publish(impliedValue);

      if (this.alternative instanceof Action) {
        this.alternative.handleEvent();
      }
    });

    this.consequence = new Field(source.consequence, closure);
    this.consequence.connect((impliedValue) => {
      const isConditionMet = this.condition.getValue();
      if (isConditionMet) {
        this.publish(impliedValue);
      }
    });

    if (Abstract.isComponent(source.alternative) && source.alternative.kind === "field") {
      this.alternative = new Field(source.alternative, closure);
      this.alternative.connect((impliedValue) => {
        const isConditionMet = this.condition.getValue();
        if (!isConditionMet) {
          this.publish(impliedValue);
        }
      });
    }
  }

  getProps(): Props {
    const isConditionMet = this.condition.getValue();

    const impliedField = isConditionMet
      ? this.consequence
      : this.alternative instanceof Field
      ? this.alternative
      : undefined;

    const impliedProps = impliedField?.getProps() ?? new StoredProps({});
    return impliedProps;
  }
}

/**
 * Actions:
 */

class Action implements Subscriber<Array<Field>> {
  private readonly target: Procedure | Call | Invocation | Gate;

  constructor(source: Abstract.Action, closure: Props) {
    switch (source.target.kind) {
      case "procedure":
        this.target = new Procedure(source.target, closure);
        break;
      case "call":
        this.target = new Call(source.target, closure);
        break;
      case "invocation":
        this.target = new Invocation(source.target, closure);
        break;
      case "gate":
        this.target = new Gate(source.target, closure);
        break;
      default:
        throw new Error(
          `Action cannot target a component of invalid kind: ${(source.target as Abstract.Component).kind}`,
        );
    }
  }

  handleEvent(callArguments: Array<Field> = []) {
    return this.target.handleEvent(callArguments);
  }
}

class Procedure implements Subscriber<Array<Field>> {
  private readonly steps: Array<Abstract.Action>;
  private readonly parameterName?: string;
  private readonly closure: Props;

  constructor(source: Abstract.Procedure, closure: Props) {
    this.steps = source.steps;
    this.parameterName = source.parameterName;
    this.closure = closure;
  }

  handleEvent(callArguments: Array<Field>): void {
    let parameterizedClosure = this.closure;

    if (this.parameterName) {
      parameterizedClosure = new StoredProps(
        {
          [this.parameterName]: callArguments[0],
        },
        this.closure,
      );
    }

    for (const step of this.steps) {
      const action = new Action(step, parameterizedClosure);
      const caughtException = action.handleEvent();

      if (caughtException) {
        break;
      }
    }
  }
}

class Call implements Subscriber<void> {
  private readonly args: Array<Field>;
  private readonly action: Subscriber<Array<Field>>;

  constructor(source: Abstract.Call, closure: Props) {
    this.args = source.arguments.map((argument) => {
      const arg = new Field(argument, closure);
      return arg;
    });

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;
    const action = scope.getMember(source.actionName);

    if (action instanceof Action) {
      this.action = action;
    } else if (typeof action === "function") {
      this.action = {
        handleEvent: (args) => action(...args),
      };
    } else {
      throw new Error(`Cannot call a component which is not an action or function: ${source.actionName}`);
    }
  }

  handleEvent(): void {
    this.action.handleEvent(this.args);
  }
}

class Invocation implements Subscriber<void> {
  private readonly prerequisite: Abstract.Field;
  private readonly procedure: Abstract.Procedure;
  private readonly closure: Props;

  constructor(source: Abstract.Invocation, closure: Props) {
    this.prerequisite = source.prerequisite;
    this.procedure = source.procedure;
    this.closure = closure;
  }

  handleEvent(): void {
    const prerequisite = new Field(this.prerequisite, this.closure);

    prerequisite.connect((prerequisiteValue) => {
      const args: Array<Field> = [];

      if (this.procedure.parameterName) {
        const abstractField: Abstract.Field = {
          kind: "field",
          content: {
            kind: "rawValue",
            value: prerequisiteValue,
          },
        };
        const field = new Field(abstractField, new StoredProps({}));
        args.push(field);
      }

      const procedure = new Procedure(this.procedure, this.closure);
      procedure.handleEvent(args);
    });
  }
}

class Gate implements Subscriber<void> {
  private readonly condition: Field;
  private readonly consequence?: Abstract.Action;
  private readonly closure: Props;

  constructor(source: Abstract.Gate, closure: Props) {
    this.condition = new Field(source.condition, closure);
    this.consequence = source.consequence;
    this.closure = closure;
  }

  handleEvent(): boolean {
    const isConditionMet = this.condition.getValue();

    if (isConditionMet && this.consequence) {
      const action = new Action(this.consequence, this.closure);
      action.handleEvent();
    }

    return Boolean(isConditionMet);
  }
}

/**
 * Useful stuff:
 */

interface Valuable {
  getProps(): Props;
}

interface Props {
  getMember(key: string): Property;
}

type Property =
  | Abstract.View
  | Abstract.Model
  | Abstract.Method
  | Field
  | Action
  | ((...args: Array<Field>) => unknown);

class RawObjectProps implements Props {
  private readonly value: any;

  constructor(value: object) {
    this.value = value;
  }

  getMember(key: string): Property {
    if (!(key in this.value)) {
      throw new Error(`Prop ${key} not found`);
    }

    const memberValue = this.value[key];

    if (typeof memberValue === "function") {
      const callableMemberValue =
        memberValue.prototype?.constructor === memberValue
          ? (argument: unknown) => new memberValue(argument)
          : memberValue.bind(this.value);

      const memberFunction = (argument?: Field) => {
        const argumentValue = argument?.getValue();
        const result = callableMemberValue(argumentValue);
        return result;
      };

      return memberFunction;
    }

    const abstractField: Abstract.Field = {
      kind: "field",
      content: {
        kind: "rawValue",
        value: memberValue,
      },
    };

    const field = new Field(abstractField, new StoredProps({}));
    return field;
  }
}

class StoredProps implements Props {
  private readonly properties: Record<string, Property>;
  private readonly closure?: Props;
  private static readonly globalScope = new RawObjectProps(window);

  constructor(properties: Record<string, Property>, closure?: Props) {
    this.properties = properties;
    this.closure = closure;
  }

  addMember(key: string, value: Property) {
    this.properties[key] = value;
  }

  getMember(key: string): Property {
    if (key in this.properties) {
      return this.properties[key];
    }

    if (this.closure) {
      return this.closure.getMember(key);
    }

    return StoredProps.globalScope.getMember(key);
  }
}
