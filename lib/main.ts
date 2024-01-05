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

class Field extends Channel implements Owner {
  private readonly content:
    | Atom
    | ViewInstance
    | ModelInstance
    | RawValue
    | Reference
    | Implication
    | Expression
    | Expectation;

  readonly isVoid = () => this.getValue() === undefined;

  constructor(source: Abstract.Field, closure: Props) {
    super();

    switch (source.content.kind) {
      case "atom": {
        this.content = new Atom(source.content, closure);
        break;
      }
      case "viewInstance": {
        this.content = new ViewInstance(source.content, closure);
        break;
      }
      case "modelInstance": {
        this.content = new ModelInstance(source.content, closure);
        break;
      }
      case "rawValue": {
        this.content = new RawValue(source.content, closure);
        break;
      }
      case "reference": {
        this.content = new Reference(source.content, closure);
        break;
      }
      case "implication": {
        this.content = new Implication(source.content, closure);
        break;
      }
      case "expression": {
        this.content = new Expression(source.content, closure);
        break;
      }
      case "expectation": {
        this.content = new Expectation(source.content, closure);
        break;
      }
      default:
        throw new Error(`Cannot field some content of invalid kind: ${(source.content as Abstract.Component).kind}`);
    }

    this.content.connect(this);
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
}

class Atom extends Publisher<HTMLElement> implements Owner {
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

  constructor(source: Abstract.ViewInstance, closure: Props) {
    super();

    const view = Abstract.isComponent(source.view) ? source.view : closure.getMember(source.view);

    if (!(Abstract.isComponent(view) && view.kind === "view")) {
      throw new Error("Cannot construct invalid view.");
    }

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

  getProps() {
    return this.props;
  }
}

class ModelInstance extends Channel implements Owner {
  private readonly props: StaticProps | Promise<StaticProps>;
  private readonly serialization: Record<string, unknown> = {};

