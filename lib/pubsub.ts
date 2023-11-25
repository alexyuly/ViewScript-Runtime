export interface Subscriber<T = unknown> {
  handleEvent(value: T): void;
}

export abstract class Publisher<T = unknown> {
  private eventHandlers: Array<Subscriber<T>["handleEvent"]> = [];
  private value?: T;

  getValue() {
    return this.value;
  }

  protected publish(value: T) {
    this.value = value;

    for (const handleEvent of this.eventHandlers) {
      handleEvent(value);
    }
  }

  sendTo(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    const handleEvent = typeof target === "function" ? target : target.handleEvent;

    if (this.value !== undefined) {
      handleEvent(this.value);
    }

    this.eventHandlers.push(handleEvent);
  }
}

export class Exchange<T = unknown> extends Publisher<T> implements Subscriber<T> {
  handleEvent(value: T): void {
    this.publish(value);
  }
}
