import { test } from 'node:test';
import assert from 'node:assert';
import { EventQueue } from './QueueManager.js';
import { Drone } from './Drone.js';
import { Battery } from './SimplerBattery.js';

// Creating Drone instance for testing
const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });
const noOfDrones = 2;
const droneList = [];
for (let i = 0; i < noOfDrones; i++) {
    droneList.push(new Drone(`drone${i}`));
}

// Creating Batteries instance for testing
const batteryTemplate = { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 }
const noOfBatteries = 2;
const batteryList = [];
for (let i = 0; i < noOfBatteries; i++) {
    batteryList.push(new Battery(`battery${i}`, batteryTemplate));
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

// 2nd test for EventQueue Battery Source Drone Initialization
test('EventQueue battery source drone initialization', () => {
  const queue = new EventQueue(
    '2026-01-01 09:00',
    '2026-01-01 12:00',
    droneList,
    batteryList,
    []
  );
  queue.startWithDroneSourceBattEvent();
  queue.startCycle();
  console.log(queue.getSequence());
})



