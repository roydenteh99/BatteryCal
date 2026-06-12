import { test } from 'node:test';
import assert from 'node:assert';
import { Drone } from './Drone.js'; // whatever class you want to test, import it here
import { Event } from './Event.js';
import { Battery } from './SimplerBattery.js';
//import { User } from './User.js'; whatever class you want to test, import it here



test('Testing Drone Class getNextEvent for unhandled events returns empty array', () => {
    // A new drone is created with some specifications
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });
    
    // Create a random event that drone doesn't handle
    const randomEvent = new Event(new Date(2026, 0, 1, 0, 0), "unknown", "UNKNOWN_EVENT", Event.EventType.TRANSIT);
    
    // When the drone receives an event it doesn't recognize, it should return an empty array
    const result = drone.getNextEvent(randomEvent);
    assert.deepStrictEqual(result, [], "Expected getNextEvent to return an empty array for unhandled events");
});

test("Testing Drone Class get properties and constructor", () => {
    // A new drone is created with an ID and configuration
    const drone = new Drone("drone7", { coolDownTime: 0.1, maxFlightDuration: 1 });
    
    // The drone should remember its ID
    assert.strictEqual(drone.getId(), "drone7", "Expected drone ID mismatch");
    
    // Initially, the drone is in READY state (hasn't been used yet)
    assert.strictEqual(drone.getState(), Drone.State.READY, "Expected drone state mismatch");
});

test('Testing Drone Class createStartEvent', () => {
    // A new drone is created with a fully charged battery
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });
    const battery = new Battery("battery6", { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 });
    
    // When starting a flight, the drone creates a pair of events: one for the drone and one for the battery
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    
    // Two events should be created: "Start Flight" from the drone and "Start Use" from the battery
    assert.strictEqual(startEvents.length, 2, "Expected two events to be created");
});

