import * as Sentry from '@sentry/node';
import { Application } from 'express';

export function initializeSentry(app?: Application) {
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
          const data = event.request.data as Record<string, any>;
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

export function captureCallError(sessionId: string, error: Error, context?: any) {
  Sentry.withScope(scope => {
    scope.setTag('call.session_id', sessionId);
    scope.setContext('call', context);
    Sentry.captureException(error);
  });
}

export function captureWebSocketError(connectionId: string, error: Error, context?: any) {
  Sentry.withScope(scope => {
    scope.setTag('ws.connection_id', connectionId);
    scope.setContext('websocket', context);
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

export function setUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

export { Sentry };