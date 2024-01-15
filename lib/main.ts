import { Abstract } from "./abstract";
import { Subscriber, Publisher, Channel } from "./pubsub";

/**
 * Foundation:
 */

export class App {
  private readonly props = new StaticProps({}, new RawObjectProps(window));
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
          this.props.addMember(key, new Field(value, this.props, { isStatic: false }));
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
          const atom = new Atom(component, this.props, { isStatic: false });
          atom.connect((htmlElement) => {
            document.body.append(htmlElement);
          });
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props, { isStatic: false });
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

class Field extends Channel implements Owner {
  private readonly content:
    | Atom
    | ViewInstance
    | ModelInstance
    | RawValue
    | Reference
    | Implication
    | Expression
    | Expectation
    | Producer;

  private fallback?: Action;

  readonly isVoid = () => this.getValue() === undefined;

  constructor(source: Abstract.Field, closure: Props, context: Context) {
    super();

    switch (source.content.kind) {
      case "atom": {
        this.content = new Atom(source.content, closure, context);
        break;
      }
      case "viewInstance": {
        this.content = new ViewInstance(source.content, closure, context);
        break;
      }
      case "modelInstance": {
        this.content = new ModelInstance(source.content, closure, context);
        break;
      }
      case "rawValue": {
        this.content = new RawValue(source.content, closure, context);
        break;
      }
      case "reference": {
        this.content = new Reference(source.content, closure, context);
        break;
      }
      case "implication": {
        this.content = new Implication(source.content, closure, context);
        break;
      }
      case "expression": {
        this.content = new Expression(source.content, closure, context);
        break;
      }
      case "expectation": {
        this.content = new Expectation(source.content, closure, context);
        break;
      }
      case "producer": {
        this.content = new Producer(source.content, closure);
        break;
      }
      default:
        throw new Error(`Cannot field some content of invalid kind: ${(source.content as Abstract.Component).kind}`);
    }

    this.content.connect(this);

    this.fallback = source.fallback && new Action(source.fallback, closure);
  }

  getContent() {
    return this.content;
  }

  getProps(): Props | Promise<Props> {
    if (this.content instanceof Atom || this.content instanceof ViewInstance) {
      return new StaticProps({});
    }

    return this.content.getProps();
  }

  handleException(error: unknown): void {
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
        { isStatic: true },
      );

      this.fallback.handleEvent([errorArg]);
    } else {
      super.handleException(error);
    }
  }
}

class Atom extends Publisher<HTMLElement> implements Owner {
  private readonly props = new StaticProps({});

