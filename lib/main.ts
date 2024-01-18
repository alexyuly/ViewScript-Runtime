import { Abstract } from "./abstract";
import { Subscriber, Publisher, Channel } from "./pubsub";

/**
 * Foundation:
 */

export class App {
  readonly source: Abstract.App;
  readonly props = new StaticProps({}, new RawObjectProps(window));
  readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.App) {
    this.source = source;

    Object.entries(source.innerProps).forEach(([key, value]) => {
      switch (value.kind) {
        case "view":
        case "model":
        case "method":
          this.props.addMember(key, value);
          break;
        case "field":
          this.props.addMember(key, new Field(value, this.props, { isTransient: false }));
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
          const atom = new Atom(component, this.props, { isTransient: false });
          atom.connect((htmlElement) => {
            document.body.append(htmlElement);
          });
          return atom;
        }
        case "viewInstance": {
          const viewInstance = new ViewInstance(component, this.props, { isTransient: false });
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
  readonly source: Abstract.Field;
  readonly closure: Props;

  readonly content:
    | Atom
    | ViewInstance
    | ModelInstance
    | RawValue
    | Reference
    | Implication
    | Expression
    | Expectation
    | Producer;

  readonly isVoid = () => this.getValue() === undefined;

  constructor(source: Abstract.Field, closure: Props, context: Context) {
    super();

    this.source = source;
    this.closure = closure;

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

    if (context.listener) {
      this.connect(context.listener);
    }
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
    if (this.source.fallback) {
      const fallback = this.source.fallback && new Action(this.source.fallback, this.closure);
      const errorArg = new Field(
        {
          kind: "field",
          content: {
            kind: "rawValue",
            value: error,
          },
        },
        new StaticProps({}),
        { isTransient: true },
      );

      fallback.handleEvent([errorArg]);
    } else {
      super.handleException(error);
    }
  }
}

class Atom extends Publisher<HTMLElement> implements Owner {
  readonly source: Abstract.Atom;
  readonly props = new StaticProps({});

  constructor(source: Abstract.Atom, closure: Props, context: Context) {
    super();

    this.source = source;

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
              { isTransient: true },
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
  readonly source: Abstract.ViewInstance;
  readonly props: StaticProps;
  readonly stage: Array<Atom | ViewInstance> = [];

  constructor(source: Abstract.ViewInstance, closure: Props, context: Context) {
    super();

    this.source = source;

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
  readonly source: Abstract.ModelInstance;
  readonly props: Promise<StaticProps>;
  readonly serialization: Record<string, unknown> = {};

  constructor(source: Abstract.ModelInstance, closure: Props, context: Context) {
    super();

    this.source = source;

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

class RawValue extends Channel implements Owner {
  readonly source: Abstract.RawValue;
  readonly closure: Props;
  readonly context: Context;

  private props?: StaticProps;

  constructor(source: Abstract.RawValue, closure: Props, context: Context) {
    super();

    this.source = source;
    this.closure = closure;
    this.context = context;

    this.handleEvent(this.source.value);
  }

  getProps(): Props {
    return this.props ?? new StaticProps({});
  }

  handleEvent(nextValue: unknown): void {
    const set = (arg: Field) => {
      const nextValue = arg?.getValue();
      this.handleEvent(nextValue);
    };

    if (nextValue instanceof Array) {
      this.props = new StaticProps({
        map: (arg) => {
          const argValue = arg.getValue();
          if (!(Abstract.isComponent(argValue) && argValue.kind === "method")) {
            throw new Error("Cannot map an array with an arg which is not a method.");
          }

          const method = argValue as Abstract.Method;
          const currentValue = this.getValue();

          const result: Array<Field> = (currentValue instanceof Array ? currentValue : [currentValue]).map(
            (innerArg) => {
              const closureWithParams = new StaticProps(
                {
                  [method.params[0]]: innerArg,
                },
                this.closure,
              );

              const innerField = new Field(method.result, closureWithParams, this.context);
              return innerField;
            },
          );

          return result;
        },
        push: (arg) => {
          const currentValue = this.getValue();
          const nextValue = [...(currentValue instanceof Array ? currentValue : [currentValue]), arg];
          this.handleEvent(nextValue);
        },
        set,
      });

      const hydratedArray: Array<Field> = nextValue.map((arrayElement) => {
        let field: Field;

        if (Abstract.isComponent(arrayElement) && arrayElement.kind === "field") {
          field = new Field(arrayElement as Abstract.Field, this.closure, this.context);
        } else {
          field = new Field(
            {
              kind: "field",
              content: {
                kind: "rawValue",
                value: arrayElement,
              },
            },
            new StaticProps({}),
            this.context,
          );
        }

        return field;
      });

      this.publish(hydratedArray);
    } else {
      if (Abstract.isRawObject(nextValue)) {
        this.props = new StaticProps({ set }, new RawObjectProps(nextValue));
      } else {
        this.props = new StaticProps({ set }, this.closure);

        if (typeof nextValue === "boolean") {
          this.props.addMember("not", () => {
            const result = !this.getValue();
            return result;
          });
          this.props.addMember("toggle", () => {
            const nextValue = !this.getValue();
            this.handleEvent(nextValue);
          });
        } else if (typeof nextValue === "string") {
          this.props.addMember("plus", (field) => {
            const result = `${this.getValue()}${field.getValue()}`;
            return result;
          });
        }
      }

      this.publish(nextValue);
    }
  }
}

class Reference extends Channel implements Owner {
  readonly source: Abstract.Reference;

  private field?: Field | Promise<Field>;

  constructor(source: Abstract.Reference, closure: Props, context: Context) {
    super();

    this.source = source;

    const getField = (scope: Props) => {
      const field = scope.getMember(source.fieldName);

      if (!(field instanceof Field)) {
        throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
      }

      field.connect(this);
      return field;
    };

    if (source.scope) {
      const owner = new Field(source.scope, closure, context);

      owner.connect(() => {
        // TODO
        // this.field.disconnect(this);

        const scope = owner.getProps();

        if (scope instanceof Promise) {
          this.field = scope.then(getField);
        } else {
          this.field = getField(scope);
        }
      });
    } else {
      this.field = getField(closure);
    }
  }

  getProps() {
    if (this.field instanceof Promise) {
      return this.field.then((fieldResult) => {
        return fieldResult.getProps();
      });
    }

    if (this.field instanceof Field) {
      return this.field.getProps();
    }

    return new StaticProps({});
  }
}

class Implication extends Channel implements Owner {
  readonly source: Abstract.Implication;
  readonly condition: Field;
  readonly consequence: Field;
  readonly alternative?: Field;

  constructor(source: Abstract.Implication, closure: Props, context: Context) {
    super();

    this.source = source;

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
  readonly source: Abstract.Expression;
  readonly proxy: Promise<Field>;
  readonly scope?: Field;
  readonly args: Array<Field>;

  constructor(source: Abstract.Expression, closure: Props, context: Context) {
    super();

    this.source = source;

    this.scope = source.scope && new Field(source.scope, closure, context);

    this.args = source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, closure, context);
      return arg;
    });

    const getResult = (method?: Property): Field => {
      let result: Field;

      if (Abstract.isComponent(method) && method.kind === "method") {
        const closureWithParams = new StaticProps(
          method.params.reduce<Record<string, Field>>((acc, param, index) => {
            acc[param] = this.args[index];
            return acc;
          }, {}),
          closure,
        );

        result = new Field(method.result, closureWithParams, { isTransient: true });
      } else if (typeof method === "function" || method === undefined) {
        console.log(`Expression: calling JavaScript function \`${source.methodName}\` with args:`, this.args);
        const value = method?.(...this.args);
        console.log(`...returned:`, value);
        result = new Field(
          {
            kind: "field",
            content: {
              kind: "rawValue",
              value,
            },
          },
          new StaticProps({}),
          { isTransient: true },
        );

        if (!context.isTransient) {
          const updateResult = () => {
            console.log(`Expression: recalling JavaScript function \`${source.methodName}\` with args...`, this.args);
            const nextValue = method?.(...this.args);
            console.log(`...returned:`, nextValue);
            result.handleEvent(nextValue);
          };

          this.scope?.connectPassively(updateResult);

          this.args.forEach((arg) => {
            arg.connectPassively(updateResult);
          });
        }
      } else {
        console.error(method);
        console.log(source);
        throw new Error("Cannot express something which is not an abstract method, a function, or undefined.");
      }

      result.connect(this);
      return result;
    };

    this.proxy = Promise.all(this.args.map((arg) => arg.getProps())).then(() => {
      if (this.scope && source.methodName === "isVoid") {
        return getResult(this.scope.isVoid);
      }

      const scopeProps = Promise.resolve(this.scope ? this.scope.getProps() : closure);
      const proxy = scopeProps.then((props) => getResult(props.getMember(source.methodName)));

      return proxy;
    });
  }

  async getProps() {
    return this.proxy.then((field) => {
      return field.getProps();
    });
  }
}

class Expectation extends Channel implements Owner {
  readonly source: Abstract.Expectation;
  readonly proxy: Promise<Field>;
  readonly queue: Array<Promise<unknown>> = [];
  readonly means: Expression;

  constructor(source: Abstract.Expectation, closure: Props, context: Context) {
    super();

    this.source = source;

    let proxy: Field | undefined;
    let resolveProxy: (value: Field | Promise<Field>) => void;

    this.proxy = new Promise((resolve) => {
      resolveProxy = resolve;
    });

    this.means = new Expression(source.means, closure, context);
    this.means.connect((meansValue) => {
      const attendant = Promise.resolve(meansValue)
        .then((value) => {
          const index = this.queue.indexOf(attendant);

          if (index !== -1) {
            this.queue.splice(0, index + 1);

            if (proxy) {
              proxy.handleEvent(value);
            } else {
              proxy = new Field(
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

              proxy.connect(this);
              resolveProxy(proxy);
            }
          }
        })
        .catch((error) => {
          const index = this.queue.indexOf(attendant);

          if (index !== -1) {
            this.queue.splice(index, 1);
            this.handleException(error);
          }
        });

      this.queue.push(attendant);
    });
  }

  async getProps(): Promise<Props> {
    return this.proxy.then((field) => {
      return field.getProps();
    });
  }
}

class Producer extends Channel implements Owner, Subscriber<void> {
  readonly source: Abstract.Producer;
  readonly closure: Props;
  readonly proxy: Field;

  constructor(source: Abstract.Producer, closure: Props) {
    super();

    this.source = source;
    this.closure = closure;

    this.proxy = new Field(
      {
        kind: "field",
        content: {
          kind: "rawValue",
          value: undefined,
        },
      },
      this.closure,
      { isTransient: true, listener: this },
    );
    this.proxy.connect(this);
  }

  getProps() {
    return this.proxy.getProps();
  }

  // TODO If called while already running, then don't run again until the first run finishes.
  async handleEvent() {
    const steps = [...this.source.steps];

    // TODO Abort the remaining steps if one throws an error.
    const run = async (step?: (typeof steps)[number]) => {
      if (step?.kind === "field") {
        const output = new Field(step, this.closure, { isTransient: true, listener: this });
        await output.getProps();

        const nextValue = output.getValue();
        this.proxy.handleEvent(nextValue);
      } else if (step) {
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
            throw new Error(`Cannot run producer step of invalid kind: ${(step as Abstract.Component).kind}`);
        }

        await executor.handleEvent();
        run(steps.shift());
      }
    };

    run(steps.shift());
  }
}

/**
 * Actions:
 */

class Action implements Subscriber<Array<Field>> {
  readonly source: Abstract.Action;
  readonly closure: Props;

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
  readonly source: Abstract.Procedure;
  readonly closure: Props;

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
            throw new Error(`Cannot run procedure step of invalid kind: ${(step as Abstract.Component).kind}`);
        }

        await executor.handleEvent();
        run(steps.shift());
      }
    };

    run(steps.shift());
  }
}

class Call implements Subscriber<void> {
  readonly source: Abstract.Call;
  readonly closure: Props;

  constructor(source: Abstract.Call, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const owner = this.source.scope && new Field(this.source.scope, this.closure, { isTransient: true });
    const scope = await Promise.resolve(owner ? owner.getProps() : this.closure);
    const action = scope.getMember(this.source.actionName);

    let callTarget: Subscriber<Array<Field>>;

    if (action instanceof Action) {
      callTarget = action;
    } else if (typeof action === "function") {
      callTarget = {
        handleEvent: (calledArgs: Array<Field>) => {
          console.log(`Calling JavaScript function \`${this.source.actionName}\` with args:`, calledArgs);
          const returnValue = action(...calledArgs);
          console.log(`...returned (ignored value):`, returnValue);
        },
      };
    } else {
      throw new Error(`Cannot call something which is not an action or function: ${this.source.actionName}`);
    }

    const callArgs = this.source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, this.closure, { isTransient: true });
      return arg;
    });

    await Promise.all(callArgs.map((arg) => arg.getProps()));

    callTarget.handleEvent(callArgs);
  }
}

