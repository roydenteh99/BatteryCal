import { EventEmitter } from "./EventEmitter.js";
import { Event } from "./Event.js";

export class Battery extends EventEmitter {

    constructor(id, maxFlightTime, chargeTime, chargePercent, battSwapDuration = 0) {
        super(Event.EventType.BATTERY, id);
        this.maxFlightTime = maxFlightTime
        this.chargeTime = chargeTime
        this.chargePercent = chargePercent
        this.battSwapDuration = battSwapDuration
        this.batteryState = Battery.State.READY
        this.chargeEvent = null
        this.useEvent = null
        }

    getBatteryState() {
        return this.batteryState;
    }

    getAvailFlightTime() {
        return (this.chargePercent / 100) * this.maxFlightTime;
    }

    getNextEvent(event){
        if (event.eventName == Battery.EventName.START_CHARGE && event.addInfo) {
            this.batteryState = Battery.State.CHARGING
            var duration = event.addInfo.duration
            var timeStarted = event.time
            var addInfo = {"timeStarted": timeStarted}
            this.chargeEvent = new Event (timeStarted + duration ,this.id, Battery.EventName.END_CHARGE , Event.EventType.Battery , addInfo)
            return this.chargeEvent
        } 

        if (event.eventName == Battery.EventName.END_CHARGE && event.addInfo) {
            this.chargePercent = Math.min(100, this.chargePercent + (duration / this.chargeTime) * 100)
            this.chargeEvent = null
            var duration = event.time - event.addInfo.timeStarted
            return new Event (event.time + this.battSwapDuration ,this.id , Battery.EventName.END , Event.EventType.BATTERY) 
        } 
        

        if (event.eventName == Battery.EventName.START_USE && event.addInfo) {
            this.batteryState = Battery.State.IN_USE
            var duration = event.addInfo.duration
            var timeStarted = event.time
            var addInfo = {"timeStarted": timeStarted}
            this.useEvent = new Event (timeStarted + duration ,this.id, Battery.EventName.END_USE , Event.EventType.Battery, addInfo)
            return this.useEvent
        }

        if (event.eventName == Battery.EventName.END_USE && event.addInfo) {
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
                return new Event (event.time ,this.id , Battery.EventName.BATT_SOURCE_DRONE , Event.EventType.TRANSIT)
            }
        }
        console.log("Something wrong processed event not correct")
        }

    createStartUseEvent(time, addInfo){
        return new Event(time, this.id, Battery.EventName.START_USE, Event.EventType.BATTERY, addInfo);
    }

    createStartChargeEvent(time, addInfo){
        return new Event(time, this.id, Battery.EventName.START_CHARGE, Event.EventType.BATTERY, addInfo);
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

