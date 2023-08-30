import GenericBoxedValue from "./GenericBoxedValue.mjs";

/**
 * Boxes a boolean value
 */
export default class BooleanBoxedValue extends GenericBoxedValue {
  constructor(value) {
    super(value, "boolean");
  }

  // Actions:

  disable() {
    this.publish(false);
  }

  enable() {
    this.publish(true);
  }

  toggle() {
    this.publish(this.inverse());
  }

  // Methods:

  inverse() {
    return !this.value;
  }
}
