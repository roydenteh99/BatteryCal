import {EventEmitter} from './EventEmitter.js';
import { Charger } from './Charger.js';
import { Battery } from './SimplerBattery.js';
import { Drone } from './Drone.js';

import {Event} from './Event.js';
import {getTimeDiffInHours, addHours} from './TimeFunction.js';

export class EventQueue {
  constructor(startTime = "2026-01-01 09:00", endTime = null, droneList = [], batteryList = [], chargerList = []) {
    this.droneList = droneList;
    this.batteryList = batteryList;
    this.chargerList = chargerList;
    this.recordedEvents = [];
    this.events = [];
    this.maxIteration = 100; // to prevent infinite loop in case of bugs
    this.currentTime = new Date(startTime);
    this.iterationCount = 0;
    this.endTime = endTime;
  }

  // Adds an event and advances the "cursor" of time
  advanceEvent() {
    this.iterationCount++;    
    this.events = sortEvents(this.events);
    const currentEvent = this.events.shift();
    this.currentTime = currentEvent.time;
    const eventEmitter = this.findEventEmitterFromEvent(currentEvent);
    let nextEvents = [] ;

    const transitHandler = {
      "BATT_SOURCE_DRONE": this.battSourceDrone.bind(this),
      "BATT_SOURCE_CHARGER": this.battSourceCharger.bind(this),
      "DRONE_SOURCE_BATT": this.droneSourceBatt.bind(this),
      "CHARGER_SOURCE_BATT": this.chargerSourceBatt.bind(this)
    }


    if (currentEvent.getEventType() === Event.EventType.TRANSIT) {
      nextEvents = transitHandler[currentEvent.getEventName()](eventEmitter);
    } else {
      nextEvents = eventEmitter.getNextEvent(currentEvent);
    }
    this.events = this.events.concat(nextEvents);
    this.recordedEvents.push(currentEvent);
  }

  battSourceDrone (battery) {

    // ensure that that once a battery has been sourced to a drone, 
    // it should not be sourced again until it has been fully charged and is ready for use.
    if (battery.getState() !== Battery.State.READY) {
      return [];
    }

    const drone = this.droneList.find(drone=> drone.getState() == 2 )
    
    if (battery.getEventEmitterType() !== Event.EventType.BATTERY) {
      console.error("Expected a battery emitter, but got:", battery);
      return [];
    }

    if (drone) {
      return drone.createStartEvent(this.currentTime, {battery, duration: drone.maxFlightDuration});
    } else {
      // console.log("No available drone for battery", battery.getId(), "at time", this.currentTime);
      return [];
    }

  }

  battSourceCharger (battery) {
    // ensure that that once a battery has been sourced to a charger, 
    // it should not be sourced again until it has been fully charged and is ready for use.
    if (battery.getState() !== Battery.State.FLAT) {
      return [];
    }

    if (battery.getState() !== Battery.State.FLAT) {
      return [];
    }
    const charger = this.chargerList.find(charger=> charger.getState() == 2 )
    if (charger) {
      return charger.createStartEvent(this.currentTime, {battery, duration: battery.getChargeTimeTillFull()});
    } else {
      // console.log("No available charger for battery", battery.getId(), "at time", this.currentTime);
      return [];
    }
  }

  droneSourceBatt (drone) {
    // ensure that that once a drone has been sourced to a battery,
    // it should not be sourced again until it has been fully charged and is ready for use.
    if (drone.getState() !== Drone.State.READY) {
      return [];
    }
    // Find a fully charged battery first
    const fullyChargedBattery = this.batteryList.find(battery => battery.getState() === 2);
    // Calculate the remaining time until the end time, accounting for battery loading and unloading duration
    const durationTillEndTime = getTimeDiffInHours(this.endTime, this.currentTime) - drone.getLoadingDuration() * 2;
    
    if (fullyChargedBattery) {
      return drone.createStartEvent(this.currentTime, {battery: fullyChargedBattery, duration: fullyChargedBattery.maxFlightTime});
    } 

    const chargerWithSemiChargedBatt = this.chargerList.reduce((bestCharger, charger) => {
      const battery = charger.getBattery();
      if (!battery || charger.getState() != 1 || battery.getAvailFlightTime() <= 0) {
        return bestCharger;
      }
      if (!bestCharger) {
        return charger;
      }

      const bestBattery = bestCharger.getBattery();
      return battery.getAvailFlightTime() > bestBattery.getAvailFlightTime()
        ? charger
        : bestCharger;
    
      }, null);

    if (chargerWithSemiChargedBatt) {
      const semiChargedBattery = chargerWithSemiChargedBatt.getBattery()
      const maxDurationToChargeAndFlight = semiChargedBattery.getAvailableFlightTime() + semiChargedBattery.getChargeTimeTillFull();
      if (maxDurationToChargeAndFlight > durationTillEndTime) {
        //console.log("Given there is available time to fully charge and utilisedbattery ,allow battery to fully charge ")
        return []
      
      } else {
        const {startTime} = this.optimiseDurationAndStartTime(semiChargedBattery, durationTillEndTime, this.currentTime);
        chargerWithSemiChargedBatt.prematureEndCharge(startTime)
        //console.log("Designated Charger ",chargerWithSemiChargedBatt.getEmitterId() , "to end charging time ", startTime.display , "toLocaleTimeString()" )
        return[]
      }
    }
      
      //console.log("No available battery for drone", drone.getId(), "at time", this.currentTime);
      return [];
  }

  

