class EventQueue {
  constructor(startTime = "2026-01-01 09:00") {
    this.events = [];
    this.currentTime = new Date(startTime);
  }

  // Adds an event and advances the "cursor" of time
  addEvent(label, durationMinutes, metadata = "") {
    const start = new Date(this.currentTime);
    this.currentTime.setMinutes(this.currentTime.getMinutes() + durationMinutes);
    const end = new Date(this.currentTime);

    const event = { label, start, end, metadata };
    this.events.push(event);
    return event;
  }

  getSequence() {
    return this.events.map(e => ({
      Task: e.label,
      Start: e.start.toLocaleString(),
      End: e.end.toLocaleString(),
      Info: e.metadata
    }));
  }
}

// to sort events by time and then by type battery,drone,charger event to precede traansit events
function sortEvents(events) {
  const eventTypePriority = { [Event.EventType.BATTERY]: 1, [Event.EventType.DRONE]: 1, [Event.EventType.CHARGER]: 1, [Event.EventType.TRANSIT]: 2 };
  return events.sort((a, b) => {
    if (a.time.getTime() === b.time.getTime()) {
      return eventTypePriority[a.eventType] - eventTypePriority[b.eventType];
    }
    return a.time.getTime() - b.time.getTime();
  });
} 