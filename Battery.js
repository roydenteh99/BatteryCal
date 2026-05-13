
class Battery extends EventEmitter {

  constructor(id, maxFlightTime, chargeTime, chargePercent, battSwapTime=0) {
    super(Event.EventType.BATTERY,id);
    this.maxFlightTime = maxFlightTime
    this.chargeTime = chargeTime
    this.chargePercent = chargePercent
    this.battSwapTime = battSwapTime
  }

  getNextEvent(event){
    if (event.eventName == Battery.EventName.CHARGE && event.addInfo) {
      this.ready = true
      this.chargePercent = this.chargePercent + (event.addInfo.timeTaken / this.maxFlightTime) * 100
       
      return new Event (event.time + event.addInfo.timeTaken ,this.id, Battery.EventName.END , Event.EventType.Battery) 
    } 

    if (event.eventName == Battery.EventName.START && event.addInfo) {
      this.ready = false
      this.chargePercent = this.chargePercent - (event.addInfo.timeTaken / this.maxFlightTime) * 100
       
      return new Event (event.time + event.addInfo.timeTaken ,this.id, Battery.EventName.END , Event.EventType.Battery) 
    } 

    else if (event.eventName == Battery.EventName.END){
      this.ready = this.chargePercent > 0
      if (this.ready) {
        addInfo = {"timeEval" : this.chargePercent * this.maxFlightTime } 
        return new Event (event.time , this.id, Battery.EventName.SOURCE_DRONE, Event.EventType.TRANSIT,addInfo)
      } else {
        addInfo = {"timeEval" : (1 - this.chargePercent) * this.maxFlightTime } 
        return new Event (event.time , this.id, Battery.EventName.SOURCE_CHARGER, Event.EventType.TRANSIT,addInfo) 
      }
    }
    else {
      console.log("Something wrong processed event not correct")
    }
  }
}

Battery.EventName = Object.freeze({
  START_USE : "Start Use",
  END_USE : "End Use",
  START_CHARGE: "Start Charge",
  END_CHARGE: "End Charge",
  BATT_SOURCE_DRONE : "BATT_SOURCE_DRONE",
  BATT_SOURCE_CHARGER : "BATT_SOURCE_CHARGER"
});