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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = void 0;
exports.initializeSentry = initializeSentry;
exports.captureCallError = captureCallError;
exports.captureWebSocketError = captureWebSocketError;
exports.addBreadcrumb = addBreadcrumb;
exports.setUser = setUser;
exports.clearUser = clearUser;
const Sentry = __importStar(require("@sentry/node"));
exports.Sentry = Sentry;
function initializeSentry(app) {
    if (!process.env.SENTRY_DSN) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
            // Filter out sensitive data
            if (event.request) {
                if (event.request.headers) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                }
                if (event.request.data && typeof event.request.data === 'object') {
                    // Remove sensitive fields from request body
                    const sensitiveFields = ['password', 'passwordHash', 'apiKey', 'token', 'secret'];
                    const data = event.request.data;
                    sensitiveFields.forEach(field => {
                        if (data[field]) {
                            data[field] = '[REDACTED]';
                        }
                    });
                }
            }
            return event;
        },
    });
    // Set up user context
    Sentry.setTag('service', 'websocket-server');
}
function captureCallError(sessionId, error, context) {
    Sentry.withScope(scope => {
        scope.setTag('call.session_id', sessionId);
        scope.setContext('call', context);
        Sentry.captureException(error);
    });
}
function captureWebSocketError(connectionId, error, context) {
    Sentry.withScope(scope => {
        scope.setTag('ws.connection_id', connectionId);
        scope.setContext('websocket', context);
        Sentry.captureException(error);
    });
}
function addBreadcrumb(message, category, data) {
    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
        timestamp: Date.now() / 1000,
    });
}
function setUser(userId, email) {
    Sentry.setUser({
        id: userId,
        email,
    });
}
function clearUser() {
    Sentry.setUser(null);
}
