import assert from "assert";

/**
 * Represents an abstract listener that receives messages
 */
export default class GenericListener {
  constructor() {
    assert(
      false,
      "GenericListener is an abstract class that cannot be constructed"
    );
  }

  send() {
    assert(
      false,
      "GenericListener is an abstract class that cannot call methods"
    );
  }
}
