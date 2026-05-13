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