import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";
import {getTimeDiffInHours, addHours} from "./TimeFunction.js";
import {Battery} from "./SimplerBattery.js";

export class Charger extends EventEmitter {

  constructor(id) {
    super(Event.EventType.CHARGER, id);
    this.chargerState = Charger.State.READY;
    this.batterySlot = null;
    this.endChargeEvent = null;
  }

  getBattery() {
    return this.batterySlot
  }


  checkAvail(){
    return this.chargerState === Charger.State.READY;
  }

  getState() {
    return this.chargerState;
  }
  
  removeBattery() {
    this.batterySlot = null
  }

  
  prematureEndCharge(time) {
    if (this.endChargeEvent) {
      this.endChargeEvent.changeTime(time);
      this.chargerState = Charger.State.NOT_READY_BOOKED
    } else{
      throw new Error("No ongoing charge to end prematurely.");
    }
  }

  
  createStartEvent(time, {battery, duration}) {
    const batteryEvent = battery.createStartChargeEvent(time);
    const chargerEvent = new Event(time, this.id, Charger.EventName.START, Event.EventType.CHARGER, {duration});
    
    this.batterySlot = battery;
    this.chargerState = Charger.State.NOT_READY;
    return [chargerEvent].concat(batteryEvent);
  }

  getEndChargeEvent() {
    return this.endChargeEvent;
  }

  getNextEvent(event){
    const {duration} = event.addInfo || {};
    
    switch (event.eventName) {
      case Charger.EventName.START:
        const startTime = event.time;
        const endTime = addHours(event.time, duration);
        this.endChargeEvent = new Event(endTime, this.id, Charger.EventName.END, Event.EventType.CHARGER, {"startChargeTime": startTime});
        return [this.endChargeEvent]
      
      case Charger.EventName.END:
        
        const {startChargeTime} = event.addInfo || {};
        const chargeDuration = getTimeDiffInHours(startChargeTime, event.time);
        this.chargerState = Charger.State.READY;
        const batteryEvent = this.batterySlot.createEndChargeEvent(event.time, chargeDuration);
        return [new Event (event.time, this.id, Charger.EventName.CHARGER_SOURCE_BATT, Event.EventType.TRANSIT)].concat(batteryEvent); 
    
      default:
        return [];
    }
  }
}

Charger.EventName = Object.freeze({
  START : "Start Charge",
  END : "End Charge",
  CHARGER_SOURCE_BATT : "CHARGER_SOURCE_BATT"
});

Charger.State = Object.freeze({
  READY : 2,
  NOT_READY : 1,
  NOT_READY_BOOKED : 0, 
  
});