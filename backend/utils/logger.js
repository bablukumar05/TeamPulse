const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'teampulse-api' },
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') })
  ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Morgan HTTP logger stream integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
