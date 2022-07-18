var winston = require("winston");

function Logger() {
  return winston.createLogger({
    level: "warn",
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: "log/warning.log" })],
  });
}

module.exports = new Logger();
