export interface Subscriber<T = unknown> {
  handleEvent(value: T): void | Promise<void>;
}

export abstract class Publisher<T = unknown> {
  private readonly subscribers: Array<Subscriber<T>> = [];
  private value?: T;

  connect(target: Subscriber<T>["handleEvent"] | Subscriber<T>): void {
    const subscriber = this.connectPassively(target);

    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }
  }

  connectPassively(target: Subscriber<T>["handleEvent"] | Subscriber<T>): Subscriber<T> {
    const subscriber = typeof target === "function" ? { handleEvent: target } : target;

    this.subscribers.push(subscriber);

    return subscriber;
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

// TODO How is this going to work for action error handling?
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