  constructor(source: Abstract.Atom, closure: Props, context: Context) {
    super();

    const element = document.createElement(source.tagName);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field": {
          const field = new Field(value, closure, context);
          field.connect((fieldValue) => {
            if (key === "content") {
              const content: Array<Node | string> = [];
              const handleContentValue = (contentValue: unknown) => {
                if (contentValue instanceof Array) {
                  contentValue.forEach((field: Field) => {
                    field.connect(handleContentValue);
                  });
                } else if (contentValue instanceof Field) {
                  contentValue.connect(handleContentValue);
                } else if (!(fieldValue === false || fieldValue === null || fieldValue === undefined)) {
                  // TODO Don't push -- assign to a specific index instead (to allow for async fields)?
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
              { isStatic: true },
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

  getProps() {
    return this.props;
  }
}

class ViewInstance extends Channel<HTMLElement> implements Owner {
  private readonly props: StaticProps;
  private readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.ViewInstance, closure: Props, context: Context) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : closure.getMember(source.view);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error("Cannot construct invalid view.");
    }

    this.props = new StaticProps({}, closure);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "field":
          this.props.addMember(key, new Field(value, closure, context));
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
      if (key in this.props) {
        return;
      }

      switch (value.kind) {
        case "method":
          this.props.addMember(key, value);
          break;
        case "field":
          this.props.addMember(key, new Field(value, this.props, context));
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
          const atom = new Atom(component, this.props, context);
          atom.connect(this);
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props, context);
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

  getProps() {
    return this.props;
  }
}

class ModelInstance extends Channel implements Owner {
  private readonly props: Promise<StaticProps>;
  private readonly serialization: Record<string, unknown> = {};

  constructor(source: Abstract.ModelInstance, closure: Props, context: Context) {
    super();

    const props = new StaticProps({}, closure);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        // TODO Allow methods to be passed in as outer props, here
        case "field":
          props.addMember(key, new Field(value, closure, context));
          break;
        case "action":
          props.addMember(key, new Action(value, closure));
          break;
        // TODO Allow functions to be passed in as outer props, here
        default:
          throw new Error(
            `ModelInstance cannot construct outer prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
          );
      }
    });

    const model = Abstract.isComponent(source.model) ? source.model : closure.getMember(source.model);

    if (Abstract.isComponent(model) && model.kind === "model") {
      Object.entries(model.innerProps).forEach(([key, value]) => {
        if (key in props) {
          return;
        }

        switch (value.kind) {
          case "method":
            // TODO Provide proper closure scoping for ModelInstance methods:
            props.addMember(key, value);
            break;
          case "field":
            props.addMember(key, new Field(value, props, context));
            break;
          case "action":
            props.addMember(key, new Action(value, props));
            break;
          default:
            throw new Error(
              `ModelInstance cannot construct inner prop ${key} of invalid kind: ${(value as Abstract.Component).kind}`,
            );
        }
      });
    }

    this.props = Promise.all(
      props
        .getOwnProperties()
        .map(([_, ownProp]) => (ownProp instanceof Field ? ownProp.getProps() : Promise.resolve())),
    ).then(() => {
      props.getOwnProperties().forEach(([key, ownProp]) => {
        if (Abstract.isComponent(ownProp) && ownProp.kind === "method") {
          // TODO Serialize abstract methods
        } else if (ownProp instanceof Field) {
          this.serialization[key] = ownProp.getValue();
          ownProp.connectPassively((ownPropValue) => {
            this.serialization[key] = ownPropValue;
            this.publish({ ...this.serialization });
          });
        } else if (ownProp instanceof Action) {
          // TODO Serialize actions
        } else if (typeof ownProp === "function") {
          this.serialization[key] = ownProp;
        } else {
          // TODO Throw?
        }
      });

      this.publish({ ...this.serialization });

      return props;
    });
  }

  getProps(): Promise<StaticProps> {
    return this.props;
  }
}

// TODO Update props if value changes: for example, if an Expectation rejects but then resolves with updated args.
class RawValue extends Publisher implements Owner {
  private readonly props: StaticProps;

  constructor(source: Abstract.RawValue, closure: Props, context: Context) {
    super();

    const set = (arg: Field) => {
      const nextValue = arg?.getValue();
      this.publish(nextValue);
    };

    if (source.value instanceof Array) {
      this.props = new StaticProps({
        map: (arg) => {
          const argValue = arg.getValue();
          if (!(Abstract.isComponent(argValue) && argValue.kind === "method")) {
            throw new Error("Cannot map an array with an arg which is not a method.");
          }

          const method = argValue as Abstract.Method;
          const value = this.getValue();

          const result: Array<Field> = (value instanceof Array ? value : [value]).map((innerArg) => {
            const closureWithParams = new StaticProps(
              {
                [method.params[0]]: innerArg,
              },
              closure,
            );

            const innerField = new Field(method.result, closureWithParams, context);
            return innerField;
          });

          return result;
        },
        push: (arg) => {
          const currentValue = this.getValue();
          const nextValue = [...(currentValue instanceof Array ? currentValue : [currentValue]), arg];
          this.publish(nextValue);
        },
        set,
      });

      const hydratedArray: Array<Field> = source.value.map((value) => {
        let field: Field;

        if (Abstract.isComponent(value) && value.kind === "field") {
          field = new Field(value as Abstract.Field, closure, context);
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
            context,
          );
        }

        return field;
      });

      this.publish(hydratedArray);
    } else {
      if (Abstract.isRawObject(source.value)) {
        this.props = new StaticProps({ set }, new RawObjectProps(source.value));
      } else {
        this.props = new StaticProps({ set }, closure);

        if (typeof source.value === "boolean") {
          this.props.addMember("not", () => {
            const result = !this.getValue();
            return result;
          });
          this.props.addMember("toggle", () => {
            const nextValue = !this.getValue();
            this.publish(nextValue);
          });
        } else if (typeof source.value === "string") {
          this.props.addMember("plus", (field) => {
            const result = `${this.getValue()}${field.getValue()}`;
            return result;
          });
        }
      }

      this.publish(source.value);
    }
  }

  getProps(): Props {
    return this.props;
  }
}

class Reference extends Channel implements Owner {
  private readonly field: Field | Promise<Field>;

  constructor(source: Abstract.Reference, closure: Props, context: Context) {
    super();

    const getField = (scope: Props) => {
      const field = scope.getMember(source.fieldName);

      if (!(field instanceof Field)) {
        throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
      }

      field.connect(this);
      return field;
    };

    const scope = source.scope ? new Field(source.scope, closure, context).getProps() : closure;

    if (scope instanceof Promise) {
      this.field = scope.then(getField);
    } else {
      this.field = getField(scope);
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

class Implication extends Channel implements Owner {
  private readonly condition: Field;
  private readonly consequence: Field;
  private readonly alternative?: Field;

  constructor(source: Abstract.Implication, closure: Props, context: Context) {
    super();

    this.condition = new Field(source.condition, closure, context);
    this.condition.connectPassively(this);

    this.consequence = new Field(source.consequence, closure, context);
    this.consequence.connectPassively(this);

    if (source.alternative) {
      this.alternative = new Field(source.alternative, closure, context);
      this.alternative.connectPassively(this);
    }

    this.handleEvent();
  }

  getProps() {
    const conditionalValue = this.condition.getValue();
    const impliedField = conditionalValue ? this.consequence : this.alternative ?? undefined;
    const impliedProps = impliedField?.getProps() ?? new StaticProps({});

    return impliedProps;
  }

  handleEvent() {
    const conditionalValue = this.condition.getValue();
    const impliedField = conditionalValue ? this.consequence : this.alternative ?? undefined;
    const impliedValue = impliedField?.getValue();

    super.handleEvent(impliedValue);
  }
}

class Expression extends Channel implements Owner {
  private readonly proxy: Field | Promise<Field>;
  private readonly args: Array<Field>;

  constructor(source: Abstract.Expression, closure: Props, context: Context) {
    super();

    const owner = source.scope && new Field(source.scope, closure, context);
    const scope = owner ? owner.getProps() : closure;

    this.args = source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, closure, context);
      return arg;
    });

    const getResult = (method: Property): Field => {
      let result: Field;

      if (Abstract.isComponent(method) && method.kind === "method") {
        const closureWithParams = new StaticProps(
          method.params.reduce<Record<string, Field>>((acc, param, index) => {
            acc[param] = this.args[index];
            return acc;
          }, {}),
          closure,
        );

        result = new Field(method.result, closureWithParams, { isStatic: true });
      } else if (typeof method === "function") {
        console.log(`initializing expression of native function ${source.methodName} with args...`, this.args);
        result = new Field(
          {
            kind: "field",
            content: {
              kind: "rawValue",
              value: method(...this.args),
            },
          },
          new StaticProps({}),
          { isStatic: true },
        );

        if (!context.isStatic) {
          const updateProducer = () => {
            console.log(`updating expression of native function ${source.methodName} with args...`, this.args);
            const nextValue = method(...this.args);
            result.handleEvent(nextValue);
          };

          owner?.connectPassively(updateProducer);

          this.args.forEach((arg) => {
            arg.connectPassively(updateProducer);
          });
        }
      } else {
        throw new Error("Cannot express something which is not an abstract method or a function.");
      }

      result.connect(this);
      return result;
    };

    this.proxy = Promise.all(this.args.map((arg) => arg.getProps())).then(() => {
      let proxy: Field | Promise<Field>;

      if (owner && source.methodName === "isVoid") {
        proxy = getResult(owner.isVoid);
      } else if (scope instanceof Promise) {
        proxy = scope.then((x) => getResult(x.getMember(source.methodName)));
      } else {
        proxy = getResult(scope.getMember(source.methodName));
      }

      return proxy;
    });
  }

  getProps() {
    if (this.proxy instanceof Promise) {
      return this.proxy.then((field) => {
        return field.getProps();
      });
    }

    return this.proxy.getProps();
  }
}

class Expectation extends Channel implements Owner {
  private proxy?: Field;
  private readonly props: Promise<Props>;
  private readonly queue: Array<{ id: string; promise: Promise<unknown> }> = [];

  constructor(source: Abstract.Expectation, closure: Props, context: Context) {
    super();

    this.props = new Promise<Props>((resolve, reject) => {
      const means = new Expression(source.means, closure, context);

      Promise.resolve(means.getProps()).then(() => {
        const attendant = {
          id: crypto.randomUUID(),
          promise: Promise.resolve(means.getValue()),
        };

        this.queue.push(attendant);

        attendant.promise
          .then((value) => {
            const index = this.queue.indexOf(attendant);

            if (index !== -1) {
              this.queue.splice(0, index + 1);

              if (this.proxy) {
                this.proxy.handleEvent(value);
              } else {
                this.proxy = new Field(
                  {
                    kind: "field",
                    content: {
                      kind: "rawValue",
                      value,
                    },
                  },
                  closure,
                  context,
                );

                this.proxy.connect(this);
                resolve(this.proxy.getProps());
              }
            }
          })
          .catch((error) => {
            const index = this.queue.indexOf(attendant);

            if (index !== -1) {
              this.queue.splice(index, 1);

              if (this.proxy) {
                this.proxy.handleException(error);
              } else {
                this.proxy = new Field(
                  {
                    kind: "field",
                    content: {
                      kind: "rawValue",
                      value: undefined,
                    },
                  },
                  closure,
                  context,
                );

                this.proxy.connect(this);
                this.proxy.handleException(error);
                reject(error);
              }
            }
          });
      });
    });
  }

  getProps(): Promise<Props> {
    return this.props;
  }
}

// TODO Each time any field within the stream changes, run it now or as soon as the current run completes.
class Producer extends Channel implements Owner {
  constructor(source: Abstract.Producer, closure: Props) {
    super();

    // TODO
    throw new Error("Not yet implemented");
  }

  getProps(): Promise<Props> {
    // TODO
    throw new Error("Not yet implemented");
  }
}

/**
 * Actions:
 */

class Action implements Subscriber<Array<Field>> {
  private readonly source: Abstract.Action;
  private readonly closure: Props;

  constructor(source: Abstract.Action, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent(args: Array<Field>): Promise<void> {
    const closureWithParams = new StaticProps(
      this.source.params.reduce<Record<string, Field>>((acc, param, index) => {
        acc[param] = args[index];
        return acc;
      }, {}),
      this.closure,
    );

    const handler = new Procedure(this.source.handler, closureWithParams);
    handler.handleEvent();
  }
}

class Procedure implements Subscriber<void> {
  private readonly source: Abstract.Procedure;
  private readonly closure: Props;

  constructor(source: Abstract.Procedure, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const steps = [...this.source.steps];

    // TODO Abort the remaining steps if one throws an error.
    const run = async (step?: (typeof steps)[number]) => {
      if (step) {
        let executor: Subscriber<void>;

        switch (step.kind) {
          case "procedure":
            executor = new Procedure(step, this.closure);
            break;
          case "call":
            executor = new Call(step, this.closure);
            break;
          case "decision":
            executor = new Decision(step, this.closure);
            break;
          case "invocation":
            executor = new Invocation(step, this.closure);
            break;
          default:
            throw new Error(`Cannot run procedural step of invalid kind: ${(step as Abstract.Component).kind}`);
        }

        await executor.handleEvent();
        run(steps.shift());
      }
    };

    run(steps.shift());
  }
}

class Call implements Subscriber<void> {
  private readonly source: Abstract.Call;
  private readonly closure: Props;

  constructor(source: Abstract.Call, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const owner = this.source.scope && new Field(this.source.scope, this.closure, { isStatic: true });
    const scope = await Promise.resolve(owner ? owner.getProps() : this.closure);
    const action = scope.getMember(this.source.actionName);

    let callTarget: Subscriber<Array<Field>>;

    if (action instanceof Action) {
      callTarget = action;
    } else if (typeof action === "function") {
      let source = this.source;
      callTarget = {
        handleEvent(calledArgs: Array<Field>) {
          console.log(`calling native function ${source.actionName} with args...`, calledArgs);
          action(...calledArgs);
        },
      };
    } else {
      throw new Error(`Cannot call something which is not an action or function: ${this.source.actionName}`);
    }

    const callArgs = this.source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, this.closure, { isStatic: true });
      return arg;
    });

    await Promise.all(callArgs.map((arg) => arg.getProps()));

    callTarget.handleEvent(callArgs);
  }
}

class Decision implements Subscriber<void> {
  private readonly source: Abstract.Decision;
  private readonly closure: Props;

  constructor(source: Abstract.Decision, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const condition = new Field(this.source.condition, this.closure, { isStatic: true });
    await Promise.resolve(condition.getProps());

    const conditionalValue = condition.getValue();

    if (conditionalValue) {
      const consequence = new Procedure(this.source.consequence, this.closure);
      consequence.handleEvent();
    } else if (this.source.alternative) {
      const alternative = new Procedure(this.source.alternative, this.closure);
      alternative.handleEvent();
    }
  }
}

class Invocation implements Subscriber<void> {
  private readonly source: Abstract.Invocation;
  private readonly closure: Props;

  constructor(source: Abstract.Invocation, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const invocationArgs = this.source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, this.closure, { isStatic: true });
      return arg;
    });

    await Promise.all(invocationArgs.map((arg) => arg.getProps()));

    if (this.source.target) {
      const target = new Action(this.source.target, this.closure);
      target.handleEvent(invocationArgs);
    }
  }
}

/**
 * Utilities:
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
  | ((...args: Array<Field>) => unknown); // TODO Allow any type of args here, to integrate JS functions with ModelInstances?

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
        // TODO For arg values which are abstract methods or actions, we need to pass in a JavaScript function instead:
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
      { isStatic: true },
    );

    return memberField;
  }
}

class StaticProps implements Props {
  private readonly properties: Record<string, Property>;
  private readonly closure?: Props;

  constructor(properties: StaticProps | Record<string, Property>, closure?: Props) {
    this.properties = properties instanceof StaticProps ? properties.properties : properties;
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

  getOwnProperties(): Array<[string, Property]> {
    return Object.entries(this.properties);
  }
}

type Context = {
  isStatic: boolean;
};
