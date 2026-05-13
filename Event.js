import { addHours } from "./TimeFunction.js";

export class Event {

    constructor(time, emitterId, eventName, eventType, addInfo = null) {
        this.time = new Date(time);
        this.emitterId = emitterId
        this.eventName = eventName
        this.eventType = eventType
        this.addInfo = addInfo
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

