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

  subtract(value) {
    this.publish(this.value - value);
  }

  // Methods:

  is(value) {
    return Object.is(this.value, value);
  }

  ["is at least"](value) {
    return this.value >= value;
  }

  ["is at most"](value) {
    return this.value <= value;
  }

  ["is less than"](value) {
    return this.value < value;
  }

  ["is more than"](value) {
    return this.value > value;
  }
}
