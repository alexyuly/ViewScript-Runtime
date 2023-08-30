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

  push(boxed) {
    this.value.push(boxed);
    this.publish(this.value);
  }

  // Methods:

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

  length() {
    return new NumberConcept(this.value.length);
  }
}
