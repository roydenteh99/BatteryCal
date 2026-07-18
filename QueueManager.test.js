import { test } from 'node:test';
import assert from 'node:assert';
import { EventQueue } from './QueueManager.js';
import { Drone } from './Drone.js';


const drone = new Drone("drone8", { coolDownTime: 0.1, maxFlightDuration: 1 });
const battery = new Battery("battery6", { maxFlightTime: 1, chargeTime: 1, chargePercent: 100 });

test('EventQueue droneSourceBatt should not throw when no suitable battery is available', () => {
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

