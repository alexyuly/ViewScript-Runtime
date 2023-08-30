/**
 * Boxes any value for publishing and subscribing
 */
export default class GenericConcept {
  constructor(value) {
    this.listeners = [];
    this.value = value;
  }

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
