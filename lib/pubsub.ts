export interface Subscriber<T = unknown> {
  handleEvent(value: T): void | Promise<void>;
}

// TODO Split into two classes, one which is dumb and just forwards stuff but has the same interface.
export abstract class Publisher<T = unknown> implements Subscriber<T> {
  private readonly deliverable: Promise<T>;
  private readonly subscribers: Array<Subscriber<T>> = [];

  private deliveryStatus: "pending" | "fulfilled" | "rejected" = "pending";
  private error?: unknown;
  private reject?: (error: unknown) => void;
  private resolve?: (value: T) => void;
  private value?: T;

  constructor() {
    this.deliverable = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  connect(handleEvent: Subscriber<T>["handleEvent"] | Subscriber<T>): () => void {
    const subscriber = typeof handleEvent === "function" ? { handleEvent } : handleEvent;

    this.subscribers.push(subscriber);

    if (this.value !== undefined) {
      subscriber.handleEvent(this.value);
    }

    return () => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  }

  connectPassively(handleEvent: Subscriber<T>["handleEvent"] | Subscriber<T>): () => void {
    const subscriber = typeof handleEvent === "function" ? { handleEvent } : handleEvent;

    this.subscribers.push(subscriber);

    return () => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  }

  getDeliverable(): Promise<T> {
    return this.deliverable;
  }

  getError(): unknown {
    return this.error;
  }

  getValue(): T | undefined {
    return this.value;
  }

  handleEvent(value: T): void {
    if (this.value === value) {
      return;
    }

    this.value = value;

    this.subscribers.forEach((subscriber) => {
      subscriber.handleEvent(value);
    });

    if (this.deliveryStatus === "pending") {
      this.deliveryStatus = "fulfilled";
      this.resolve!(value);
    }
  }

  handleException(error: unknown): void {
    if (this.error === error) {
      return;
    }

    this.error = error;

    this.subscribers.forEach((subscriber) => {
      if ("handleException" in subscriber && typeof subscriber.handleException === "function") {
        subscriber.handleException(error);
      }
    });

    if (this.deliveryStatus === "pending") {
      this.deliveryStatus = "rejected";
      this.reject!(error);
    }
  }
}