test('Testing Drone Class getNextEvent for START_FLIGHT -> END_FLIGHT -> START_COOL -> END_COOL -> END -> TRANSIT', () => {
    // Set up a drone with a fully charged battery, ready to fly for 1 hour with 0.1 hour cool down
    const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });
    const battery = new Battery("battery6", { maxFlightDuration: 1, chargeTime: 1, chargePercent: 100 });
    
    // Create the starting events when flight begins at midnight
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    const sortedmapStartEvents = startEvents.map(event => { return  event.getTimeDisplay() + "-" + event.eventName ; }).sort((a,b) => a.localeCompare(b));
    
    // Both events should occur at exactly 12:00:00 AM: one for starting the flight, one for battery usage
    assert.deepStrictEqual(sortedmapStartEvents, [
        new Date(2026, 0, 1, 0, 0).toLocaleTimeString() + "-Start Flight", 
        new Date(2026, 0, 1, 0, 0).toLocaleTimeString() + "-Start Use"
        ], "Expected start events mismatch");
    
    // Process the "Start Flight" event to generate the "End Flight" event after 1 hour of flying
    const endFlightEvent = drone.getNextEvent(startEvents.find(event => event.eventName === "Start Flight"))[0];
    assert.equal(drone.getState(), Drone.State.IN_USE, "Expected drone state to be IN_USE after processing Start Flight event");
    
    // Before the flight ends, the drone has not accumulated any cool down time
    assert.equal(drone.getFlightTimeSinceCoolDown(), 0, "Expected flight time since cool down to be 0 before processing End Flight event");
    assert.equal(endFlightEvent.eventName, "End Flight", "Expected End Flight event name mismatch");
    assert.equal(endFlightEvent.getTimeDisplay(), new Date(2026, 0, 1, 1, 0).toLocaleTimeString(), "Expected End Flight event time mismatch");

    // When the flight ends, the drone needs to cool down
    const nextEvents = drone.getNextEvent(endFlightEvent);
    const coolDownEvent = nextEvents.find(event => event.eventName === "Start Cool");
    
    // The cool down event should come from the drone itself
    assert.equal(coolDownEvent.emitterId, "drone8");
    assert.equal(coolDownEvent.eventName, "Start Cool", "Expected Start Cool event name mismatch");
    
    // After the flight ends, the drone has accumulated 1 hour of flight time since the last cool down
    assert.equal(drone.getFlightTimeSinceCoolDown(), 1, "Expected flight time since cool down to be 1 after processing End Flight event");
    
    // The battery also generates an "End Use" event to mark when it stops being used
    const endUseEvent = nextEvents.find(event => event.eventName === "End Use");
    assert.equal(endUseEvent.emitterId, "battery6");
    assert.equal(endUseEvent.eventName, "End Use", "Expected End Use event name mismatch");

    // After cool down starts, it eventually ends (cool down duration is 0.1 hours = 6 minutes)
    const endCoolEvent = drone.getNextEvent(coolDownEvent)[0];
    assert.equal(drone.getState(), Drone.State.COOLING_DOWN, "Expected drone state to be COOLING_DOWN after processing Start Cool event");
    assert.equal(endCoolEvent.getTimeDisplay(), new Date(2026, 0, 1, 1, 6).toLocaleTimeString(), "Expected End Cool event time mismatch");
    assert.equal(endCoolEvent.eventName, "End Cool", "Expected End Cool event name mismatch");

    // After cool down ends, a final "End" event marks the completion of the entire flight cycle
    const endEvent = drone.getNextEvent(endCoolEvent)[0];
    assert.equal(endEvent.eventName, "End", "Expected End event name mismatch");
    // After cool down completes, the flight time counter resets to 0
    assert.equal(drone.getFlightTimeSinceCoolDown(), 0, "Expected flight time since cool down to be 0 after processing End Cool event");
    
    // Finally, the drone generates a "DRONE_SOURCE_BATT" event to indicate the drone is looking for a new battery source after the flight cycle is complete
    const transitEvent = drone.getNextEvent(endEvent)[0];
    assert.equal(drone.getState(), Drone.State.READY, "Expected drone state to be READY after processing End Cool event");

    assert.equal(transitEvent.eventName, "DRONE_SOURCE_BATT", "Expected DRONE_SOURCE_BATT event name mismatch");


});



test('Testing Drone Class removeBattery', () => {
    // Set up a drone with a fully charged battery
    const drone = new Drone("drone9", { coolDownTime: 0.1, maxFlightDuration: 1 });
    const battery = new Battery("battery7", { maxFlightTime: 2, chargeTime: 1, chargePercent: 100});
    
    // When the drone starts a flight, it installs the battery in its battery slot
    const startEvents = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 1 });
    assert.equal(drone.batterySlot, battery, "Expected battery to be installed");
    
    // After removing the battery from the drone, the battery slot should be empty
    drone.removeBattery();
    assert.equal(drone.batterySlot, null, "Expected battery slot to be null after removal");
});



