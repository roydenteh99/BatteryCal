

function addHours(date,hours) {
    date.setMinutes(date.getMinutes() + hours * 60)
    return date
}

function getTimeDiffInHours(date1, date2) {
    var diffInMs = date2 - date1;
    var diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours;
}


export { addHours, getTimeDiffInHours }

