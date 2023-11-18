export interface Subscriber<T = unknown> {
  handleEvent(event: T): void;
}

export abstract class Publisher<T = unknown> {
  private eventHandlers: Array<Subscriber<T>["handleEvent"]> = [];
  private value?: T;

  sendTo(target: Subscriber<T>["handleEvent"] | Subscriber<T>) {
    const handleEvent = typeof target === "function" ? target : target.handleEvent;

    if (this.value !== undefined) {
      handleEvent(this.value);
    }

    this.eventHandlers.push(handleEvent);
  }

  protected publish(event: T) {
    this.value = event;

    for (const handleEvent of this.eventHandlers) {
      handleEvent(event);
    }
  }
}
