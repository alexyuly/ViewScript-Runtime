export interface Subscriber<T = unknown> {
  handleEvent(value: T): unknown;
}

export abstract class Publisher<T = unknown> {
  private subscribers: Array<Subscriber<T>> = [];
  private value?: T;

  connect(target: Subscriber<T>["handleEvent"] | Subscriber<T>): void {
    const subscriber = typeof target === "function" ? { handleEvent: target } : target;

    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    this.subscribers.push(subscriber);
  }

  disconnect(target: Subscriber<T>["handleEvent"] | Subscriber<T>): void {
    this.subscribers = this.subscribers.filter((subscriber) => {
      const compareTo = typeof target === "function" ? subscriber.handleEvent : subscriber;
      return compareTo !== target;
    });
  }

  protected getSubscribers(): Array<Subscriber<T>> {
    return this.subscribers;
  }

  getValue(): T | undefined {
    return this.value;
  }

  protected publish(value: T): void {
    if (this.value === value) {
      return;
    }

    this.value = value;

    this.subscribers.forEach((subscriber) => {
      subscriber.handleEvent(value);
    });
  }
}

export abstract class Channel<T = unknown> extends Publisher<T> implements Subscriber<T> {
  private error?: unknown;

  getError(): unknown {
    return this.error;
  }

  handleEvent(value: T): void {
    this.publish(value);
  }

  handleException(error: unknown): void {
    this.publishError(error);
  }

  protected publishError(error: unknown): void {
    if (this.error === error) {
      return;
    }

    this.error = error;

    this.getSubscribers().forEach((subscriber) => {
      if (subscriber instanceof Channel) {
        subscriber.handleException(error);
      }
    });
  }
}
