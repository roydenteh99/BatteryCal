import { Event } from "./Event.js";
import { test } from 'node:test';
import assert from 'node:assert';

test('Event initialization', () => {
    const additionalInfo = { timeTaken: 2 };
    const initialEvent = new Event("2026-01-01 09:00", "blank", "nothing", Event.EventType.TRANSIT, additionalInfo);
        assert.strictEqual(initialEvent.emitterId, "blank");
        assert.strictEqual(initialEvent.eventName, "nothing");
        assert.strictEqual(initialEvent.eventType, Event.EventType.TRANSIT);
        assert.strictEqual(initialEvent.addInfo.timeTaken,2 );

});

test('Event changeTime method', () => {
    const initialEvent = new Event("2026-01-01 09:00", "blank", "nothing", Event.EventType.TRANSIT);
    const newTime = new Date("2026-01-01 10:00");
    initialEvent.changeTime(newTime);
    assert.strictEqual(initialEvent.time.getTime(), newTime.getTime());
});

test ('List of events to be sorted by time', () => {
    const event1 = new Event("2026-01-01 08:00", "1", "nothing", Event.EventType.TRANSIT);
    const event2 = new Event("2026-01-01 09:00", "2", "nothing", Event.EventType.TRANSIT);
    const event3 = new Event("2026-01-01 10:00", "3", "nothing", Event.EventType.TRANSIT);
    const events = [event3, event2, event1];
    events.sort((a, b) => a.time - b.time);
    const eventIds = events.map((event) => event.emitterId);
    assert.deepStrictEqual(eventIds, ["1", "2", "3"]);
});

// Command to run single test: node --test Event.test.js