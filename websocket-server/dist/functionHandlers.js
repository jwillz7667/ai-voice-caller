"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = [];
// Transfer call function
functions.push({
    schema: {
        name: "transfer_call",
        type: "function",
        description: "Transfer the current call to another phone number. Use this when you need to connect the caller to a live team member, support agent, or another department.",
        parameters: {
            type: "object",
            properties: {
                phone_number: {
                    type: "string",
                    description: "The phone number to transfer to (in E.164 format, e.g., +14155551234)"
                },
                reason: {
                    type: "string",
                    description: "Brief reason for the transfer"
                }
            },
            required: ["phone_number"],
        },
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Initiating call transfer to ${args.phone_number}. Reason: ${args.reason || 'Not specified'}`);
        // Validate phone number format (basic E.164 validation)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(args.phone_number)) {
            return JSON.stringify({
                success: false,
                error: "Invalid phone number format. Please use E.164 format (e.g., +14155551234)"
            });
        }
        // Note: The actual transfer will be handled by the session manager
        // This returns instructions that the AI should follow
        return JSON.stringify({
            success: true,
            action: "transfer",
            phone_number: args.phone_number,
            message: `I'm now transferring you to ${args.phone_number}. Please stay on the line.`,
            reason: args.reason
        });
    }),
});
// Dial extension function for IVR systems
functions.push({
    schema: {
        name: "dial_extension",
        type: "function",
        description: "Dial an extension number or navigate through an IVR menu system. Use this to press numbers during a call.",
        parameters: {
            type: "object",
            properties: {
                digits: {
                    type: "string",
                    description: "The digits to dial (0-9, *, #). Can be a single digit or a sequence."
                },
                purpose: {
                    type: "string",
                    description: "What this extension or menu option is for"
                }
            },
            required: ["digits"],
        },
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Dialing extension/digits: ${args.digits}. Purpose: ${args.purpose || 'Not specified'}`);
        // Validate digits (only 0-9, *, #)
        const digitsRegex = /^[0-9*#]+$/;
        if (!digitsRegex.test(args.digits)) {
            return JSON.stringify({
                success: false,
                error: "Invalid digits. Only 0-9, *, and # are allowed."
            });
        }
        return JSON.stringify({
            success: true,
            action: "dial",
            digits: args.digits,
            message: `Dialing ${args.digits}`,
            purpose: args.purpose
        });
    }),
});
// Get current call information
functions.push({
    schema: {
        name: "get_call_info",
        type: "function",
        description: "Get information about the current call",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    handler: () => __awaiter(void 0, void 0, void 0, function* () {
        // This would typically return actual call information from the session
        return JSON.stringify({
            duration: "ongoing",
            status: "connected",
            capabilities: ["transfer", "dial_extension", "end_call"]
        });
    }),
});
// Weather function (keeping existing)
functions.push({
    schema: {
        name: "get_weather_from_coords",
        type: "function",
        description: "Get the current weather",
        parameters: {
            type: "object",
            properties: {
                latitude: {
                    type: "number",
                },
                longitude: {
                    type: "number",
                },
            },
            required: ["latitude", "longitude"],
        },
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const response = yield fetch(`https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`);
        const data = yield response.json();
        const currentTemp = (_a = data.current) === null || _a === void 0 ? void 0 : _a.temperature_2m;
        return JSON.stringify({ temp: currentTemp });
    }),
});
exports.default = functions;
