export interface Subscriber<T = unknown> {
  handleEvent(value: T): void;
}

export abstract class Publisher<T = unknown> {
  private eventHandlers: Array<Subscriber<T>["handleEvent"]> = [];
  private value?: T;

  connect(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    const handleEvent = typeof target === "function" ? target : target.handleEvent;

    if (this.value !== undefined) {
      handleEvent(this.value);
    }

    this.eventHandlers.push(handleEvent);
  }

  disconnect(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    const handleEvent = typeof target === "function" ? target : target.handleEvent;

    this.eventHandlers = this.eventHandlers.filter((eventHandler) => {
      return eventHandler !== handleEvent;
    });
  }

  getValue() {
    return this.value;
  }

  protected publish(value: T) {
    this.value = value;

    this.eventHandlers.forEach((handleEvent) => {
      handleEvent(value);
    });
  }
}

export abstract class Channel<T = unknown> extends Publisher<T> implements Subscriber<T> {
  handleEvent(value: T): void {
    this.publish(value);
  }
}
