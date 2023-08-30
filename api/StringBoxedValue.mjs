import GenericBoxedValue from "./GenericBoxedValue.mjs";

/**
 * Boxes a string value
 */
export default class StringBoxedValue extends GenericBoxedValue {
  constructor(value) {
    super(value, "string");
  }

  // Methods:

  length() {
    return value.length;
  }

  split(separator) {
    return this.value.split(separator);
  }
}
