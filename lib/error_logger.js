var winston = require("winston");

function Logger() {
  return winston.createLogger({
    level: "error",
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: "log/error.log" })],
  });
}

module.exports = new Logger();
