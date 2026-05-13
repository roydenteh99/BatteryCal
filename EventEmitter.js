export class EventEmitter{

  constructor(eventEmitterType, id) {
    this.eventEmitterType = eventEmitterType
    this.id  = id

  }

  createStartEvent(currentTime, addInfo){
    return null
  }


  getNextEvent(event) {
    return null
  }
  
}

function EventEmitterTest() {
  console.log(new EventEmitter(0,"BATT_A").eventEmitterType)

}