/**
 * Boxes a string value
 */
export default class StringBoxedValue {
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
