import winston from 'winston';
import * as Sentry from '@sentry/node';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format,
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'rejections.log' })
  ]
});

export const logCallEvent = (sessionId: string, event: string, data?: any) => {
  logger.info(`[Call ${sessionId}] ${event}`, { sessionId, event, data });
};

export const logError = (error: Error, context?: any) => {
  logger.error(error.message, { error: error.stack, context });

  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

export const logWebSocketEvent = (connectionId: string, event: string, data?: any) => {
  logger.debug(`[WS ${connectionId}] ${event}`, { connectionId, event, data });
};

export const logAPIRequest = (method: string, path: string, statusCode: number, duration: number) => {
  logger.http(`${method} ${path} ${statusCode} ${duration}ms`, {
    method,
    path,
    statusCode,
    duration
  });
};

export const logRedisEvent = (operation: string, key: string, success: boolean) => {
  logger.debug(`[Redis] ${operation} ${key} ${success ? 'SUCCESS' : 'FAILED'}`, {
    operation,
    key,
    success
  });
};

export default logger;