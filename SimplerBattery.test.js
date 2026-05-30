import { test } from 'node:test';
import assert from 'node:assert';
import { Battery } from './SimplerBattery.js'; // whatever class you want to test, import it here
import { Event } from './Event.js';

test('Testing Battery Class get Properties and constructor', () => {
    // A new battery is created with some specifications
    const battery = new Battery("battery1", { maxFlightTime: 2, chargeTime: 1, chargePercent: 50, battSwapDuration: 0.5 }); // id, maxFlightTime, chargeTime, chargePercent, battSwapDuration
    
    // The battery should remember its ID
    assert.equal(battery.getId(), "battery1");
    
    // Initially, the battery is ready to be used thus the Ready state (hasn't been used yet)
    assert.equal(battery.getState(), Battery.State.READY, "Expected battery state mismatch");
    
    // The battery is at 50% charge, so it can only fly for half its max time (50% of 2 hours = 1 hour)
    assert.equal(battery.getAvailFlightTime(), 1, "Expected available flight time mismatch");
    

});

test('Testing Battery Class createStartUseEvent and createStartChargeEvent', () => {
    // Start with a fresh battery at 50% charge
    const battery = new Battery("battery2", { maxFlightTime: 2, chargeTime: 1, chargePercent: 50, battSwapDuration: 0.5 });
    
    // The drone is launched at midnight, battery starts being used
    // Arbitrarily the tim is set to January 1, 2026, 00:00 for consistency in testing
    const startUseEvent = battery.createStartUseEvent(new Date(2026, 0, 1, 0, 0))[0];
    
    // An event is created to mark the start of battery usage
    // The event should have the correct emitter ID, type, and name
    assert.equal(startUseEvent.emitterId, "battery2");
    assert.equal(startUseEvent.eventType, Event.EventType.BATTERY, "Expected start use event type mismatch");
    assert.equal(startUseEvent.eventName, Battery.EventName.START_USE, "Expected start use event name mismatch");
    
    // The battery's state immediately changes from READY to IN_USE
    assert.equal(battery.getState(), Battery.State.IN_USE, "Expected start use battery state mismatch");
    
    // An hour later, the drone lands and we plug the battery in to charge at 1 AM
    const startChargeEvent = battery.createStartChargeEvent(new Date(2026, 0, 1, 1, 0))[0];
    
    // A new event records when charging begins
    assert.equal(startChargeEvent.emitterId, "battery2");
    assert.equal(startChargeEvent.eventType, Event.EventType.BATTERY, "Expected start charge event type mismatch");
    assert.equal(startChargeEvent.eventName, Battery.EventName.START_CHARGE, "Expected start charge event name mismatch");
    
    // The battery's state changes from IN_USE to CHARGING
    assert.equal(battery.getState(), Battery.State.CHARGING, "Expected start charge battery state mismatch");
});

test('Testing Battery Class getNextEvent for END_USE and END', () => {
    // A battery starts at 50% charge and can fly for 2 hours when fully charged
    const battery = new Battery("battery2", { maxFlightTime: 2, chargeTime: 1, chargePercent: 50, battSwapDuration: 0.1 });
    
    // The drone flies for exactly 1 hour and then stops at midnight
    const endUseEvent = battery.createEndUseEvent(new Date(2026, 0, 0, 0, 0), battery.getAvailFlightTime())[0]; // useDuration of 1 hour
    assert.equal(endUseEvent.getTimeDisplay(), "12:00:00 AM", "Expected End Use Event time mismatch");
    
    // After stopping, there's one more event: the battery swap/cleanup
    const nextEvents = battery.getNextEvent(endUseEvent);
    assert.equal(nextEvents.length, 1);
    const endEvent = nextEvents[0];
    
    // The swapping takes 6 minutes (battSwapDuration of 0.1 hours), so it finishes at 12:06 AM
    assert.equal(endEvent.getTimeDisplay(), new Date(2026, 0, 0, 0, 0).toLocaleTimeString(), "Expected End Event time mismatch");
    
    // After using the battery for 1 hour at 50% charge (which is its max available time), it's completely drained
    assert.equal(battery.getAvailFlightTime(), 0 , "Expected available flight time mismatch");
    assert.equal(endEvent.emitterId, "battery2");
    
    // When the swap/cleanup is done, the battery is officially FLAT (dead)
    battery.getNextEvent(endEvent);
    assert.equal(battery.getState(), Battery.State.FLAT, "Expected battery state mismatch");

});

test('Testing Battery Class getNextEvent for END_CHARGE and END', () => {
    // A battery starts at 50% charge and needs 1 hour to fully charge from empty
    const battery = new Battery("battery3", { maxFlightTime: 2, chargeTime: 1, chargePercent: 50, battSwapDuration: 0.1 });
    
    // We start charging at midnight, and it takes 30 minutes (half the charge time) to reach 100%
    const endChargeEvent = battery.createEndChargeEvent(new Date(2026, 0, 0, 0, 0), battery.getChargeTimeTillFull())[0];
    assert.equal(endChargeEvent.getTimeDisplay(), new Date(2026, 0, 0, 0, 0).toLocaleTimeString(), "Expected End Charge Event time mismatch");
    
    // After charging is complete, there's one more event: the battery swap/cleanup
    const nextEvents = battery.getNextEvent(endChargeEvent);
    assert.equal(nextEvents.length, 1);
    const endEvent = nextEvents[0];
    
    // The swapping time to be read and handled by battery handler
    assert.equal(endEvent.getTimeDisplay(), new Date(2026, 0, 0, 0, 0).toLocaleTimeString(), "Expected End Event time mismatch");
    
    // Now fully charged, the battery can fly for its entire 2-hour maximum
    assert.equal(battery.getAvailFlightTime(), 2 , "Expected available flight time mismatch");
    assert.equal(endEvent.emitterId, "battery3");
    
    // After the swapping is complete, the battery is back to READY status
    battery.getNextEvent(endEvent);
    assert.equal(battery.getState(), Battery.State.READY, "Expected battery state mismatch");
});

test('Testing getNextEvent receives an event that it does not handle, it should return an empty array ', () => {
    const battery = new Battery("battery4", { maxFlightTime: 2, chargeTime: 1, chargePercent: 50, battSwapDuration: 0.1 }); 
    
    // The drone is launched at midnight, battery starts being used
    // Arbitrarily the tim is set to January 1, 2026, 00:00 for consistency in testing
    const startUseEvent = battery.createStartUseEvent(new Date(2026, 0, 1, 0, 0))[0];
    const eventList = [].concat(battery.getNextEvent(startUseEvent));
    assert.deepStrictEqual(eventList, [], "Expected getNextEvent to return an empty array for unhandled events");
});

// Command to run single test: node --test SimplerBattery.test.js
// Command to run all tests: node --test