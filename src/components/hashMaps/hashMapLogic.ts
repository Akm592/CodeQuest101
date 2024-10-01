export class HashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size: number;
  private capacity: number;

  constructor(capacity: number = 16) {
    this.buckets = new Array(capacity).fill(null).map(() => []);
    this.size = 0;
    this.capacity = capacity;
  }

  private hash(key: K): number {
    if (typeof key === "string") {
      return (
        key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        this.capacity
      );
    }
    return Number(key) % this.capacity;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const item = bucket.find(([k]) => k === key);

    if (item) {
      item[1] = value;
    } else {
      bucket.push([key, value]);
      this.size++;
    }

    if (this.size / this.capacity > 0.75) {
      this.resize();
    }
  }

  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const item = bucket.find(([k]) => k === key);
    return item ? item[1] : undefined;
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const itemIndex = bucket.findIndex(([k]) => k === key);

    if (itemIndex !== -1) {
      bucket.splice(itemIndex, 1);
      this.size--;
      return true;
    }

    return false;
  }

  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;

    oldBuckets.forEach((bucket) => {
      bucket.forEach(([key, value]) => {
        this.set(key, value);
      });
    });
  }
}
