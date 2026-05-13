class Event {

constructor(time, emitterId, eventName, eventType, addInfo = null) {
  this.time = time
  this.emitterId = emitterId
  this.eventName = eventName
  this.eventType = eventType
  this.addInfo = addInfo
  this.ready = true

  }
}
Event.EventType = Object.freeze({
  BATTERY: 0,
  DRONE: 1,
  CHARGER: 2,
  TRANSIT: 3,
});


function test () {
  initialEvent = new Event("2026-01-01 09:00","blank","nothing")
  console.log(initialEvent.getNextEventInfo().emitterId)
}