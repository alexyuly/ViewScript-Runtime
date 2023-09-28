class ViewScriptException extends Error {}

interface Subscriber<T = unknown> {
  take(value: T): void;
}

abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Subscriber<T>> = [];

  publish(value: T) {
    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  subscribe(listener: Subscriber<T>) {
    this.listeners.push(listener);
  }
}

abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  take(value: T) {
    this.publish(value);
  }
}

abstract class Field<T = unknown> extends Binding<T> {
  readonly id: string;
  private readonly members: Record<string, Publisher | Subscriber> = {};
  private readonly modelName: string;
  private value?: unknown;

  constructor(field: Compiled.Field) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.C;
    this.value = field.V;
  }

  static create(field: Compiled.Field) {
    if (Compiled.isCondition(field)) {
      return new Condition(field);
    }
    if (Compiled.isText(field)) {
      return new Text(field);
    }

    throw new ViewScriptException(
      `Cannot construct a field of unknown class \`${field.C}\``
    );
  }

  getMember(name: string) {
    if (!(name in this.members)) {
      throw new ViewScriptException(
        `Cannot getMember \`${name}\` of field \`${this.id}\` of class \`${this.modelName}\``
      );
    }

    return this.members[name];
  }

  getValue() {
    return this.value;
  }

  take(value: T) {
    this.value = value;
    this.publish(value);
  }

  protected when(name: string, reducer: () => T) {
    this.members[name] = {
      take: () => {
        this.take(reducer());
      },
    };
  }
}

class Condition extends Field<boolean> {
  constructor(field: Compiled.Condition) {
    super(field);

    this.when("disable", () => true);
    this.when("enable", () => false);
    this.when("toggle", () => !this.getValue());
  }
}

class Text extends Field<string> {
  constructor(field: Compiled.Text) {
    super(field);
  }
}

class Reference extends Binding {
  private readonly member: Publisher | Subscriber;

  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    const names =
      typeof reference.N === "string" ? [reference.N] : [...reference.N];

    const getNextName = () => {
      const name = names.shift();

      if (!name) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      return name;
    };

    this.member = fields[getNextName()];

    while (names.length > 0) {
      const nextName = getNextName();

      if (!(this.member instanceof Field)) {
        throw new ViewScriptException(
          `Cannot dereference invalid name \`${reference.N}\``
        );
      }

      this.member.getMember(nextName);
    }

    if ("subscribe" in this.member) {
      this.member.subscribe(this);
    } else {
      this.subscribe(this.member);
    }
  }
}

class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly yes: Field;
  private readonly zag: Field;

  constructor(
    conditional: Compiled.Conditional,
    fields: Record<string, Field>
  ) {
    super();

    this.yes = Field.create(conditional.Y);
    this.zag = Field.create(conditional.Z);

    new Reference(conditional.Q, fields).subscribe(this);
  }

  take(value: boolean) {
    this.publish(value ? this.yes.getValue() : this.zag.getValue());
  }
}

class Input extends Binding {
  private readonly publisher: Publisher;

  constructor(input: Compiled.Input, fields: Record<string, Field>) {
    super();

    if (input.V.K === "f") {
      this.publisher = Field.create(input.V);
    } else if (input.V.K === "r") {
      this.publisher = new Reference(input.V, fields);
    } else if (input.V.K === "c") {
      this.publisher = new Conditional(input.V, fields);
    } else {
      throw new ViewScriptException(
        `Cannot construct an input of unknown kind "${
          (input.V as { K: unknown }).K
        }"`
      );
    }

    this.publisher.subscribe(this);
  }
}

class Output extends Binding {
  private readonly reference: Reference;

  constructor(output: Compiled.Output, fields: Record<string, Field>) {
    super();

    this.reference = new Reference(output.V, fields);
    this.subscribe(this.reference);
  }
}

// TODO Finish fixing this:
class Element {
  constructor(element: Compiled.Element, fields: Record<string, Field>) {
    const htmlElement = window.document.createElement(element.C);

    element.P.forEach((property) => {
      if (property.K === "i") {
        new Input(property, fields);
      } else if (property.K === "o") {
        new Output(property, fields);
      }
    });
  }
}

class View {
  // TODO Include window (with console.log) in fields, by default:
  private readonly fields: Record<string, Field> = {};

  constructor(view: Compiled.View) {
    view.B.forEach((statement) => {
      if (statement.K === "f") {
        this.fields[statement.N] = Field.create(statement);
      } else if (statement.K === "e") {
        new Element(statement, this.fields);
      }
    });
  }
}

export class App {
  constructor(app: Compiled.App) {
    new View(app.B[0]);
  }
}
