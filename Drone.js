import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";

export class Drone extends EventEmitter {
  constructor(id, coolDownTime = 0 ,maxFlightTime=0) {
    super(Event.EventType.DRONE,id);
    this.coolDownTime = coolDownTime
    this.flightTimeSinceCoolDown =  0
    this.maxFlightTime = maxFlightTime
    this.batterySlot = null
  }

  createStartEvent(time){
    var batteryEvent = this.batterySlot.createStartUseEvent(time)
    var droneEvent = new Event (time, this.id, Drone.EventName.START, Event.EventType.DRONE, addInfo) 
    return 
  }

  getNextEvent(event){
    if (event.eventName == Drone.EventName.START && event.addInfo) {
        this.ready = false
        var timeTaken = event.addInfo.timeTaken
        var addInfo ={"last_time": event.time} 
      return new Event (event.time + timeTaken ,this.id, Drone.EventName.END , Event.EventType.DRONE, addInfo) 
    } 
    else if (event.eventName == Drone.EventName.END){
        this.ready = true
        this.flightTimeSinceCoolDown += event.time - event.addInfo.last_time
        return new Event (event.time, this.id, Drone.EventName.SOURCE_BATT, Event.EventType.TRANSIT) 
    }
    else {
      console.log("Something wrong processed event not correct")
    }
  }
}

Drone.EventName = Object.freeze({
  START_COOL: "Start Cool",
  END_COOL : "End Cool",
  START : "Start flight",
  END : "End flight",
  DRONE_SOURCE_BATT : "DRONE_SOURCE_BATT"
});


console.log("Hello World")