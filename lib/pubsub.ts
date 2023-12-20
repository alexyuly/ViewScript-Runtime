export interface Subscriber<T = unknown> {
  handleEvent(value: T): unknown;
}

export abstract class Publisher<T = unknown> {
  private subscribers: Array<Subscriber<T>> = [];
  private value?: T;

  connect(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    const subscriber = typeof target === "function" ? { handleEvent: target } : target;

    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    this.subscribers.push(subscriber);
  }

  disconnect(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    this.subscribers = this.subscribers.filter((subscriber) => {
      const compareTo = typeof target === "function" ? subscriber.handleEvent : subscriber;
      return compareTo !== target;
    });
  }

  getValue() {
    return this.value;
  }

  protected publish(value: T) {
    this.value = value;

    this.subscribers.forEach((subscriber) => {
      subscriber.handleEvent(value);
    });
  }
}

export abstract class Channel<T = unknown> extends Publisher<T> implements Subscriber<T> {
  handleEvent(value: T): void {
    this.publish(value);
  }
}
