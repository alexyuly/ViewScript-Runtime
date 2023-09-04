import FieldSerialized from "./FieldSerialized";
import type Listener from "./Listener";
import StringField from "./StringField";

export default class Field<T = unknown> {
  private value: T;

  private readonly listeners: Array<Listener<T>> = [];

  constructor(value: T) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  attach(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  update(value: T) {
    this.value = value;

    for (const listener of this.listeners) {
      listener.report(value);
    }
  }

  static deserialize(field: FieldSerialized) {
    switch (field.name) {
      case "string":
        return new StringField(field.value);
      default:
        throw new Error(
          `The given FieldSerialized had unrecognized name: ${field.name}`
        );
    }
  }
}
