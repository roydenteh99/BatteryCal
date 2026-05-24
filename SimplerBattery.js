import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";
import {addHours} from "./TimeFunction.js";

export class Battery extends EventEmitter {

    constructor(id, {maxFlightTime, chargeTime, chargePercent = 100 , battSwapDuration = 0}) {
        super(Event.EventType.BATTERY, id);
        this.maxFlightTime = maxFlightTime
        this.chargeTime = chargeTime
        this.chargePercent = chargePercent
        this.battSwapDuration = battSwapDuration
        this.batteryState = Battery.State.READY
        }

    getState() {
        return this.batteryState;
    }

    getAvailFlightTime() {
        return (this.chargePercent / 100) * this.maxFlightTime;
    }

    getChargeTimeTillFull() {
        return ((100 - this.chargePercent) / 100) * this.chargeTime;
    }


    getNextEvent(event){
        switch (event.eventName) {

        case Battery.EventName.END_CHARGE:
            return [new Event (addHours(event.time, this.battSwapDuration) ,this.id , Battery.EventName.END , Event.EventType.BATTERY)];
        
        case Battery.EventName.END_USE:
            return [new Event (addHours(event.time, this.battSwapDuration) ,this.id , Battery.EventName.END , Event.EventType.BATTERY)]       
            

        case Battery.EventName.END:
            if (this.chargePercent > 0) {
                this.batteryState = Battery.State.READY
                return [new Event (addHours(event.time, this.battSwapDuration) ,this.id , Battery.EventName.BATT_SOURCE_DRONE , Event.EventType.TRANSIT)]
            }
            else{
                this.batteryState = Battery.State.FLAT
                return [new Event (addHours(event.time, this.battSwapDuration) ,this.id , Battery.EventName.BATT_SOURCE_CHARGER , Event.EventType.TRANSIT)]
            }
            
        default:
            return []
        }

        }

    createStartUseEvent(time){
        this.batteryState = Battery.State.IN_USE
        return [new Event(time, this.id, Battery.EventName.START_USE, Event.EventType.BATTERY)];
    }

    createStartChargeEvent(time){
        this.batteryState = Battery.State.CHARGING
        return [new Event(time, this.id, Battery.EventName.START_CHARGE, Event.EventType.BATTERY)];
    }

    createEndChargeEvent(time , chargeDuration){ 
        this.chargePercent = Math.min(100, this.chargePercent + (chargeDuration / this.chargeTime) * 100)
        return [new Event(time, this.id, Battery.EventName.END_CHARGE, Event.EventType.BATTERY)]
        }
    
    createEndUseEvent(time, useDuration){
        this.chargePercent = Math.max(0, this.chargePercent - (useDuration / this.chargeTime) *100 )
        return [new Event(time, this.id, Battery.EventName.END_USE, Event.EventType.BATTERY)]
        
    }
}

Battery.EventName = Object.freeze({
  START_USE : "Start Use",
  END_USE : "End Use",
  START_CHARGE: "Start Charge",
  END_CHARGE: "End Charge",
  END : "End",
  BATT_SOURCE_DRONE : "BATT_SOURCE_DRONE",
  BATT_SOURCE_CHARGER : "BATT_SOURCE_CHARGER"
});

Battery.State = Object.freeze({
    FLAT : -1,
    IN_USE: 0,
    CHARGING: 1,
    READY: 2,
});

