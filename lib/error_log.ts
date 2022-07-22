import * as winston from "winston";

const errorLog = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "log/error.log" })],
});

export default errorLog;
