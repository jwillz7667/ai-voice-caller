"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../services/logger");
function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log request
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    // Capture the original end function
    const originalEnd = res.end;
    // Override the end function to log response
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        (0, logger_1.logAPIRequest)(req.method, req.path, res.statusCode, duration);
        // Call the original end function
        return originalEnd.apply(res, args);
    };
    next();
}
