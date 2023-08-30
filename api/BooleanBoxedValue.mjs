/**
 * Boxes a boolean value
 */
export default class BooleanBoxedValue {
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
    this.publish(!this.value);
  }
}
