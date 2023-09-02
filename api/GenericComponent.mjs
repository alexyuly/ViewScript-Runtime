/**
 * The base class for app building blocks
 */
export default class GenericComponent {
  constructor(parameters, handlers) {
    this.handlers = handlers;
    this.parameters = parameters;
  }

  // protected
  reportEvent(eventName, boxedValue) {
    const eventHandlers = this.handlers[eventName];

    for (const eventHandler of eventHandlers) {
      eventHandler.handle(boxedValue);
    }
  }
}
