/**
 * Manipulates data and manages events and side effects
 */
export default class GenericComponent {
  constructor(parameters, handlers) {
    this.parameters = parameters;
    this.handlers = handlers;
  }

  fire(eventName, boxedValue) {
    const eventHandlers = this.handlers.get(eventName);
    for (const eventHandler of eventHandlers) {
      eventHandler.handle(boxedValue);
    }
  }
}
