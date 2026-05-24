import { test } from 'node:test';
import assert from 'node:assert';
import { Drone } from './Drone.js'; // whatever class you want to test, import it here
import { Event } from './Event.js';
import { Battery } from './SimplerBattery.js';
//import { User } from './User.js'; whatever class you want to test, import it here



test('Testing Drone Class getNextEvent for unhandled events returns empty array', () => {
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightTime: 1 });
    
    // Create a random event that drone doesn't handle
    const randomEvent = new Event(new Date(2026, 0, 1, 0, 0), "unknown", "UNKNOWN_EVENT", Event.EventType.TRANSIT);
    
    // Should return empty array for unhandled events
    const result = drone.getNextEvent(randomEvent);
    assert.deepStrictEqual(result, [], "Expected getNextEvent to return an empty array for unhandled events");
});

test("Testing Drone Class get properties and constructor", () => {
    const drone = new Drone("drone7", { coolDownTime: 0.1, maxFlightTime: 1 });
    assert.strictEqual(drone.getId(), "drone7", "Expected drone ID mismatch");
    assert.strictEqual(drone.getState(), Drone.DroneState.READY, "Expected drone state mismatch");
});

test('Testing Drone Class createStartEvent and ', () => {
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightTime: 1 });
    const battery = new Battery("battery6", { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 });
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    assert.strictEqual(startEvents.length, 2, "Expected two events to be created");
});

test('Testing Drone Class getNextEvent for START_FLIGHT to END_FLIGHT with cool down', () => {
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightTime: 1 });
    const battery = new Battery("battery6", { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 });
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    const sortedmapStartEvents = startEvents.map(event => { return  event.getTimeDisplay() + "-" + event.eventName ; }).sort((a,b) => a.localeCompare(b));
    assert.deepStrictEqual(sortedmapStartEvents, ["12:00:00 AM-Start Flight", "12:00:00 AM-Start Use"], "Expected start events mismatch");
    const endFlightEvent = drone.getNextEvent(startEvents.find(event => event.eventName === "Start Flight"))[0];
    assert.equal(drone.getFlightTimeSinceCoolDown(), 0, "Expected flight time since cool down to be 0 before processing End Flight event");
    assert.equal(endFlightEvent.eventName, "End Flight", "Expected End Flight event name mismatch");

    const nextEvents = drone.getNextEvent(endFlightEvent);
    const coolDownEvent = nextEvents.find(event => event.eventName === "Start Cool");
    assert.equal(coolDownEvent.emitterId, "drone8");
    assert.equal(coolDownEvent.eventName, "Start Cool", "Expected Start Cool event name mismatch");
    assert.equal(drone.getFlightTimeSinceCoolDown(), 1, "Expected flight time since cool down to be 1 after processing End Flight event");
    const endUseEvent = nextEvents.find(event => event.eventName === "End Use");
    assert.equal(endUseEvent.emitterId, "battery6");
    assert.equal(endUseEvent.eventName, "End Use", "Expected End Use event name mismatch");
    

    const endCoolEvent = drone.getNextEvent(coolDownEvent)[0];
    assert.equal(endCoolEvent.eventName, "End Cool", "Expected End Cool event name mismatch");


    const endEvent = drone.getNextEvent(endCoolEvent)[0];
    assert.equal(endEvent.eventName, "End", "Expected End event name mismatch");
    assert.equal(drone.getFlightTimeSinceCoolDown(), 0, "Expected flight time since cool down to be 0 after processing End Cool event");
    // TO BE CONTINUED IN THE FUTURE: We would need to simulate the passage of time and the events being processed to fully test the transition from START_FLIGHT to END_FLIGHT and then to START_COOL and END_COOL. This would involve creating a simple event loop or scheduler to process the events in order and check the state of the drone at each step.
});






test('Testing Drone Class removeBattery', () => {
    const drone = new Drone("drone9", { coolDownTime: 0.1, maxFlightTime: 1 });
    const battery = new Battery("battery7", { maxFlightTime: 2, chargeTime: 1, chargePercent: 100, battSwapDuration: 0.5 });
    
    // Install battery
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    assert.equal(drone.batterySlot, battery, "Expected battery to be installed");
    
    // Remove battery
    drone.removeBattery();
    assert.equal(drone.batterySlot, null, "Expected battery slot to be null after removal");
});

// Command to run single test: node --test Drone.test.js
// Command to run all tests: node --test