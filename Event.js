import { addHours } from "./TimeFunction.js";

export class Event {

    constructor(time, emitterId, eventName, eventType, addInfo = null) {
        this.time = new Date(time);
        this.emitterId = emitterId
        this.eventName = eventName
        this.eventType = eventType
        this.addInfo = addInfo
    }
    getTime() {
        return this.time
    }

    getEmitterId() {
        return this.emitterId
    }

    getEventName() {
        return this.eventName
    }

    getEventType() {
        return this.eventType
    }
    
    getAddInfo() {
        return this.addInfo
    }

    getTimeDisplay() {
        return this.time.toLocaleTimeString();
    }

    changeTime(newTime) {
        if (newTime instanceof Date) {
            this.time = newTime
        } else {
            console.log("Invalid time format. Please provide a Date object.")
        }
    }

}

Event.EventType = Object.freeze({
  BATTERY: 0,
  DRONE: 1,
  CHARGER: 2,
  TRANSIT: 3,
});

