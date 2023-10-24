import * as Abstract from "./abstract";

export interface Subscriber<T = unknown> {
  take(value: T): void;
}

export abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Subscriber<T>> = [];

  protected publish(value: T) {
    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  subscribe(listener: Subscriber<T>) {
    this.listeners.push(listener);
  }
}

export abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Subscriber<T>
{
  take(value: T) {
    this.publish(value);
  }
}

export class Store<ModelKey extends string = string> extends Binding<
  Abstract.Value<Abstract.Model<ModelKey>>
> {
  private readonly firstValue: Abstract.Value<Abstract.Model<ModelKey>>;
  private lastValue: Abstract.Value<Abstract.Model<ModelKey>>;

  constructor(store: Abstract.Store<Abstract.Model<ModelKey>>) {
    super();

    this.firstValue = store.value;
    this.lastValue = store.value;
    super.take(store.value);
  }

  read() {
    return this.lastValue;
  }

  reset() {
    this.take(this.firstValue);
  }

  subscribe(listener: Subscriber<Abstract.Value<Abstract.Model<ModelKey>>>) {
    listener.take(this.lastValue);
    super.subscribe(listener);
  }

  take(value: Abstract.Value<Abstract.Model<ModelKey>>) {
    this.lastValue = value;
    super.take(value);
  }
}
