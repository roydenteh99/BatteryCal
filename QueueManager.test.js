import { test } from 'node:test';
import assert from 'node:assert';
import { EventQueue } from './QueueManager.js';
import { Drone } from './Drone.js';
import { Battery } from './SimplerBattery.js';
import { Charger } from './Charger.js';
// Creating Drone instance for testing
const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });

function createDroneList(count, template = null) {
    const drones = [];
    for (let i = 0; i < count; i++) {
        if (template) {
            drones.push(new Drone(`drone${i}`, template));
        } else {
            drones.push(new Drone(`drone${i}`));
        }
    }
    return drones;
}

function createChargerList(count) {
    const chargers = [];
    for (let i = 0; i < count; i++) {
        chargers.push(new Charger(`charger${i}`));
    }
    return chargers;
}

function createBatteryList(count, template) {
    const batteries = [];
    for (let i = 0; i < count; i++) {
        batteries.push(new Battery(`battery${i}`, template));
    }
    return batteries;
}


// first test case for EventQueue Initialization
test('EventQueue initialization', () => {
  const queue = new EventQueue(
    '2026-01-01 09:00',
    '2026-01-01 12:00',
    [new Drone('drone-1', { maxFlightDuration: 2, loadingBatteryDuration: 0.1 })],
    [],
    []
  );
  const drone = queue.droneList[0];
  assert.doesNotThrow(() => queue.droneSourceBatt(drone));
});


// Creating Batteries instance for testing
const batteryTemplate1 = { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 }
var batteryList = createBatteryList(4, batteryTemplate1);

const droneTemplate1 = { coolDownTime: 0.1, loadingBatteryDuration: 0.1, maxFlightDuration: 1 }
var droneList = createDroneList(2, droneTemplate1);

// 2nd test for EventQueue Drone Source Battery Initialization (Battery and Drone only)
test('EventQueue drone & battery simulation ', () => {
    const queue = new EventQueue(
        '2026-01-01 09:00',
        '2026-01-01 12:00',
        droneList,
        batteryList,
        []
    );
    queue.startWithDroneSourceBattEvent();
    queue.startCycle();
    const sequence = queue.getSequence();

// Extract just the event names for drone0
    const drone0Lifecycle = sequence
        .filter(e => e.emitterId === 'drone0')
        .map(e => e.eventName);

    // Define the exact sequence of events a single drone should experience over 2 cycles
    const expectedLifecycle = [
        'DRONE_SOURCE_BATT', // Initial request
        'Start Flight', 
        'End Flight', 
        'Start Cool', 
        'End Cool', 
        'End', 
        'DRONE_SOURCE_BATT', // Second request
        'Start Flight', 
        'End Flight', 
        'Start Cool', 
        'End Cool', 
        'End', 
        'DRONE_SOURCE_BATT'  // Final request before 12:00 PM cutoff
    ];

    assert.deepStrictEqual(drone0Lifecycle, expectedLifecycle, "Drone0 did not follow the expected lifecycle");
})


const batteyTemplate2 = { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 }
var batteryList2 = createBatteryList(3, batteyTemplate2);

var droneList2 = createDroneList(2);
var chargerList2 = createChargerList(1);

// 3rd test for EventQueue Drone Source Battery Initialization (Battery, Drone and Charger)
test('EventQueue drone & battery & charger simulation ', () => {
    const queue = new EventQueue(
        '2026-01-01 09:00',
        '2026-01-01 12:00',
        droneList2,
        batteryList2,
        chargerList2
    );
    queue.startWithDroneSourceBattEvent();
    queue.startCycle();

    const chargerLifecycle = queue.getSequence()
        .filter(event => event.emitterId === 'charger0')
        .map(event => event.eventName);

    const expectedChargerLifecycle = [
        'Start Charge',
        'End Charge',
        'Start Charge',
        'CHARGER_SOURCE_BATT',
        'End Charge'
    ];

    assert.deepStrictEqual(
        chargerLifecycle,
        expectedChargerLifecycle,
        'Charger did not follow the expected lifecycle'
    );
})

const batteryTemplate3 = { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 }
var batteryList3 = createBatteryList(1, batteryTemplate3);
var droneList3 = createDroneList(1);
var chargerList3 = createChargerList(1);

// 4th test for EventQueue Premature End Charge testing
test('EventQueue drone & battery & charger simulation ', () => {
    const queue = new EventQueue(
        '2026-01-01 09:00',
        '2026-01-01 11:00',
        droneList3,
        batteryList3,
        chargerList3
    );
    queue.startWithDroneSourceBattEvent();
    queue.startCycle();

    const sequence = queue.getSequence();
    console.log("Event Sequence:", sequence.map(e => [e.eventName, e.time, e.emitterId]));
});
