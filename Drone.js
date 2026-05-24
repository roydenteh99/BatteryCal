import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";
import {addHours} from "./TimeFunction.js";

export class Drone extends EventEmitter {
  constructor(id, {coolDownTime = 0 ,maxFlightTime = null}) {
    super(Event.EventType.DRONE, id);
    this.coolDownTime = coolDownTime
    this.maxFlightTime = maxFlightTime
    this.flightTimeSinceCoolDown =  0
    this.batterySlot = null
    this.droneState = Drone.DroneState.READY
  }

  getState() {
    return this.droneState;
  }

  checkAvail() {
    return this.droneState === Drone.DroneState.READY;
  }

  removeBattery() {
    this.batterySlot = null
  } 

  createStartEvent(time , {battery, duration}) {
    this.batterySlot = battery
    var batteryEvent = this.batterySlot.createStartUseEvent(time)
    var droneEvent = new Event (time, this.id, Drone.EventName.START_FLIGHT, Event.EventType.DRONE, {"duration": duration}) 
    return [droneEvent].concat(batteryEvent)
  }

  getNextEvent(event){
    const {duration} = event.addInfo || {};
    switch (event.eventName) {
      
      case Drone.EventName.START_FLIGHT:
        const endTime = addHours(event.time, duration);
        this.droneState = Drone.DroneState.IN_USE
        return [new Event (endTime, this.id, Drone.EventName.END_FLIGHT , Event.EventType.DRONE, event.addInfo)]
      
      case Drone.EventName.END_FLIGHT:
        const batteryEvent = this.batterySlot.createEndUseEvent(event.time, duration)
        this.flightTimeSinceCoolDown += duration
        this.removeBattery()
        if(this.maxFlightTime != null && this.flightTimeSinceCoolDown >= this.maxFlightTime){
          const startCoolEvent = new Event (event.time, this.id, Drone.EventName.START_COOL, Event.EventType.DRONE)
          return [startCoolEvent].concat(batteryEvent)
        } else {
          const endEvent = new Event (event.time, this.id, Drone.EventName.END , Event.EventType.DRONE)
          return [endEvent].concat(batteryEvent)
        }
        
      case Drone.EventName.START_COOL:
        this.droneState = Drone.DroneState.COOLING_DOWN
        const endCoolEvent = new Event (addHours(event.time, this.coolDownTime), this.id, Drone.EventName.END_COOL , Event.EventType.DRONE)
        return [endCoolEvent]
    
      case Drone.EventName.END_COOL:
        this.droneState = Drone.DroneState.READY
        this.flightTimeSinceCoolDown = 0
        const endEvent = new Event (event.time, this.id, Drone.EventName.END , Event.EventType.DRONE)
        return [endEvent]
      
      case Drone.EventName.END:
        const batterySourceEvent = new Event (event.time, this.id, Drone.EventName.DRONE_SOURCE_BATT , Event.EventType.TRANSIT)
        return [batterySourceEvent]
      
      default:    
        return []
    }
  }
}

Drone.EventName = Object.freeze({
  START_FLIGHT : "Start Flight",
  END_FLIGHT : "End flight",
  END : "End",
  START_COOL : "Start Cool",
  END_COOL : "End Cool",
  DRONE_SOURCE_BATT : "DRONE_SOURCE_BATT"
});

Drone.DroneState = Object.freeze({
    READY : 2,
    IN_USE : 1,
    COOLING_DOWN : 0
})

