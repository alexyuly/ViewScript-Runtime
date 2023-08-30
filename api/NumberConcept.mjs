import BooleanConcept from "./BooleanConcept.mjs";
import GenericConcept from "./GenericConcept.mjs";

/**
 * Boxes a number value
 */
export default class NumberConcept extends GenericConcept {
  constructor(value) {
    super(value);
  }

  // Actions:

  add(boxed) {
    this.publish(this.value + boxed.value);
  }

  divide(boxed) {
    this.publish(this.value / boxed.value);
  }

  multiply(boxed) {
    this.publish(this.value * boxed.value);
  }

  negate() {
    this.publish(-this.value);
  }

  subtract(boxed) {
    this.publish(this.value - boxed.value);
  }

  // Methods:

  is(boxed) {
    return new BooleanConcept(Object.is(this.value, boxed.value));
  }

  ["is at least"](boxed) {
    return new BooleanConcept(this.value >= boxed.value);
  }

  ["is at most"](boxed) {
    return new BooleanConcept(this.value <= boxed.value);
  }

  ["is less than"](boxed) {
    return new BooleanConcept(this.value < boxed.value);
  }

  ["is more than"](boxed) {
    return new BooleanConcept(this.value > boxed.value);
  }
}
