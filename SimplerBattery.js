import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";

export class Battery extends EventEmitter {

    constructor(id, {maxFlightTime, chargeTime, chargePercent = 100 , battSwapDuration = 0}) {
        super(Event.EventType.BATTERY, id);
        this.maxFlightTime = maxFlightTime
        this.chargeTime = chargeTime
        this.chargePercent = chargePercent
        this.battSwapDuration = battSwapDuration
        this.batteryState = Battery.State.READY
        }

    getBatteryState() {
        return this.batteryState;
    }

    getAvailFlightTime() {
        return (this.chargePercent / 100) * this.maxFlightTime;
    }



    getNextEvent(event){
        if (event.eventName == Battery.EventName.END_CHARGE) {
            return new Event (event.time + this.battSwapDuration ,this.id , Battery.EventName.END , Event.EventType.BATTERY) 
        } 
        
        if (event.eventName == Battery.EventName.END_USE ) {
            this.useEvent = null
            var duration = event.time - event.addInfo.timeStarted
            this.chargePercent = Math.max(0, this.chargePercent - (duration / this.maxFlightTime) * 100)
            return new Event (event.time + this.battSwapDuration ,this.id , Battery.EventName.END , Event.EventType.BATTERY) 
        }

        if (event.eventName == Battery.EventName.END){
            if (this.chargePercent > 0) {
                this.batteryState = Battery.State.READY
                return new Event (event.time ,this.id , Battery.EventName.BATT_SOURCE_DRONE , Event.EventType.TRANSIT)
            }
            else{
                this.batteryState = Battery.State.FLAT
                return new Event (event.time ,this.id , Battery.EventName.BATT_SOURCE_CHARGER , Event.EventType.TRANSIT)
            }
        }
        return null
        }

    createStartUseEvent(time, addInfo){
        return new Event(time, this.id, Battery.EventName.START_USE, Event.EventType.BATTERY, addInfo);
    }

    createStartChargeEvent(time, addInfo){
        return new Event(time, this.id, Battery.EventName.START_CHARGE, Event.EventType.BATTERY, addInfo);
    }

    createEndChargeEvent(time , chargeDuration){ 
        this.chargePercent = Math.min(100, this.chargePercent + (duration / this.chargeTime) * 100)
        return new Event(time, this.id, Battery.EventName.END_CHARGE, Event.EventType.BATTERY)
        }
    
    createEndUseEvent(time, useDuration){
        this.chargePercent = Math.max(0, this.chargePercent - (duration / this.chargeTime) *100 )
        
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

