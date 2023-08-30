import GenericBoxedValue from "./GenericBoxedValue.mjs";

/**
 * Boxes a number value
 */
export default class NumberBoxedValue extends GenericBoxedValue {
  constructor(value) {
    super(value, "number");
  }

  // Actions:

  add(value) {
    this.publish(this.value + value);
  }

  divide(value) {
    this.publish(this.value / value);
  }

  multiply(value) {
    this.publish(this.value * value);
  }

  negate() {
    this.publish(-this.value);
  }

  // Methods:

  ["is at least"](value) {
    return this.value >= value;
  }
}
