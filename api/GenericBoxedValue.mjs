import assert from "assert";

import GenericListener from "./GenericListener.mjs";

/**
 * Boxes any value for publishing and subscribing
 */
export default class GenericBoxedValue {
  constructor(value, type) {
    this.listeners = [];
    this.type = type;
    this.value = value;
  }

  publish(value) {
    this.value = value;

    for (const listener of this.listeners) {
      listener.send(value);
    }
  }

  subscribe(listener) {
    assert(
      listener instanceof GenericListener,
      "You must provide an instance of GenericListener to subscribe a GenericBoxedValue"
    );

    this.listeners.push(listener);
  }
}
