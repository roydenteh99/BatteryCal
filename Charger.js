import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";
import {getTimeDiffInHours,addHours} from "./TimeFunction.js";
import {Battery} from "./SimplerBattery.js";

export class Charger extends EventEmitter {

  constructor(id) {
    super(Event.EventType.Charger, id);
    this.chargerState = Charger.State.READY;
    this.batterySlot = null;
    this.endChargeEvent = null;
  }

  prematureEndCharge(time) {
    if (this.endChargeEvent) {
      this.endChargeEvent.changeTime(time);
    }
    else{
      throw new Error("No ongoing charge to end prematurely.");
    }
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

  
  createStartEvent(time, {battery, duration}) {
    const batteryEvent = this.batterySlot.createStartChargeEvent(time, {duration});
    const chargerEvent = new Event(time, this.id, Charger.EventName.START, Event.EventType.Charger, {duration});
    this.batterySlot = battery;
    this.chargerState = Charger.State.NOT_READY;
    return [chargerEvent].concat(batteryEvent);
  }

  getNextEvent(event){
    const {duration} = event.addInfo || {};
    
    switch (event.eventName) {
      case Charger.EventName.START:
        const startTime = event.time;
        const endTime = addHours(event.time, duration);
        this.endChargeEvent = new Event(endTime, this.id, Charger.EventName.END, Event.EventType.Charger, {startTime})
        return [this.endChargeEvent]
      
      case Charger.EventName.END:
        
        const {startTime} = event.addInfo || {};
        const chargeDuration = getTimeDiffInHours(startTime, event.time);
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
  NOT_READY : 1
});