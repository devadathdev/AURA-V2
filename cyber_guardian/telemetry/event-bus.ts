import { SecurityEvent } from '../types';

type EventHandler = (event: SecurityEvent) => void;

export class EventBus {
  private handlers: EventHandler[] = [];
  private eventLog: SecurityEvent[] = [];

  subscribe(handler: EventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  publish(event: SecurityEvent): void {
    this.eventLog.push(event);
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  getEvents(filter?: { environmentId?: string; experimentId?: string; since?: Date }): SecurityEvent[] {
    let events = [...this.eventLog];
    if (filter?.environmentId) {
      events = events.filter(e => e.environmentId === filter.environmentId);
    }
    if (filter?.experimentId) {
      events = events.filter(e => e.experimentId === filter.experimentId);
    }
    if (filter?.since) {
      events = events.filter(e => e.timestamp >= filter.since!);
    }
    return events;
  }

  clear(environmentId?: string): void {
    if (environmentId) {
      this.eventLog = this.eventLog.filter(e => e.environmentId !== environmentId);
    } else {
      this.eventLog = [];
    }
  }
}
