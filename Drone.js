import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";
import {addHours} from "./TimeFunction.js";
import {Battery} from "./SimplerBattery.js";

export class Drone extends EventEmitter {
  constructor(id, {coolDownTime = 0, loadingBatteryDuration = 0, maxFlightDuration = null}) {
    super(Event.EventType.DRONE, id);
    this.coolDownTime = coolDownTime
    this.loadingBatteryDuration = loadingBatteryDuration
    this.maxFlightDuration = maxFlightDuration
    this.flightTimeSinceCoolDown =  0
    this.batterySlot = null
    this.droneState = Drone.State.READY
  }

  getState() {
    return this.droneState;
  }

  checkAvail() {
    return this.droneState === Drone.State.READY;
  }

  getFlightTimeSinceCoolDown() {
    return this.flightTimeSinceCoolDown;
  }

  removeBattery() {
    this.batterySlot = null
  } 

  createStartEvent(time , {battery, duration}) {
    this.batterySlot = battery
    const startFlightTime = addHours(time, this.loadingBatteryDuration) 
    const batteryEvent = this.batterySlot.createStartUseEvent(startFlightTime)
    const droneEvent = new Event (startFlightTime, this.id, Drone.EventName.START_FLIGHT, Event.EventType.DRONE, {"duration": duration})
    this.droneState = Drone.State.IN_USE 
    return [droneEvent].concat(batteryEvent)
  }

  getNextEvent(event){
    const {duration} = event.addInfo || {};
    switch (event.eventName) {
      
      case Drone.EventName.START_FLIGHT:
        const endFlightTime = addHours(event.time, duration);
        return [new Event (endFlightTime, this.id, Drone.EventName.END_FLIGHT , Event.EventType.DRONE, event.addInfo)]
      
      case Drone.EventName.END_FLIGHT:
        
        const batterySwapDuration = this.loadingBatteryDuration
        const endTime = addHours(event.getTime(), batterySwapDuration)
        const batteryEvent = this.batterySlot.createEndUseEvent(endTime, duration)
        this.flightTimeSinceCoolDown += duration
        this.removeBattery()
        


        if(this.maxFlightDuration != null && this.flightTimeSinceCoolDown >= this.maxFlightDuration){
          const startCoolEvent = new Event (event.getTime(), this.id, Drone.EventName.START_COOL, Event.EventType.DRONE)
          return [startCoolEvent].concat(batteryEvent)
        } else {
          const endEvent = new Event (endTime, this.id, Drone.EventName.END , Event.EventType.DRONE)
          return [endEvent].concat(batteryEvent)
        }
      
      // TO account for when swapping battery to be less then cool down period
      case Drone.EventName.START_COOL:
        this.droneState = Drone.State.COOLING_DOWN
        const durationTillEndCool  = Math.max(this.coolDownTime, this.loadingBatteryDuration)

        const endCoolEvent = new Event (addHours(event.getTime(), durationTillEndCool), this.id, Drone.EventName.END_COOL , Event.EventType.DRONE)
        return [endCoolEvent]
    
      case Drone.EventName.END_COOL:
        this.flightTimeSinceCoolDown = 0
        const endEvent = new Event (event.getTime(), this.id, Drone.EventName.END , Event.EventType.DRONE)
        return [endEvent]
      
      case Drone.EventName.END:
        this.droneState = Drone.State.READY
        const batterySourceEvent = new Event (event.getTime(), this.id, Drone.EventName.DRONE_SOURCE_BATT , Event.EventType.TRANSIT)
        return [batterySourceEvent]
      
      default:    
        return []
    }
  }
}

Drone.EventName = Object.freeze({
  START_FLIGHT : "Start Flight",
  END_FLIGHT : "End Flight",
  END : "End",
  START_COOL : "Start Cool",
  END_COOL : "End Cool",
  DRONE_SOURCE_BATT : "DRONE_SOURCE_BATT"
});

Drone.State = Object.freeze({
    READY : 2,
    IN_USE : 1,
    COOLING_DOWN : 0
})

