import BooleanConcept from "./BooleanConcept.mjs";
import GenericConcept from "./GenericConcept.mjs";
import ListConcept from "./ListConcept.mjs";
import NumberConcept from "./NumberConcept.mjs";

/**
 * Boxes a string value
 */
export default class StringConcept extends GenericConcept {
  constructor(value) {
    super(value);
  }

  // Methods:

  is(boxed) {
    return new BooleanConcept(Object.is(this.value, boxed.value));
  }

  length() {
    return new NumberConcept(this.value.length);
  }

  split(boxed) {
    const list = this.value.split(boxed.value);

    for (let i = 0; i < list.length; i++) {
      list[i] = new StringConcept(list[i]);
    }

    return new ListConcept(list);
  }
}
