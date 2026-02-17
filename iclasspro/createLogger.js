const path = require("path");
const winston = require("winston");

function createLogger() {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "..", "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "..", "combined.log"),
      }),
      new winston.transports.Console({ format: winston.format.simple() }),
    ],
  });
}

module.exports = createLogger;
