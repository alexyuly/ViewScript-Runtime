import {
  FieldSerialized,
  isBooleanFieldSerialized,
  isNumberFieldSerialized,
  isStringFieldSerialized,
} from "./Serialized";
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

  static deserialize(field: FieldSerialized) {
    if (isBooleanFieldSerialized(field)) {
      return new BooleanField(field.value);
    }
    if (isNumberFieldSerialized(field)) {
      return new NumberField(field.value);
    }
    if (isStringFieldSerialized(field)) {
      return new StringField(field.value);
    }
    throw new Error(
      `The given FieldSerialized had unrecognized name: ${
        (field as unknown as any).name
      }`
    );
  }
}

export class BooleanField extends Field<boolean> {
  disable() {
    this.update(false);
  }

  enable() {
    this.update(true);
  }

  toggle() {
    return this.update(!this.getValue());
  }
}

export class NumberField extends Field<number> {
  add(value: number) {
    this.update(this.getValue() + value);
  }

  sign() {
    return Math.sign(this.getValue());
  }
}

export class StringField extends Field<string> {
  length() {
    return this.getValue().length;
  }
}