test('Loading Batt duration', () => {
    // set drone cool down time to be 0.1 hours (6 minutes) and loading battery duration to be 0.05 hours (3 minutes) and its max flight duration to be 1 hour
    const drone = new Drone("drone9", { coolDownTime: 0.1, maxFlightDuration: 1 , loadingBatteryDuration: 0.05 });
    
    // set up a fully charged battery that can fly for 2 hours, but we will only fly for 0.5 hours to test the loading battery duration
    const battery = new Battery("battery7", { maxFlightTime: 2, chargeTime: 1, chargePercent: 100});
    // start a flight for 0.5 hours , due to loading battery duration of 0.05 hours, the start flight event should be at 12:00:03 AM
    const startEvent = drone.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery, duration: 0.5 }).find(event => event.eventName === "Start Flight");
    assert.equal(startEvent.getTimeDisplay(), new Date(2026, 0, 1, 0, 3).toLocaleTimeString(), "Expected Start Flight event time mismatch");
    // after flying for 0.5 hours, the end flight event should be at 12:30:03 AM (0.5 hours of flight time + 0.05 hours of loading battery duration)
    const endFlightEvent = drone.getNextEvent(startEvent)[0];
    assert.equal(endFlightEvent.eventName, "End Flight", "Expected End Flight event name mismatch");
    assert.equal(endFlightEvent.getTimeDisplay(), new Date(2026, 0, 1, 0, 33).toLocaleTimeString(), "Expected End Flight event time mismatch with loading battery duration");
    // after the flight ends , since the duration of flight is < max flight duration , drone does not goes into cool down and thus proceed to end event after loading battery duration of 0.05 hours and thus the end event should be at 12:36:03 AM
    const endEvent = drone.getNextEvent(endFlightEvent).find(event => event.getEventType() === Event.EventType.DRONE);
    assert.equal(endEvent.eventName, "End", "Expected End event name mismatch");
    assert.equal(endEvent.getTimeDisplay(), new Date(2026, 0, 1, 0, 36).toLocaleTimeString(), "Expected End event time mismatch with loading battery duration");


    const droneA =new Drone("droneA", { coolDownTime: 0.02, maxFlightDuration: 0.5 , loadingBatteryDuration: 0.05 });
    // set up a fully charged battery that can fly for 2 hours, but we will only fly for 0.5 hours to test the loading battery duration
    const batteryA = new Battery("battery8", { maxFlightTime: 2, chargeTime: 1, chargePercent: 100});
    // start a flight for 0.5 hours , due to loading battery duration of 0.05 hours, the start flight event should be at 12:00:03 AM
    const startEventA = droneA.createStartEvent(new Date(2026, 0, 1, 0, 0), { battery: batteryA, duration: 0.5 }).find(event => event.eventName === "Start Flight");
    assert.equal(startEventA.getTimeDisplay(), new Date(2026, 0, 1, 0, 3).toLocaleTimeString(), "Expected Start Flight event time mismatch");
    // after flying for 0.5 hours, the end flight event should be at 12:30:03 AM (0.5 hours of flight time + 0.05 hours of loading battery duration)
    const endFlightEventA = droneA.getNextEvent(startEventA)[0];
    assert.equal(endFlightEventA.eventName, "End Flight", "Expected End Flight event name mismatch");
    assert.equal(endFlightEventA.getTimeDisplay(), new Date(2026, 0, 1, 0, 33).toLocaleTimeString(), "Expected End Flight event time mismatch with loading battery duration");
    // after the flight ends , since the duration of flight is = max flight duration , drone goes into cool down and thus proceed to start cool event after loading battery duration of 0.05 hours and thus the start cool event should be at 12:36:03 AM
    const startCoolEventA = droneA.getNextEvent(endFlightEventA).find(event => event.eventName === "Start Cool");
    assert.equal(startCoolEventA.eventName, "Start Cool", "Expected Start Cool event name mismatch");
    assert.equal(startCoolEventA.getTimeDisplay(), new Date(2026, 0, 1, 0, 33).toLocaleTimeString(), "Expected Start Cool event time mismatch with loading battery duration");
    // after cool down starts , given that is loading battery duration is > cool down duration, 
    // thus the end cool event  will simply  take the longer loading battery duration of 0.05 hours 
    // where the cooling duration would be over in between the loading battery duration
    // the end cool event should be at 12:36:00 AM
    const endCoolEventA = droneA.getNextEvent(startCoolEventA)[0];
    assert.equal(endCoolEventA.eventName, "End Cool", "Expected End Cool event name mismatch");
    assert.equal(endCoolEventA.getTimeDisplay(), new Date(2026, 0, 1, 0, 36).toLocaleTimeString(), "Expected End Cool event time mismatch with loading battery duration");
}) 

// Command to run single test: node --test Drone.test.js
// Command to run all tests: node --test