import GenericConcept from "./GenericConcept.mjs";

/**
 * Boxes a boolean value
 */
export default class BooleanConcept extends GenericConcept {
  constructor(value) {
    super(value);
  }

  // Actions:

  disable() {
    this.publish(false);
  }

  enable() {
    this.publish(true);
  }

  reverse() {
    this.publish(this.inverse());
  }

  // Methods:

  inverse() {
    return new BooleanConcept(!this.value);
  }
}
