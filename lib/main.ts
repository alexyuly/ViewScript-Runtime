import { Abstract } from "./abstract";
import { Subscriber, Publisher, SafePublisher, Channel, SafeChannel } from "./pubsub";

/**
 * Foundation:
 */

export class App {
  private readonly props = new StaticProps({}, new RawObjectProps(window)); // TODO fix this -- window is not available in some scopes where it should be
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

class Field extends SafeChannel implements Owner {
  private readonly fallback?: Action;

  private readonly content:
    | Expectation
    | Atom
    | ViewInstance
    | ModelInstance
    | RawValue
    | Reference
    | Expression
    | ConditionalField;

  constructor(source: Abstract.Field, closure: Props) {
    super();

    this.fallback = source.fallback && new Action(source.fallback, closure);

    switch (source.content.kind) {
      case "expectation": {
        const expectation = new Expectation(source.content, closure);
        expectation.connect(this);
        this.content = expectation;
        break;
      }
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
      case "conditionalField": {
        const implication = new ConditionalField(source.content, closure);
        implication.connect(this);
        this.content = implication;
        break;
      }
      default:
        throw new Error(`Cannot field some content of invalid kind: ${(source.content as Abstract.Component).kind}`);
    }
  }

  getProps(): Props | Promise<Props> {
    if (this.content instanceof Atom || this.content instanceof ViewInstance) {
      return new StaticProps({});
    }

    return this.content.getProps();
  }

  handleError(error: unknown): void {
    if (this.fallback) {
      const errorArg = new Field(
        {
          kind: "field",
          content: {
            kind: "rawValue",
            value: error,
          },
        },
        new StaticProps({}),
      );

      this.fallback.handleEvent([errorArg]);
    } else {
      super.handleError(error);
    }
  }
}

class Expectation extends SafeChannel implements Owner {
  private readonly props: Promise<Props>;
  private readonly path: Expression;
  private readonly queue: Array<{ id: string; promise: Promise<unknown> }> = [];
  private supplier?: Field;

  constructor(source: Abstract.Expectation, closure: Props) {
    super();

    let resolveProps: (props: Props) => void;
    let rejectProps: (error: unknown) => void;

    this.props = new Promise<Props>((resolve, reject) => {
      resolveProps = resolve;
      rejectProps = reject;
    });

    this.path = new Expression(source.path, closure);
    this.path.connect((resultingValue) => {
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

            if (!this.supplier) {
              this.supplier = new Field(
                {
                  kind: "field",
                  content: {
                    kind: "rawValue",
                    value,
                  },
                },
                closure,
              );

              this.supplier.connect(this);
              resolveProps(this.supplier.getProps() as Props);
            }
          }
        })
        .catch((error) => {
          const index = this.queue.indexOf(attendant);
          if (index !== -1) {
            this.queue.splice(index, 1);
            // TODO fix
            // this.supplier.handleError(error);
            rejectProps(error);
          }
        });
    });
  }

  getProps(): Promise<Props> {
    return this.props;
  }
}

class Atom extends Publisher<HTMLElement> {
  private readonly props = new StaticProps({});

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
            const eventArg = new Field(
              {
                kind: "field",
                content: {
                  kind: "rawValue",
                  value: event,
                },
              },
              new StaticProps({}),
            );

            action.handleEvent([eventArg]);
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
  private readonly props;
  private readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.ViewInstance, closure: Props) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : closure.getMember(source.view);

    this.props = new StaticProps({}, closure);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error("Cannot construct invalid view.");
    }

    // TODO Make sure outer props can override the default inner props (need to switch the order here)
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

class ModelInstance extends SafeChannel implements Owner {
  private readonly props;

