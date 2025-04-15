export interface Picker<T> {
  pick(items: readonly T[]): T;
}
