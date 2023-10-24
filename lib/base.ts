import * as Abstract from "./abstract";

export interface Listener<T = unknown> {
  take(value: T): void;
}

export abstract class Publisher<T = unknown> {
  private readonly listeners: Array<Listener<T>> = [];

  protected publish(value: T) {
    this.listeners.forEach((listener) => {
      listener.take(value);
    });
  }

  listen(listener: Listener<T>) {
    this.listeners.push(listener);
  }
}

export abstract class Binding<T = unknown>
  extends Publisher<T>
  implements Listener<T>
{
  take(value: T) {
    this.publish(value);
  }
}

export type ValueOf<ModelName extends string> = Abstract.Value<
  Abstract.Model<ModelName>
>;

export class Store<ModelName extends string> extends Binding<
  ValueOf<ModelName>
> {
  private readonly firstValue: ValueOf<ModelName>;
  private lastValue: ValueOf<ModelName>;

  constructor(store: Abstract.Store<Abstract.Model<ModelName>>) {
    super();

    this.firstValue = store.value;
    this.lastValue = store.value;
    super.take(store.value);
  }

  listen(listener: Listener<ValueOf<ModelName>>) {
    listener.take(this.lastValue);
    super.listen(listener);
  }

  read() {
    return this.lastValue;
  }

  reset() {
    this.take(this.firstValue);
  }

  take(value: ValueOf<ModelName>) {
    this.lastValue = value;
    super.take(value);
  }
}