  constructor(source: Abstract.ModelInstance, closure: Props) {
    super();

    const model = Abstract.isComponent(source.model) ? source.model : closure.getMember(source.model);

    this.props = new StaticProps({}, closure);

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

class RawValue extends Publisher implements Owner {
  private readonly props: Props;

  constructor(source: Abstract.RawValue, closure: Props) {
    super();

    if (source.value instanceof Array) {
      this.props = new StaticProps({
        map: (arg) => {
          const method = arg.getValue();
          if (!(Abstract.isComponent(method) && method.kind === "method")) {
            throw new Error("Cannot map an array with an arg which is not a method.");
          }

          const typeSafeMethod = method as Abstract.Method;
          const currentValue = this.getValue();

          const nextValue: Array<Field> = (currentValue instanceof Array ? currentValue : [currentValue]).map(
            (innerArg) => {
              const parameterizedClosure = new StaticProps(
                {
                  [typeSafeMethod.params[0]]: innerArg,
                },
                closure,
              );

              const innerField = new Field(typeSafeMethod.result, parameterizedClosure);
              return innerField;
            },
          );

          return nextValue;
        },
        push: (arg) => {
          const currentValue = this.getValue();
          const nextValue = [...(currentValue instanceof Array ? currentValue : [currentValue]), arg];
          this.publish(nextValue);
        },
        set: (arg) => {
          const nextValue = arg?.getValue();
          this.publish(nextValue);
        },
      });

      const hydratedArray: Array<Field> = source.value.map((value) => {
        let field: Field;

        if (Abstract.isComponent(value) && value.kind === "field") {
          field = new Field(value as Abstract.Field, closure);
        } else {
          field = new Field(
            {
              kind: "field",
              content: {
                kind: "rawValue",
                value,
              },
            },
            new StaticProps({}),
          );
        }

        return field;
      });

      this.publish(hydratedArray);
    } else {
      if (Abstract.isRawObject(source.value)) {
        this.props = new RawObjectProps(source.value);
      } else {
        const props = new StaticProps({
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

class Reference extends SafeChannel implements Owner {
  private readonly field: Field | Promise<Field>;

  constructor(source: Abstract.Reference, closure: Props) {
    super();

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;

    if (scope instanceof Promise) {
      this.field = scope.then((scopeResult) => {
        const field = scopeResult.getMember(source.fieldName);

        if (!(field instanceof Field)) {
          throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
        }

        field.connect(this);
        return field;
      });
    } else {
      const field = scope.getMember(source.fieldName);

      if (!(field instanceof Field)) {
        throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
      }

      field.connect(this);
      this.field = field;
    }
  }

  getProps() {
    if (this.field instanceof Promise) {
      return this.field.then((fieldResult) => {
        return fieldResult.getProps();
      });
    }

    return this.field.getProps();
  }
}

// TODO Memoize the results of functional method calls.
class Expression extends SafeChannel implements Owner {
  private supplier?: Field | Promise<Field>;

  constructor(source: Abstract.Expression, closure: Props) {
    super();

    const connectSupplier = (scopeResult: Props) => {
      const method = scopeResult.getMember(source.methodName);

      const args = source.args.map((sourceArg) => {
        const arg = new Field(sourceArg, closure);
        return arg;
      });

      if (Abstract.isComponent(method) && method.kind === "method") {
        const parameterizedClosure = new StaticProps(
          method.params.reduce<Record<string, Field>>((acc, param, index) => {
            acc[param] = args[index];
            return acc;
          }, {}),
          closure,
        );

        this.supplier = new Field(method.result, parameterizedClosure);
        this.supplier.connect(this);
      } else if (typeof method === "function") {
        // TODO Prevent duplicate calls to the method. We especially don't want this to happen for promises...
        // TODO Wait until args are ready to call function:
        const typeSafeMethod = method;
        const typeSafeValue = typeSafeMethod(...args);
        const typeSafeResult = new Field(
          {
            kind: "field",
            content: {
              kind: "rawValue",
              value: typeSafeValue,
            },
          },
          new StaticProps({}),
        );

        args.forEach((arg) => {
          arg.connect(() => {
            const resultingValue = typeSafeMethod(...args);
            typeSafeResult.handleEvent(resultingValue);
          });
        });

        this.supplier = typeSafeResult;
        this.supplier.connect(this);
      } else {
        throw new Error("Cannot express something which is not an abstract method or a function.");
      }
    };

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;

    if (scope instanceof Promise) {
      scope.then(connectSupplier);
    } else {
      connectSupplier(scope);
    }
  }

  getProps() {
    if (this.supplier instanceof Promise) {
      return this.supplier.then((supply) => {
        return supply.getProps();
      });
    }

    return this.supplier!.getProps();
  }
}

class ConditionalField extends SafeChannel implements Owner {
  private readonly condition: Field;
  private readonly consequence: Field;
  private readonly alternative?: Field | Action;

  constructor(source: Abstract.ConditionalField, closure: Props) {
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

  getProps() {
    const isConditionMet = this.condition.getValue();

    const impliedField = isConditionMet
      ? this.consequence
      : this.alternative instanceof Field
      ? this.alternative
      : undefined;

    const impliedProps = impliedField?.getProps() ?? new StaticProps({});
    return impliedProps;
  }
}

/**
 * Actions:
 */

class Action implements Subscriber<Array<Field>> {
  private readonly target: Procedure | Call | Invocation | ConditionalAction;

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
      case "conditionalAction":
        this.target = new ConditionalAction(source.target, closure);
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
  private readonly params: Array<string>;
  private readonly closure: Props;

  constructor(source: Abstract.Procedure, closure: Props) {
    this.steps = source.steps;
    this.params = source.params;
    this.closure = closure;
  }

  handleEvent(args: Array<Field>): void {
    const parameterizedClosure = new StaticProps(
      this.params.reduce<Record<string, Field>>((acc, param, index) => {
        acc[param] = args[index];
        return acc;
      }, {}),
      this.closure,
    );

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
  private readonly action: Promise<Subscriber<Array<Field>>>;
  private readonly constantArgs?: Array<Field>;
  private readonly queue: Array<{ args: Array<Field> }> = [];

  constructor(source: Abstract.Call, closure: Props) {
    const resolvableScope = Promise.resolve(source.scope ? new Field(source.scope, closure).getProps() : closure);

    this.action = resolvableScope.then((scope) => {
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
    });

    this.constantArgs = source.args?.map((sourceArg) => {
      const arg = new Field(sourceArg, closure);
      return arg;
    });
  }

  // TODO Wait until args are ready to handle event:
  handleEvent(args: Array<Field>): void {
    this.queue.push({
      args: this.constantArgs ?? args,
    });

    this.action.then((action) => {
      let next = this.queue.shift();

      while (next) {
        action.handleEvent(next.args);
        next = this.queue.shift();
      }
    });
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
        const args = [
          new Field(
            {
              kind: "field",
              content: {
                kind: "rawValue",
                value: prerequisiteValue,
              },
            },
            new StaticProps({}),
          ),
        ];

        const procedure = new Procedure(this.procedure, this.closure);
        procedure.handleEvent(args);
      }
    });
  }
}

class ConditionalAction implements Subscriber<void> {
  private readonly condition: Field;
  private readonly consequence?: Abstract.Action;
  private readonly closure: Props;

  constructor(source: Abstract.ConditionalAction, closure: Props) {
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

interface Owner {
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
          ? (...args: Array<unknown>) => new memberValue(...args)
          : memberValue.bind(this.value);

      const memberFunction = (...args: Array<Field>) => {
        const argValues = args.map((arg) => arg.getValue());
        const result = callableMemberValue(...argValues);
        return result;
      };

      return memberFunction;
    }

    const memberField = new Field(
      {
        kind: "field",
        content: {
          kind: "rawValue",
          value: memberValue,
        },
      },
      new StaticProps({}),
    );

    return memberField;
  }
}

class StaticProps implements Props {
  private readonly properties: Record<string, Property>;
  private readonly closure?: Props;

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

    throw new Error(`Prop ${key} not found`);
  }
}
