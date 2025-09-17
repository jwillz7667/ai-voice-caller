"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock environment variables for testing
(0, vitest_1.beforeAll)(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8082';
    process.env.PUBLIC_URL = 'http://localhost:8082';
    process.env.ALLOWED_ORIGIN = 'http://localhost:3000';
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
});
// Clean up after all tests
(0, vitest_1.afterAll)(() => {
    // Close any open connections
});
// Reset mocks before each test
(0, vitest_1.beforeEach)(() => {
    // Reset any mocks or test data
});
// Clean up after each test
(0, vitest_1.afterEach)(() => {
    // Clean up test data
});
