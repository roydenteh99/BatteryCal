import { test } from 'node:test';
import assert from 'node:assert';
import { Charger } from './Charger.js';
import { Battery } from './SimplerBattery.js';
import { Event } from './Event.js';

test('Testing Charger Class get properties and constructor', () => {
    // A new charger is created with an ID
    const charger = new Charger("charger1");
    
    // The charger should remember its ID
    assert.equal(charger.getId(), "charger1");
    
    // Initially, the charger is in READY state (no battery being charged)
    assert.equal(charger.getState(), Charger.State.READY, "Expected charger state mismatch");
    
    // A new charger has no battery in its slot yet
    assert.equal(charger.batterySlot, null, "Expected battery slot to be null initially");
    
    // When READY, the charger is available for use
    assert.equal(charger.checkAvail(), true, "Expected charger to be available");
});

test('Testing Charger Class createStartEvent', () => {
    // Set up a charger and a battery ready to be charged
    const charger = new Charger("charger2");
    const battery = new Battery("battery1", { maxFlightTime: 2, chargeTime: 1, chargePercent: 0, battSwapDuration: 0.1 });
    // When the charger starts charging a battery, it creates events at midnight
    // Duration is set to 0.5 hours (30 minutes) to charge the battery partway
    const startEvents = charger.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 0.5 });
    // console.log(startEvents);
    
    // Two events should be created: one from the charger and one from the battery
    assert.equal(startEvents.length, 2, "Expected two events to be created");
    
    // The first event should be from the charger, marking the start of charging
    const chargerStartEvent = startEvents[0];
    assert.equal(chargerStartEvent.emitterId, "charger2");
    assert.equal(chargerStartEvent.eventName, "Start Charge", "Expected charger start event name mismatch");
    assert.equal(chargerStartEvent.eventType, Event.EventType.CHARGER, "Expected event type mismatch");
    
    // After starting, the battery should be installed in the charger's battery slot
    assert.equal(charger.batterySlot, battery, "Expected battery to be installed in charger");
    
    // Once charging starts, the charger is no longer READY (it's busy charging)
    assert.equal(charger.getState(), Charger.State.NOT_READY, "Expected charger state to be NOT_READY");
    assert.equal(charger.checkAvail(), false, "Expected charger to be unavailable");

    // Battery should have change state to CHARGING
    assert.equal(battery.getState(), Battery.State.CHARGING, "Expected battery state to be CHARGING");
});

test('Testing Charger Class getNextEvent for START to END charge', () => {
    // Set up a charger with a dead battery that needs 1 hour to fully charge
    const charger = new Charger("charger3");
    const battery = new Battery("battery2", { maxFlightTime: 2, chargeTime: 1, chargePercent: 0, battSwapDuration: 0.1 });
    // Begin charging at midnight for 30 minutes (0.5 hours)
    const startEvents = charger.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 0.5 });
    const chargerStartEvent = startEvents[0];
    
    // Process the start event to generate the end charge event
    const endChargeEvents = charger.getNextEvent(chargerStartEvent);
    assert.equal(endChargeEvents.length, 1, "Expected one event from processing start charge");
    
    // The end charge event should be scheduled for 30 minutes later (12:30 AM)
    const endChargeEvent = endChargeEvents[0];
    assert.equal(endChargeEvent.eventName, "End Charge", "Expected end charge event name mismatch");
    assert.equal(endChargeEvent.getTimeDisplay(), "12:30:00 AM", "Expected end charge event time mismatch");
    assert.equal(endChargeEvent.emitterId, "charger3", "Expected end charge event emitter mismatch");
    
    // Before the charging ends, the charger is still NOT_READY
    assert.equal(charger.getState(), Charger.State.NOT_READY, "Expected charger to still be NOT_READY before processing end event");
    
    // Process the end charge event to mark charging as complete
    const nextEvents = charger.getNextEvent(endChargeEvent);
    assert.equal(nextEvents.length, 2, "Expected two events from processing end charge");
    
    // After charging completes, the charger returns to READY state
    assert.equal(charger.getState(), Charger.State.READY, "Expected charger state to be READY after charging");
    assert.equal(charger.checkAvail(), true, "Expected charger to be available after charging");
    
    // The battery should have received an end charge event from the battery
    const batteryEndChargeEvent = nextEvents.find(event => event.eventType === Event.EventType.BATTERY);
    assert.equal(batteryEndChargeEvent.emitterId, "battery2", "Expected battery event emitter mismatch");
    // problem here , battery charger percent becomes null after charging complete

    assert.equal(battery.getAvailFlightTime(), 1, "Expected battery available flight time mismatch after charging");
});

test('Testing Charger Class prematureEndCharge', () => {
    // Set up a charger with a battery that's scheduled to charge for 1 hour
    const charger = new Charger("charger4");
    const battery = new Battery("battery3", { maxFlightTime: 2, chargeTime: 1, chargePercent: 0, battSwapDuration: 0.1 });
    
    // Begin charging at midnight for 1 hour
    const startEvents = charger.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    const chargerStartEvent = startEvents[0];
    
    // Process the start event to create the end charge event (scheduled for 1 AM)
    charger.getNextEvent(chargerStartEvent);
    
    // If we need to stop charging early, we can change the end time to 30 minutes (12:30 AM)
    const newEndTime = new Date(2026, 0, 1, 0, 30);
    charger.prematureEndCharge(newEndTime);
    
    // The end charge event should now be scheduled for 12:30 AM instead of 1 AM
    assert.equal(charger.endChargeEvent.getTimeDisplay(), "12:30:00 AM", "Expected premature end charge time mismatch");
});


test('Testing Charger Class with multiple charge cycles', () => {
    // Set up a charger that will handle multiple batteries in sequence
    let eventlist = [];
    const charger = new Charger("charger6");
    const battery1 = new Battery("battery5", { maxFlightTime: 1, chargeTime: 0.5, chargePercent: 0, battSwapDuration: 0.1 });
    let iteration_limit = 10;
    // First charge cycle: charge battery1 for 15 minutes starting at midnight
    const startEvents1 = charger.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery: battery1, duration: 0.25 });
    console.log("Start Events for Battery 1:", startEvents1);
    eventlist.push(...startEvents1);

    function processNextEventProto(event) {
        let eventType = event.eventType;
        console.log(`Processing event: ${event.eventName} from ${event.emitterId} at ${event.getTimeDisplay()} of type ${eventType}`);
        if (eventType === Event.EventType.Charger) {
            const nextEvents = charger.getNextEvent(event);
            return nextEvents;
        } else if (eventType === Event.EventType.BATTERY) {
            const nextEvents = battery1.getNextEvent(event);
            return nextEvents;
        }
    }

    function sortEvents(events) {
        const eventTypePriority = { [Event.EventType.BATTERY]: 1, [Event.EventType.DRONE]: 1, [Event.EventType.CHARGER]: 1, [Event.EventType.TRANSIT]: 2 };
        return events.sort((a, b) => {
            if (a.time.getTime() === b.time.getTime()) {
                return eventTypePriority[a.eventType] - eventTypePriority[b.eventType];
            }
            return a.time.getTime() - b.time.getTime();
        });
    } 
    
    while (eventlist.length > 0 && iteration_limit > 0) {
        iteration_limit--;
        // Process the start event to generate the end event
        const nextEvents = processNextEventProto(sortEvents(eventlist).shift());
        console.log("next Events  :" ,nextEvents);
        if (nextEvents.length >0) {
            eventlist.push(...nextEvents);
        }
    }

});

// Command to run single test: node --test Charger.test.js
// Command to run all tests: node --test
