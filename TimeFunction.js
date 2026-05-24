

function addHours(date,hours) {
    const newDate = new Date(date.getTime());
    newDate.setMinutes(newDate.getMinutes() + hours * 60);
    return newDate;
}

function getTimeDiffInHours(date1, date2) {
    var diffInMs = date2 - date1;
    var diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours;
}


export { addHours, getTimeDiffInHours }

