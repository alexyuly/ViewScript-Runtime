import GenericBoxedValue from "./GenericBoxedValue.mjs";

/**
 * Boxes a string value
 */
export default class StringBoxedValue extends GenericBoxedValue {
  constructor(value) {
    super(value, "string");
  }

  // Methods:

  is(value) {
    return Object.is(this.value, value);
  }

  length() {
    return this.value.length;
  }

  split(separator) {
    return this.value.split(separator);
  }
}
