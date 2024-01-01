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
          throw new Error(`App cannot stage something of invalid kind: ${(component as Abstract.Component).kind}`);
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

  constructor(source: Abstract.Field | Expression, closure: Props) {
    super();

    if (source instanceof Expression) {
      this.content = source;
      return;
    }

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
        modelInstance.connect(this);
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
          `Field cannot contain something of invalid kind: ${(source.content as Abstract.Component).kind}`,
        );
    }
  }

  getProps(): Props | Promise<Props> {
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
      throw new Error("Cannot construct invalid view.");
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
            `ViewInstance cannot stage something of invalid kind: ${(component as Abstract.Component).kind}`,
          );
      }
    });
  }
}

class ModelInstance extends SafeChannel implements Valuable {
  private readonly props = new StoredProps({});

  constructor(source: Abstract.ModelInstance, closure: Props) {
    super();

    const model = Abstract.isComponent(source.model) ? source.model : closure.getMember(source.model);

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

    // TODO Publish the initial value of the model's serialized contents.
    // TODO Listen to the model's property changes and publish the serialized contents.
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
        map: (field) => {
          const method = field.getValue();
          if (!(Abstract.isComponent(method) && method.kind === "method")) {
            throw new Error("Cannot map an array with an argument which is not a method.");
          }
          const currentValue = this.getValue();
          const fn = method as Abstract.Method;
          const nextValue: Array<Field> = (currentValue instanceof Array ? currentValue : [currentValue]).map((arg) => {
            const expression = new Expression([fn, [arg]], closure);
            const field = new Field(expression, closure);
            return field;
          });
          return nextValue;
        },
        push: (field) => {
          const currentValue = this.getValue();
          const nextValue = [...(currentValue instanceof Array ? currentValue : [currentValue]), field];
          this.publish(nextValue);
        },
        set: (field) => {
          const nextValue = field?.getValue();
          this.publish(nextValue);
        },
      });

      const hydratedArray: Array<Field> = source.value.map((value) => {
        if (!(Abstract.isComponent(value) && value.kind === "field")) {
          throw new Error("Cannot hydrate an array element which is not an abstract field.");
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
        } else if (typeof source.value === "string") {
          props.addMember("plus", (field) => {
            const currentValue = this.getValue();
            const nextValue = `${currentValue}${field.getValue()}`;
            return nextValue;
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
  private readonly field: Promise<Field>;

  constructor(source: Abstract.Reference, closure: Props) {
    super();

    this.field = (async () => {
      const scope = await Promise.resolve(source.scope ? new Field(source.scope, closure).getProps() : closure);

      const field = scope.getMember(source.fieldName);

      if (!(field instanceof Field)) {
        throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
      }

      field.connect(this);

      return field;
    })();
  }

  async getProps(): Promise<Props> {
    const field = await this.field;

    return field.getProps();
  }
}

class Expression extends SafeChannel implements Valuable {
  private readonly result: Promise<Field>;

  constructor(source: [Abstract.Method, Array<Field>] | Abstract.Expression, closure: Props) {
    super();

    this.result = (async () => {
      let method: Property;
      let args: Array<Field>;

      if (source instanceof Array) {
        [method, args] = source;
      } else {
        const scope = await Promise.resolve(source.scope ? new Field(source.scope, closure).getProps() : closure);

        method = scope.getMember(source.methodName);

        args = source.arguments.map((argument) => {
          const arg = new Field(argument, closure);
          return arg;
        });
      }

      let result: Field | undefined;

      if (Abstract.isComponent(method) && method.kind === "method") {
        let parameterizedClosure = closure;

        if (method.parameterName) {
          parameterizedClosure = new StoredProps(
            {
              [method.parameterName]: args[0],
            },
            closure,
          );
        }

        result = new Field(method.result, parameterizedClosure);
      }

      if (typeof method === "function") {
        // TODO Memoize the results of functional method calls.

        const typeSafeMethod = method;

        const abstractResult: Abstract.Field = {
          kind: "field",
          content: {
            kind: "rawValue",
            value: typeSafeMethod(...args),
          },
        };

        const typeSafeResult = new Field(abstractResult, new StoredProps({}));

        args.forEach((arg) => {
          arg.connect(() => {
            const resultingValue = typeSafeMethod(...args);
            typeSafeResult.handleEvent(resultingValue);
          });
        });

        result = typeSafeResult;
      }

      if (!(result instanceof Field)) {
        throw new Error("Cannot express something which is not an abstract method or a function.");
      }

      result.connect(this);

      return result;
    })();
  }

  async getProps(): Promise<Props> {
    const result = await this.result;

    return result.getProps();
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

  getProps(): Promise<Props> {
    const asyncContainer = new AsyncPropsContainer();
    this.connect(asyncContainer);

    return asyncContainer.getProps();
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

  getProps(): Props | Promise<Props> {
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
          `Action cannot target something of invalid kind: ${(source.target as Abstract.Component).kind}`,
        );
    }
  }

  handleEvent(args: Array<Field> = []) {
    return this.target.handleEvent(args);
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

  handleEvent(args: Array<Field>): void {
    let parameterizedClosure = this.closure;

    if (this.parameterName) {
      parameterizedClosure = new StoredProps(
        {
          [this.parameterName]: args[0],
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

class Call implements Subscriber<Array<Field>> {
  private readonly constantArgs?: Array<Field>;
  private readonly action: Promise<Subscriber<Array<Field>>>;
  private readonly queue: Array<{ args: Array<Field> }> = [];

  constructor(source: Abstract.Call, closure: Props) {
    this.constantArgs = source.arguments?.map((argument) => {
      const arg = new Field(argument, closure);
      return arg;
    });

    this.action = (async () => {
      const scope = await Promise.resolve(source.scope ? new Field(source.scope, closure).getProps() : closure);

      const action = scope.getMember(source.actionName);

      if (action instanceof Action) {
        return action;
      }

      if (typeof action === "function") {
        return {
          handleEvent: (args) => action(...args),
        };
      }

      throw new Error(`Cannot call something which is not an action or function: ${source.actionName}`);
    })();
  }

  handleEvent(args: Array<Field>): void {
    this.queue.push({
      args: this.constantArgs ?? args,
    });

    (async () => {
      const action = await this.action;

      let next = this.queue.shift();

      while (next) {
        action.handleEvent(next.args);
        next = this.queue.shift();
      }
    })();
  }
}

class Invocation implements Subscriber<void> {
  private readonly prerequisite: Abstract.Field;
  private readonly procedure?: Abstract.Procedure;
  private readonly closure: Props;

  constructor(source: Abstract.Invocation, closure: Props) {
    this.prerequisite = source.prerequisite;
    this.procedure = source.procedure;
    this.closure = closure;
  }

  handleEvent(): void {
    const prerequisite = new Field(this.prerequisite, this.closure);

    prerequisite.connect((prerequisiteValue) => {
      if (this.procedure) {
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
      }
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
  getProps(): Props | Promise<Props>;
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

// TODO Fix this so that window isn't accessible for scoped prop access:
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

class AsyncPropsContainer extends SafeChannel {
  private readonly promise: Promise<Props>;
  private resolve?: (value: Props) => void;
  private reject?: (reason: unknown) => void;

  constructor() {
    super();

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  getProps(): Promise<Props> {
    return this.promise;
  }

  handleEvent(value: unknown): void {
    const abstractValue: Abstract.RawValue = {
      kind: "rawValue",
      value,
    };
    const rawValue = new RawValue(abstractValue, new StoredProps({}));
    const props = rawValue.getProps();
    this.resolve?.(props);
  }

  handleError(error: unknown): void {
    this.reject?.(error);
  }
}