class Decision implements Subscriber<void> {
  readonly source: Abstract.Decision;
  readonly closure: Props;

  constructor(source: Abstract.Decision, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const condition = new Field(this.source.condition, this.closure, { isTransient: true });
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
  readonly source: Abstract.Invocation;
  readonly closure: Props;

  constructor(source: Abstract.Invocation, closure: Props) {
    this.source = source;
    this.closure = closure;
  }

  async handleEvent() {
    const invocationArgs = this.source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, this.closure, { isTransient: true });
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
  getMember(key: string): Property | undefined;
}

type Property =
  | Abstract.View
  | Abstract.Model
  | Abstract.Method
  | Field
  | Action
  | ((...args: Array<Field>) => unknown); // TODO Allow any type of args here, to integrate JS functions with ModelInstances?

class RawObjectProps implements Props {
  readonly value: any;

  constructor(value: object) {
    this.value = value;
  }

  getMember(key: string): Property | undefined {
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
      { isTransient: true },
    );

    return memberField;
  }
}

class StaticProps implements Props {
  readonly properties: Record<string, Property>;
  readonly closure?: Props;

  constructor(properties: StaticProps | Record<string, Property>, closure?: Props) {
    this.properties = properties instanceof StaticProps ? properties.properties : properties;
    this.closure = closure;
  }

  addMember(key: string, value: Property) {
    this.properties[key] = value;
  }

  getMember(key: string): Property | undefined {
    if (key in this.properties) {
      return this.properties[key];
    }

    return this.closure?.getMember(key);
  }

  getOwnProperties(): Array<[string, Property]> {
    return Object.entries(this.properties);
  }
}

type Context = {
  isTransient: boolean;
  listener?: Producer;
};
