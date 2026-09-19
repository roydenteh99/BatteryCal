const DEFAULT_EVENT_PAIRS = {
  'Start Flight': 'End Flight',
  'Start Cool': 'End Cool',
  'Start Use': 'End Use',
  'Start Charge': 'End Charge'
};

export class EventSorter {
  constructor(eventPairs = DEFAULT_EVENT_PAIRS) {
    this.eventPairs = eventPairs;
    this.endEvents = new Set(Object.values(eventPairs));
  }

  sortByItem(events) {
    const items = new Map();

    for (const event of events) {
      const itemId = this.getValue(event, 'emitterId');
      if (!items.has(itemId)) {
        items.set(itemId, []);
      }
      items.get(itemId).push(event);
    }

    return Array.from(items, ([itemId, itemEvents]) => ({
      itemId,
      events: this.createTimelineEvents(itemEvents)
    }));
  }

  createTimelineEvents(events) {
    const pending = new Map();
    const timeline = [];

    for (const event of this.sortEvents(events)) {
      const eventName = this.getValue(event, 'eventName');
      const eventTime = this.getEventTime(event);

      if (this.eventPairs[eventName]) {
        const pendingEvents = pending.get(eventName) || [];
        pendingEvents.push({ event, eventTime });
        pending.set(eventName, pendingEvents);
        continue;
      }

      const startName = this.findStartEvent(eventName);
      if (!startName) {
        continue;
      }

      const pendingEvents = pending.get(startName) || [];
      const start = pendingEvents.shift();
      if (!start) {
        continue;
      }

      timeline.push({
        eventName: startName,
        startTime: start.eventTime,
        endTime: eventTime
      });
      pending.set(startName, pendingEvents);
    }

    for (const [eventName, pendingEvents] of pending) {
      for (const { eventTime } of pendingEvents) {
        timeline.push({
          eventName,
          startTime: eventTime,
          endTime: null
        });
      }
    }

    return timeline.sort((left, right) => left.startTime - right.startTime);
  }

  toSheetRows(events) {
    return this.sortByItem(events).flatMap(({ itemId, events: itemEvents }) =>
      itemEvents.map(({ eventName, startTime, endTime }) => [
        itemId,
        eventName,
        startTime,
        endTime
      ])
    );
  }

  sortEvents(events) {
    return events
      .map((event, index) => ({ event, index }))
      .sort((left, right) => {
        const timeDifference = this.getEventTime(left.event) - this.getEventTime(right.event);
        return timeDifference || left.index - right.index;
      })
      .map(({ event }) => event);
  }

  findStartEvent(endEventName) {
    return Object.keys(this.eventPairs).find(
      (startEventName) => this.eventPairs[startEventName] === endEventName
    );
  }

  getEventTime(event) {
    const value = this.getValue(event, 'timestamp', this.getValue(event, 'time'));
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('EventSorter: event has an invalid time');
    }
    return date;
  }

  getValue(event, propertyName, fallback = undefined) {
    if (typeof event[propertyName] === 'function') {
      return event[propertyName]();
    }
    return event[propertyName] ?? fallback;
  }
}