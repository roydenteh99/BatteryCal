class Charger extends EventEmitter {

  constructor(id) {
    super(Event.EventType.Charger,id);
  }

  getNextEvent(event){
    if (event.eventName == Charger.EventName.START && event.addInfo) {
      this.ready = false
      return new Event (event.time + event.addInfo.timeTaken ,this.id, Charger.EventName.END , Event.EventType.Charger) 
    } 
    else if (event.eventName == Charger.EventName.END){
      this.ready = true
      return new Event (event.time, this.id, Charger.EventName.SOURCE_BATT, Event.EventType.TRANSIT) 
    }
    else {
      console.log("Something wrong processed event not correct")
    }
  }
}

Charger.EventName = Object.freeze({
  START : "Start Charge",
  END : "End Charge",
  CHARGER_SOURCE_BATT : "CHARGER_SOURCE_BATT"
});