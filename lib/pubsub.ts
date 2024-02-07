export interface Subscriber<T = unknown> {
  handleEvent(value: T): void | Promise<void>;
}

export abstract class Publisher<T = unknown> implements Subscriber<T> {
  private readonly deliverable: Promise<T>;
  private readonly subscribers: Array<Subscriber<T>> = [];

  private error?: unknown;
  private reject?: (error: unknown) => void;
  private resolve?: (value: T) => void;
  private status: "VOID" | "INVALID" | "VALID" | "STALE" = "VOID";
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

    console.log("publishing value...", this, value);

    this.value = value;

    this.subscribers.forEach((subscriber) => {
      subscriber.handleEvent(value);
    });

    if (this.status === "VOID") {
      this.resolve!(value);
    }

    this.status = "VALID";
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

    if (this.status === "VOID") {
      this.reject!(error);
      this.status = "INVALID";
    } else if (this.status === "VALID") {
      this.status = "STALE";
    }
  }
}
