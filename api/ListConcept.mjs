import BooleanConcept from "./BooleanConcept.mjs";
import GenericConcept from "./GenericConcept.mjs";
import NumberConcept from "./NumberConcept.mjs";

/**
 * Boxes an Array value
 */
export default class ListConcept extends GenericConcept {
  constructor(value) {
    super(value);
  }

  // Actions:

  /**
   * Removes the last item from a stack
   */
  pop() {
    this.value.pop();
    this.publish(this.value);
  }

  /**
   * Adds an item to the end of a stack
   */
  push(boxed) {
    this.value.push(boxed);
    this.publish(this.value);
  }

  /**
   * Removes the first item from a queue
   */
  shift() {
    this.value.shift();
    this.publish(this.value);
  }

  /**
   * Adds an item to the end of a queue
   */
  unshift(boxed) {
    this.value.unshift(boxed);
    this.publish(this.value);
  }

  // Methods:

  /**
   * @returns the first item in a queue (that is, the one that shift will return next)
   */
  first() {
    return this.value[0];
  }

  is(boxed) {
    if (this.value.length !== boxed.value.length) {
      return new BooleanConcept(false);
    }

    for (let i = 0; i < this.value.length; i++) {
      if (!Object.is(this.value[i], boxed.value[i])) {
        return new BooleanConcept(false);
      }
    }

    return new BooleanConcept(true);
  }

  /**
   * @returns the last item in a stack (that is, the one that pop will return next)
   */
  last() {
    return this.value[this.value.length - 1];
  }

  length() {
    return new NumberConcept(this.value.length);
  }
}
