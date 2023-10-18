export interface Listener<T> {
  take(value: T): void;
}

export abstract class Publisher<T> {
  private readonly listeners: Array<Listener<T>> = [];

  listen(listener: Listener<T>): void {
    this.listeners.push(listener);
  }

  publish(value: T): void {
    this.listeners.forEach((listener) => listener.take(value));
  }
}
