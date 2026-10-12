export const DEFAULT_REALTIME_EVENT_IDS_PER_AGGREGATE = 1_024;
const DEFAULT_REALTIME_AGGREGATES = 512;
const DEFAULT_RECONNECT_BUFFER_SIZE = 1_024;

export const isRealtimeTransportEnabled = (value?: string): boolean =>
  value !== "false";

export class ExactEventIdDedupe {
  private readonly idsByAggregate = new Map<string, Set<string>>();

  constructor(
    private readonly maxIdsPerAggregate =
      DEFAULT_REALTIME_EVENT_IDS_PER_AGGREGATE,
    private readonly maxAggregates = DEFAULT_REALTIME_AGGREGATES,
  ) {}

  accept(aggregateKey: string, eventId?: string): boolean {
    if (!eventId) return true;

    let ids = this.idsByAggregate.get(aggregateKey);
    if (!ids) {
      ids = new Set<string>();
      this.idsByAggregate.set(aggregateKey, ids);
      if (this.idsByAggregate.size > this.maxAggregates) {
        const oldest = this.idsByAggregate.keys().next().value;
        if (oldest) this.idsByAggregate.delete(oldest);
      }
    }

    if (ids.has(eventId)) return false;
    ids.add(eventId);
    if (ids.size > this.maxIdsPerAggregate) {
      const oldest = ids.values().next().value;
      if (oldest) ids.delete(oldest);
    }
    return true;
  }

  clear(): void {
    this.idsByAggregate.clear();
  }
}

export class ReconnectEventBuffer<T> {
  private ready = false;
  private readonly pending: T[] = [];

  constructor(private readonly maxPending = DEFAULT_RECONNECT_BUFFER_SIZE) {}

  disconnect(): void {
    this.ready = false;
  }

  push(event: T, apply: (event: T) => void): void {
    if (this.ready) {
      apply(event);
      return;
    }
    this.pending.push(event);
    if (this.pending.length > this.maxPending) this.pending.shift();
  }

  resynced(apply: (event: T) => void): void {
    this.ready = true;
    this.pending.splice(0).forEach(apply);
  }

  reset(): void {
    this.ready = false;
    this.pending.splice(0);
  }

  get isReady(): boolean {
    return this.ready;
  }
}
