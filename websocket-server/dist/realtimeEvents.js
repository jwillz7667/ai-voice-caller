"use strict";
// Catalog of OpenAI Realtime event types, grouped by domain.
// This is used for validation and to keep handlers comprehensive.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllRealtimeEvents = exports.MCPEvents = exports.FunctionToolEvents = exports.ResponseAudioEvents = exports.ResponseTextEvents = exports.ResponseCoreEvents = exports.ConversationEvents = exports.InputAudioBufferEvents = exports.SessionEvents = void 0;
exports.isKnownRealtimeEvent = isKnownRealtimeEvent;
exports.SessionEvents = [
    'session.created',
    'session.updated',
];
exports.InputAudioBufferEvents = [
    'input_audio_buffer.cleared',
    'input_audio_buffer.speech_started',
    'input_audio_buffer.speech_stopped',
    'input_audio_buffer.timeout_triggered',
    // Twilio path doesn’t use committed response, but server may emit
    'input_audio_buffer.committed',
];
exports.ConversationEvents = [
    'conversation.item.created',
    'conversation.item.deleted',
    'conversation.item.input_audio_transcription.completed',
];
exports.ResponseCoreEvents = [
    'response.created',
    'response.output_item.added',
    'response.output_item.done',
    'response.done',
    'error',
];
exports.ResponseTextEvents = [
    'response.text.delta',
    'response.text.done',
    'response.output_text.delta',
    'response.output_text.done',
];
exports.ResponseAudioEvents = [
    'response.audio.delta',
    'response.audio.done',
    'response.output_audio.delta',
    'response.output_audio.done',
    'response.audio_transcript.delta',
    'response.output_audio_transcript.delta',
    'response.output_audio_transcript.done',
];
exports.FunctionToolEvents = [
    'response.function_call_arguments.delta',
    'response.function_call_arguments.done',
    'response.tool_call_arguments.delta',
    'response.tool_call_arguments.done',
];
exports.MCPEvents = [
    'response.mcp_call.in_progress',
    'response.mcp_call.completed',
    'response.mcp_call_arguments.delta',
    'response.mcp_call_arguments.done',
    'mcp_list_tools.in_progress',
    'mcp_list_tools.completed',
];
exports.AllRealtimeEvents = new Set([
    ...exports.SessionEvents,
    ...exports.InputAudioBufferEvents,
    ...exports.ConversationEvents,
    ...exports.ResponseCoreEvents,
    ...exports.ResponseTextEvents,
    ...exports.ResponseAudioEvents,
    ...exports.FunctionToolEvents,
    ...exports.MCPEvents,
]);
function isKnownRealtimeEvent(type) {
    return exports.AllRealtimeEvents.has(type);
}
