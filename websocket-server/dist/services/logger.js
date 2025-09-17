"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRedisEvent = exports.logAPIRequest = exports.logWebSocketEvent = exports.logError = exports.logCallEvent = void 0;
const winston_1 = __importDefault(require("winston"));
const Sentry = __importStar(require("@sentry/node"));
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
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`));
const transports = [
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    }),
];
if (process.env.NODE_ENV === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: 'error.log',
        level: 'error',
        format,
    }), new winston_1.default.transports.File({
        filename: 'combined.log',
        format,
    }));
}
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'exceptions.log' })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'rejections.log' })
    ]
});
const logCallEvent = (sessionId, event, data) => {
    logger.info(`[Call ${sessionId}] ${event}`, { sessionId, event, data });
};
exports.logCallEvent = logCallEvent;
const logError = (error, context) => {
    logger.error(error.message, { error: error.stack, context });
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureException(error, { extra: context });
    }
};
exports.logError = logError;
const logWebSocketEvent = (connectionId, event, data) => {
    logger.debug(`[WS ${connectionId}] ${event}`, { connectionId, event, data });
};
exports.logWebSocketEvent = logWebSocketEvent;
const logAPIRequest = (method, path, statusCode, duration) => {
    logger.http(`${method} ${path} ${statusCode} ${duration}ms`, {
        method,
        path,
        statusCode,
        duration
    });
};
exports.logAPIRequest = logAPIRequest;
const logRedisEvent = (operation, key, success) => {
    logger.debug(`[Redis] ${operation} ${key} ${success ? 'SUCCESS' : 'FAILED'}`, {
        operation,
        key,
        success
    });
};
exports.logRedisEvent = logRedisEvent;
exports.default = logger;
