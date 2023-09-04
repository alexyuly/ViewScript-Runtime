export default interface Listener<T> {
  report(value: T): void;
}
