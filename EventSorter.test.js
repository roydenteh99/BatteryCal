import { test } from 'node:test';
import assert from 'node:assert';
import { EventSorter } from './EventSorter.js';

test('EventSorter groups queue output by item and pairs start and end events', () => {
  const sorter = new EventSorter();
  const events = [
    { timestamp: '2026-01-01T10:00:00.000Z', emitterId: 'battery0', eventName: 'End Use' },
    { timestamp: '2026-01-01T09:00:00.000Z', emitterId: 'drone0', eventName: 'Start Flight' },
    { timestamp: '2026-01-01T09:00:00.000Z', emitterId: 'battery0', eventName: 'Start Use' },
    { timestamp: '2026-01-01T10:00:00.000Z', emitterId: 'drone0', eventName: 'End Flight' },
    { timestamp: '2026-01-01T10:00:00.000Z', emitterId: 'battery0', eventName: 'BATT_SOURCE_CHARGER' }
  ];

  assert.deepStrictEqual(sorter.toSheetRows(events), [
    ['battery0', 'Start Use', new Date('2026-01-01T09:00:00.000Z'), new Date('2026-01-01T10:00:00.000Z')],
    ['drone0', 'Start Flight', new Date('2026-01-01T09:00:00.000Z'), new Date('2026-01-01T10:00:00.000Z')]
  ]);
});

test('EventSorter keeps an activity open when its end event is outside the queue output', () => {
  const sorter = new EventSorter();
  const rows = sorter.toSheetRows([
    { timestamp: '2026-01-01T09:00:00.000Z', emitterId: 'drone0', eventName: 'Start Flight' }
  ]);

  assert.deepStrictEqual(rows, [
    ['drone0', 'Start Flight', new Date('2026-01-01T09:00:00.000Z'), null]
  ]);
});