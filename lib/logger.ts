import * as winston from "winston";

const logger = winston.createLogger({
  level: "warn",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "log/warning.log" })],
});

export default logger;
