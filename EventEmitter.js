export class EventEmitter{

  constructor(eventEmitterType, id) {
    this.eventEmitterType = eventEmitterType
    this.id  = id

  }

  createStartEvent(currentTime, addInfo){
    return []
  }


  getNextEvent(event) {
    return []
  }

  getId() {
    return this.id
  }

  getState() {
    return null
  }
  getEventEmitterType() {
    return this.eventEmitterType
  }
}

function EventEmitterTest() {
  console.log(new EventEmitter(0,"BATT_A").eventEmitterType)

}