  constructor(source: Abstract.ModelInstance, closure: Props) {
    super();

    const props = new StaticProps({}, closure);

    Object.entries(source.outerProps).forEach(([key, value]) => {
      switch (value.kind) {
        // TODO Allow methods to be passed in as outer props, here
        case "field":
          props.addMember(key, new Field(value, closure));
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
            props.addMember(key, new Field(value, props));
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

    const publishInitialValue = () => {
      props.getOwnProperties().forEach(([key, ownProp]) => {
        if (Abstract.isComponent(ownProp) && ownProp.kind === "method") {
          // TODO Serialize abstract methods
        } else if (ownProp instanceof Field) {
          this.serialization[key] = ownProp.getValue();
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
    };

    const publishUpdatedValues = () => {
      props.getOwnProperties().forEach(([key, ownProp]) => {
        if (ownProp instanceof Field) {
          ownProp.connectPassively((ownPropValue) => {
            this.serialization[key] = ownPropValue;
            this.publish({ ...this.serialization });
          });
        }
      });

      return props;
    };

    const expectedProps = Object.values(props).filter(
      (prop) => prop instanceof Field && prop.getContent() instanceof Expectation,
    );

    if (expectedProps.length > 0) {
      this.props = Promise.all(expectedProps.map((prop) => prop.getProps()))
        .then(publishInitialValue)
        .then(publishUpdatedValues);
    } else {
      publishInitialValue();
      publishUpdatedValues();
      this.props = props;
    }
  }

  getProps() {
    return this.props;
  }
}

// TODO Update props if value changes: for example, if an Expectation rejects but then resolves with updated args.
class RawValue extends Publisher implements Owner {
  private readonly props: Props;

  constructor(source: Abstract.RawValue, closure: Props) {
    super();

    if (source.value instanceof Array) {
      this.props = new StaticProps({
        isVoid: () => {
          const result = this.getValue() === undefined;
          return result;
        },
        map: (arg) => {
          const method = arg.getValue();
          if (!(Abstract.isComponent(method) && method.kind === "method")) {
            throw new Error("Cannot map an array with an arg which is not a method.");
          }

          const typeSafeMethod = method as Abstract.Method;
          const value = this.getValue();

          const result: Array<Field> = (value instanceof Array ? value : [value]).map((innerArg) => {
            const parameterizedClosure = new StaticProps(
              {
                [typeSafeMethod.params[0]]: innerArg,
              },
              closure,
            );

            const innerField = new Field(typeSafeMethod.result, parameterizedClosure);
            return innerField;
          });

          return result;
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
      const props = new StaticProps({
        isVoid: () => {
          const result = this.getValue() === undefined;
          return result;
        },
        set: (field) => {
          const nextValue = field?.getValue();
          this.publish(nextValue);
        },
      });

      if (Abstract.isRawObject(source.value)) {
        this.props = new StaticProps(props, new RawObjectProps(source.value));
      } else {
        if (typeof source.value === "boolean") {
          props.addMember("toggle", () => {
            const nextValue = !this.getValue();
            this.publish(nextValue);
          });
        } else if (typeof source.value === "string") {
          props.addMember("plus", (field) => {
            const currentValue = this.getValue();
            const result = `${currentValue}${field.getValue()}`;
            return result;
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

class Reference extends Channel implements Owner {
  private readonly field: Field | Promise<Field>;

  constructor(source: Abstract.Reference, closure: Props) {
    super();

    const getField = (scope: Props) => {
      const field = scope.getMember(source.fieldName);

      if (!(field instanceof Field)) {
        throw new Error(`Cannot reference something which is not a field: ${source.fieldName}`);
      }

      field.connect(this);
      return field;
    };

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;

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

// TODO Support async behavior
class Implication extends Channel implements Owner {
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

class Expression extends Channel implements Owner {
  private readonly args: Array<Field>;
  private readonly supplier: Field | Promise<Field>;

  constructor(source: Abstract.Expression, closure: Props) {
    super();

    const owner = source.scope && new Field(source.scope, closure);
    const scope = owner ? owner.getProps() : closure;

    this.args = source.args.map((sourceArg) => {
      const arg = new Field(sourceArg, closure);
      return arg;
    });

    const getSupplier = (method: Property) => {
      if (Abstract.isComponent(method) && method.kind === "method") {
        const parameterizedClosure = new StaticProps(
          method.params.reduce<Record<string, Field>>((acc, param, index) => {
            acc[param] = this.args[index];
            return acc;
          }, {}),
          closure,
        );

        const supplier = new Field(method.result, parameterizedClosure);
        return supplier;
      }

      if (typeof method === "function") {
        const supplier = new Field(
          {
            kind: "field",
            content: {
              kind: "rawValue",
              value: method(...this.args),
            },
          },
          new StaticProps({}),
        );

        const updateSupply = () => {
          const result = method(...this.args);
          supplier.handleEvent(result);
        };

        owner?.connectPassively(updateSupply);

        this.args.forEach((arg) => {
          arg.connectPassively(updateSupply);
        });

        return supplier;
      }

      throw new Error("Cannot express something which is not an abstract method or a function.");
    };

    if (owner && source.methodName === "isVoid") {
      this.supplier = getSupplier(owner.isVoid);
    } else if (scope instanceof Promise) {
      this.supplier = scope.then((x) => x.getMember(source.methodName)).then(getSupplier);
    } else {
      const method = scope.getMember(source.methodName);
      this.supplier = getSupplier(method);
    }

    const expectedArgs = this.args.filter((arg) => arg.getContent() instanceof Expectation);

    if (expectedArgs.length > 0) {
      this.supplier = Promise.all([this.supplier, ...expectedArgs.map((arg) => arg.getProps())]).then(
        ([supplierValue]) => {
          supplierValue.connect(this);
          return supplierValue;
        },
      );
    } else if (this.supplier instanceof Promise) {
      this.supplier = this.supplier.then((supplierValue) => {
        supplierValue.connect(this);
        return supplierValue;
      });
    } else {
      this.supplier.connect(this);
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

class Expectation extends Channel implements Owner {
  private readonly props: Promise<Props>;
  private readonly queue: Array<{ id: string; promise: Promise<unknown> }> = [];

  private supplier?: Field;
  private exception?: Action;

  constructor(source: Abstract.Expectation, closure: Props) {
    super();

    this.exception = source.exception && new Action(source.exception, closure);

    this.props = new Promise<Props>((resolve, reject) => {
      const means = new Expression(source.means, closure);

      means.connect((resultingValue) => {
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

              if (this.supplier) {
                this.supplier.handleEvent(value);
              } else {
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
                resolve(this.supplier.getProps());
              }
            }
          })
          .catch((error) => {
            const index = this.queue.indexOf(attendant);

            if (index !== -1) {
              this.queue.splice(index, 1);

              if (this.supplier) {
                this.supplier.handleException(error);
              } else {
                this.supplier = new Field(
                  {
                    kind: "field",
                    content: {
                      kind: "rawValue",
                      value: undefined,
                    },
                  },
                  closure,
                );

                this.supplier.connect(this);
                this.supplier.handleException(error);
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

  handleException(error: unknown): void {
    if (this.exception) {
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

      this.exception.handleEvent([errorArg]);
    } else {
      super.handleException(error);
    }
  }
}

/**
 * Actions:
 */

class Action extends Publisher<null> implements Subscriber<Array<Field>> {
  private readonly target: Procedure | Call | Fork | Invocation;

  constructor(source: Abstract.Action, closure: Props) {
    super();

    switch (source.target.kind) {
      case "procedure":
        this.target = new Procedure(source.target, closure);
        break;
      case "call":
        this.target = new Call(source.target, closure);
        break;
      case "fork":
        this.target = new Fork(source.target, closure);
        break;
      case "invocation":
        this.target = new Invocation(source.target, closure);
        break;
      default:
        throw new Error(
          `Action cannot target something of invalid kind: ${(source.target as Abstract.Component).kind}`,
        );
    }

    this.target.connect(() => {
      this.publish(null);
    });
  }

  handleEvent(args?: Array<Field> | null): void {
    this.target.handleEvent(args ?? []);
  }
}

class Procedure extends Publisher<null> implements Subscriber<Array<Field>> {
  private readonly source: Abstract.Procedure;
  private readonly closure: Props;

  constructor(source: Abstract.Procedure, closure: Props) {
    super();

    this.source = source;
    this.closure = closure;
  }

  handleEvent(args: Array<Field>): void {
    const parameterizedClosure = new StaticProps(
      this.source.params.reduce<Record<string, Field>>((acc, param, index) => {
        acc[param] = args[index];
        return acc;
      }, {}),
      this.closure,
    );

    const actions = this.source.steps.map((step) => {
      const action = new Action(step, parameterizedClosure);
      return action;
    });

    actions.forEach((action, index) => {
      const nextAction = actions[index + 1];

      if (nextAction) {
        action.connect(() => {
          nextAction.handleEvent();
        });
      } else {
        action.connect(() => {
          this.publish(null);
        });
      }
    });

    actions[0]?.handleEvent();
  }
}

class Call extends Publisher<null> implements Subscriber<Array<Field>> {
  private readonly action:
    | (Publisher<null> & Subscriber<Array<Field>>)
    | Promise<Publisher<null> & Subscriber<Array<Field>>>;

  private readonly constantArgs?: Array<Field>;

  constructor(source: Abstract.Call, closure: Props) {
    super();

    const getAction = (scope: Props) => {
      const action = scope.getMember(source.actionName);

      if (action instanceof Action) {
        return action;
      }

      if (typeof action === "function") {
        const proxy = new (class extends Publisher<null> implements Subscriber<Array<Field>> {
          handleEvent(args: Array<Field>) {
            console.log(`calling ${source.actionName} with args...`, args);
            action(...args);
            this.publish(null);
          }
        })();
        return proxy;
      }

      throw new Error(`Cannot call something which is not an action or function: ${source.actionName}`);
    };

    const scope = source.scope ? new Field(source.scope, closure).getProps() : closure;

    if (scope instanceof Promise) {
      this.action = scope.then((scope) => {
        const action = getAction(scope);
        action.connect(() => {
          this.publish(null);
        });
        return action;
      });
    } else {
      this.action = getAction(scope);
      this.action.connect(() => {
        this.publish(null);
      });
    }

    this.constantArgs = source.args?.map((sourceArg) => {
      const arg = new Field(sourceArg, closure);
      return arg;
    });
  }

  handleEvent(args?: Array<Field> | null): void {
    const finalArgs = this.constantArgs ?? args ?? [];

    const expectedArgs = finalArgs.filter((arg) => arg.getContent() instanceof Expectation);

    if (expectedArgs.length > 0) {
      Promise.all([this.action, ...expectedArgs.map((arg) => arg.getProps())]).then(([action]) =>
        action.handleEvent(finalArgs),
      );
    } else if (this.action instanceof Promise) {
      this.action.then((x) => x.handleEvent(finalArgs));
    } else {
      this.action.handleEvent(finalArgs);
    }
  }
}

// TODO Update to support alternatives and not exiting early
class Fork extends Publisher<null> implements Subscriber<null> {
  private readonly condition: Field;
  private readonly consequence?: Abstract.Action;
  private readonly closure: Props;

  constructor(source: Abstract.Fork, closure: Props) {
    super();

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

class Invocation extends Publisher<null> implements Subscriber<null> {
  private readonly prerequisite: Abstract.Field;
  private readonly procedure?: Abstract.Procedure;
  private readonly closure: Props;

  constructor(source: Abstract.Invocation, closure: Props) {
    super();

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
        procedure.connect(this);
        procedure.handleEvent(args);
      }
    });
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
