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

class Field extends Binding {
  readonly id: string;
  private readonly members: Record<string, Publisher | Subscriber> = {};
  private readonly modelName: string;
  private value?: unknown;

  constructor(field: Compiled.Field) {
    super();

    this.id = window.crypto.randomUUID();
    this.modelName = field.C;
    this.value = field.V;

    if (this.modelName === "Condition") {
      this.members.disable = { take: () => this.take(true) };
      this.members.enable = { take: () => this.take(false) };
      this.members.toggle = { take: () => this.take(!this.getValue()) };
    } else {
      throw new ViewScriptException(
        `Cannot construct a field of unknown class \`${this.modelName}\``
      );
    }
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

  take(value: unknown) {
    this.value = value;

    super.take(value);
  }
}

class Reference extends Binding {
  private readonly binding: Publisher | Subscriber;

  constructor(reference: Compiled.Reference, fields: Record<string, Field>) {
    super();

    if (typeof reference.N === "string") {
      this.binding = fields[reference.N];
    } else if (reference.N instanceof Array && reference.N.length === 2) {
      this.binding = fields[reference.N[0]].getMember(reference.N[1]);
    } else if (reference.N instanceof Array && reference.N.length === 3) {
      this.binding = (
        fields[reference.N[0]].getMember(reference.N[1]) as Field
      ).getMember(reference.N[2]);
    } else {
      throw new ViewScriptException(
        `Cannot construct a reference of invalid name "${reference.N}"`
      );
    }

    if ("subscribe" in this.binding) {
      this.binding.subscribe(this);
    } else {
      this.subscribe(this.binding);
    }
  }
}

class Conditional extends Publisher implements Subscriber<boolean> {
  private readonly query: Reference;
  private readonly yes: Field;
  private readonly zag: Field;

  constructor(
    conditional: Compiled.Conditional,
    fields: Record<string, Field>
  ) {
    super();

    this.query = new Reference(conditional.Q, fields);
    this.yes = new Field(conditional.Y);
    this.zag = new Field(conditional.Z);

    this.query.subscribe(this);
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
      this.publisher = new Field(input.V);
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
        this.fields[statement.N] = new Field(statement);
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
