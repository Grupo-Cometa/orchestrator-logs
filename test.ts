// import { Log } from "./src";

// const log = new Log('', 'CRITICAL');

// log.save()

const currentDate = new Date;
const logFilename = `${currentDate.getDate()}-${currentDate.getMonth()}`
console.log(logFilename)