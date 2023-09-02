/**
 * The base class for data building blocks
 */
export default class GenericConcept {
  constructor(value) {
    this.listeners = [];
    this.value = value;
  }

  // protected
  publish(value) {
    this.value = value;

    for (const listener of this.listeners) {
      listener.send(value);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }
}
