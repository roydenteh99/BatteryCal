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
test('EventQueue records the expected event sequence', () => {
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
    assert.deepStrictEqual(
        sequence.map(({ eventName, emitterId }) => [eventName, emitterId]),
        [
            ['DRONE_SOURCE_BATT', 'drone0'],
            ['Start Flight', 'drone0'],
            ['Start Use', 'battery0'],
            ['End Flight', 'drone0'],
            ['End', 'drone0'],
            ['End Use', 'battery0'],
            ['End', 'battery0'],
            ['BATT_SOURCE_CHARGER', 'battery0'],
            ['Start Charge', 'charger0'],
            ['Start Charge', 'battery0'],
            ['DRONE_SOURCE_BATT', 'drone0'],
            ['End Charge', 'charger0'],
            ['End Charge', 'battery0'],
            ['End', 'battery0'],
            ['CHARGER_SOURCE_BATT', 'charger0'],
            ['BATT_SOURCE_DRONE', 'battery0'],
            ['Start Flight', 'drone0'],
            ['Start Use', 'battery0'],
            ['End Flight', 'drone0'],
            ['End', 'drone0'],
            ['End Use', 'battery0'],
            ['End', 'battery0']
        ],
        'The queue recorded an unexpected event sequence'
    );
});

test('EventQueue uses initial battery charge when starting a flight', () => {
    const battery = new Battery('battery-partial', {
        maxFlightTime: 2,
        chargeTime: 1,
        chargePercent: 50
    });
    const drone = new Drone('drone-partial', { maxFlightDuration: 0 });
    const queue = new EventQueue(
        '2026-01-01 09:00',
        '2026-01-01 11:00',
        [drone],
        [battery],
        []
    );

    queue.startWithDroneSourceBattEvent();
    queue.startCycle();

    const flightEvents = queue.recordedEvents.filter(event =>
        event.getEmitterId() === 'drone-partial' &&
        (event.getEventName() === 'Start Flight' || event.getEventName() === 'End Flight')
    );

    assert.equal(flightEvents.length, 2);
    assert.equal(
        (flightEvents[1].getTime() - flightEvents[0].getTime()) / (1000 * 60 * 60),
        1,
        'A 50% battery should provide half of its two-hour flight time'
    );
});

test('EventQueue does not start a battery-driven flight beyond the cutoff', () => {
    const battery = new Battery('battery-cutoff', {
        maxFlightTime: 1,
        chargeTime: 1,
        chargePercent: 100
    });
    const drone = new Drone('drone-cutoff', { maxFlightDuration: 0 });
    const queue = new EventQueue(
        '2026-01-01 09:20',
        '2026-01-01 09:30',
        [drone],
        [battery],
        []
    );

    assert.deepEqual(queue.battSourceDrone(battery), []);
});



