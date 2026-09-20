# BatteryCal

BatteryCal simulates batteries, drones, and chargers as an event-driven system. The browser visualiser runs the existing JavaScript simulation, groups activities by resource, and displays the result with Google Charts.

**Live demo:** [Open BatteryCal](https://roydenteh99.github.io/BatteryCal/)

## Why BatteryCal

BatteryCal aims to be a first-of-its-kind practical visual simulation for coordinating limited batteries, drones(or representing a battery consumer), and onsite chargers in one event-driven model. It is particularly useful for complex operating cases where battery availability is constrained and charging onsite is the only workable solution. By making resource contention, charging cycles, flight time, cooldowns, and timing visible, it helps explore whether a proposed battery and charger setup can support the required operation.

## Run the visualiser

The page uses ES modules, so serve the project through a local web server instead of opening `index.html` directly.

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

The visualiser lets you configure:

- Simulation start time and duration
- Battery quantity, maximum flight time, charge time, and initial charge percentage
- Drone quantity, cooldown duration, loading duration, and maximum flight duration before cooling
- Charger quantity

Blank numeric inputs use the defaults shown by the form. After generating a sequence, use **Copy for Google Sheets** to copy tab-separated activity data with these columns:

```text
Type    Resource    Activity    Start    End
```

## Visualization notes

### Zero-second cooldown still appears

A drone can still produce `Start Cool` and `End Cool` events when its cooldown value is `0`. Those events occur at the same timestamp and may appear as a tiny or difficult-to-see activity in the Google Timeline.

This is a visualization limitation, not a timing error. The event queue processes the zero-duration cooldown in the correct order, and the drone becomes available according to the existing state transitions.

### Loading and unloading are not separate bars

Battery loading and unloading durations are accounted for in the simulation, but they are not emitted as standalone `Loading` or `Unloading` events. As a result, the chart does not show a separate bar for those operations.

The timing is still included through the surrounding events:

- A drone's `Start Flight` time is shifted by `loadingBatteryDuration`.
- After flight, battery and drone follow-up events are scheduled using the loading/unloading duration.
- Cooldown duration uses the larger of the configured cooldown and loading duration where required.

Therefore, the visible event labels do not show every physical operation, but the event timestamps and next-resource availability include their duration.

## Source of truth

- `QueueManager.js` processes and records simulation events.
- `EventSorter.js` pairs start and end events for timeline rows.
- `index.html` provides the browser controls, Google Timeline, event table, and Sheets export.

The event-driven implementation is covered by the Node test suite:

```powershell
node --test
```