  optimiseDurationAndStartTime(battery, durationTillEndTime, currentTime) {
    const availableFlightTime = battery.getAvailableFlightTime();

      const chargeToFlightRatio = battery.getChargeTimeToFlightRatio();
      const extraFlightDuration = (durationTillEndTime - availableFlightTime) * 1 / (1 + chargeToFlightRatio);
      const extraChargeDuration = extraFlightDuration * chargeToFlightRatio;

      const duration = addHours(availableFlightTime, extraFlightDuration);
      const startTime = addHours(currentTime, extraChargeDuration);

      return {startTime};

  }

  chargerSourceBatt(charger) {
    // ensure that that once a charger has been sourced to a battery via battSourceCharger,
    // it should not be sourced again until it has been fully charged and is ready for use.
    if (charger.getState() !== Charger.State.READY) {
      return [];
    }
    const durationTillEndTime = getTimeDiffInHours(this.endTime, this.currentTime);
    const batteryToCharge = this.batteryList.find(battery => battery.getState() === -1);
    const shorterDuration = batteryToCharge ? Math.min(batteryToCharge.getChargeTimeTillFull(), durationTillEndTime) : 0;
    // `charger.createStartEvent` already returns an array of events; avoid wrapping it in another array
    return batteryToCharge ? charger.createStartEvent(this.currentTime, {battery: batteryToCharge, duration: shorterDuration}) : [];
  }

  

  startCycle() { 
    const condition = () => {
      if (this.endTime) {
        return this.currentTime < new Date(this.endTime) && this.events.length > 0;
      } else {
        return this.events.length > 0 && this.iterationCount < this.maxIteration;
      }
    }

    while (condition()) {
      this.advanceEvent();
    }
  }

  startWithDroneSourceBattEvent() {
    for (const drone of this.droneList) {
      const droneSourceBattEvent = drone.createSourceBatteryEvent(this.currentTime);
      this.events.push(droneSourceBattEvent);
    }
  }


  findEventEmitterFromEvent(event) {
   const eventType = event.getEventType();
   
   if (eventType === Event.EventType.BATTERY || (eventType === Event.EventType.TRANSIT && event.getEventName().startsWith("BATT_SOURCE"))) {
     return this.batteryList.find(b => b.getId() === event.getEmitterId());
   } else if (eventType === Event.EventType.DRONE || (eventType === Event.EventType.TRANSIT && event.getEventName().startsWith("DRONE_SOURCE"))) {
     return this.droneList.find(d => d.getId() === event.getEmitterId());
   } else if (eventType === Event.EventType.CHARGER || (eventType === Event.EventType.TRANSIT && event.getEventName().startsWith("CHARGER_SOURCE"))) {
     return this.chargerList.find(c => c.getId() === event.getEmitterId());
   } else {
    console.error("Unknown event type or emitter for event:", event);
    return null;
   }
  }

  getSequence() {
    return this.recordedEvents.map(e => ({
      time: e.getTimeDisplay(),
      eventName: e.getEventName(),
      emitterId: e.getEmitterId(),
    }));
  }
}

// to sort events by time and then by type battery,drone,charger event to precede traansit events
function sortEvents(events) {
  const eventTypePriority = { [Event.EventType.BATTERY]: 1, [Event.EventType.DRONE]: 1, [Event.EventType.CHARGER]: 1, [Event.EventType.TRANSIT]: 2 };

  return events.sort((a, b) => {
    // defensive logging: ensure both items expose getTime()
    const aHasGetTime = a && typeof a.getTime === 'function';
    const bHasGetTime = b && typeof b.getTime === 'function';
    if (!aHasGetTime || !bHasGetTime) {
      console.error('sortEvents: item missing getTime()', { a, b });
      throw new TypeError('sortEvents: item missing getTime()');
    }

    if (a.getTime() === b.getTime()) {
      return eventTypePriority[a.eventType] - eventTypePriority[b.eventType];
    }
    return a.getTime() - b.getTime();
  });
} 