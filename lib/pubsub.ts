export interface Subscriber<T = unknown> {
  handleEvent(value: T): unknown;
}

export abstract class Publisher<T = unknown> {
  protected subscribers: Array<Subscriber<T>> = [];
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

  protected publish(event: T) {
    this.value = event;

    this.subscribers.forEach((subscriber) => {
      subscriber.handleEvent(event);
    });
  }
}

export abstract class SafePublisher<T = unknown> extends Publisher<T> {
  private error?: unknown;

  getError() {
    return this.error;
  }

  protected publishError(error: unknown) {
    this.error = error;

    this.subscribers.forEach((subscriber) => {
      if (subscriber instanceof SafeChannel) {
        subscriber.handleError(error);
      }
    });
  }
}

export abstract class Channel<T = unknown> extends Publisher<T> implements Subscriber<T> {
  handleEvent(value: T): void {
    this.publish(value);
  }
}

export abstract class SafeChannel<T = unknown> extends SafePublisher<T> implements Subscriber<T> {
  handleEvent(value: T): void {
    this.publish(value);
  }

  handleError(error: unknown): void {
    this.publishError(error);
  }
}
