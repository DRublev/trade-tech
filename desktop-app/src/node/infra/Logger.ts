import * as util from 'util';
import * as path from 'path';
import * as winston from "winston";
import Sentry from 'winston-sentry-log';


interface ExtendedLogger extends winston.Logger { }

const format = winston.format.combine(
  winston.format.timestamp({
    format: "YY-MM-DD HH:MM:SS",
  }),

  winston.format.printf(
    info => {
      const args = info[Symbol.for('splat') as any];
      if (args) { info.message = util.format(info.message, ...args); }
      return `[${info.timestamp}] ${info.level}: ${info.message}`
    },
  ),
);


const transports: winston.transport[] = [
  new winston.transports.Console({}),
  new winston.transports.File({
    filename: path.resolve(__dirname, '../../data-storage/logs/logs.log'),
    level: 'info',
  }),
  new winston.transports.File({
    filename: path.resolve(__dirname, '../../data-storage/logs/errors.log'),
    level: 'warn',
  }),
];

if (process.env.SENTRY_DSN) {
  const sentryOptions = {
    config: {
      dsn: process.env.SENTRY_DSN,
    },
  };
  transports.push(new Sentry(sentryOptions));
}

const logger = winston.createLogger({ format, transports });

export default logger as ExtendedLogger;
