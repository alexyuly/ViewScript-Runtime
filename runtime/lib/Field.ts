import type Listener from "./Listener";

export default class Field<T = unknown> {
  private value: T;

  private readonly listeners: Array<Listener<T>> = [];

  constructor(value: T) {
    this.value = value;
  }

  attach(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  getValue() {
    return this.value;
  }

  update(value: T) {
    this.value = value;

    for (const listener of this.listeners) {
      listener.report(value);
    }
  }

  static deserialize(field: Serialized.Field): Field {
    if (Serialized.isBooleanField(field)) return new BooleanField(field.value);
    if (Serialized.isNumberField(field)) return new NumberField(field.value);
    if (Serialized.isStringField(field)) return new StringField(field.value);
    throw new Error(
      `Serialized.Field had unrecognized name: ${(field as any).name}`
    );
  }
}

export class BooleanField extends Field<boolean> {
  enable() {
    const nextValue = true;
    this.update(nextValue);
  }
}

export class NumberField extends Field<number> {
  add(value: number) {
    const nextValue = this.getValue() + value;
    this.update(nextValue);
  }
}

export class StringField extends Field<string> {}
