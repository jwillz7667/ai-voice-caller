// Catalog of OpenAI Realtime event types, grouped by domain.
// This is used for validation and to keep handlers comprehensive.

export const SessionEvents = [
  'session.created',
  'session.updated',
] as const;

export const InputAudioBufferEvents = [
  'input_audio_buffer.cleared',
  'input_audio_buffer.speech_started',
  'input_audio_buffer.speech_stopped',
  'input_audio_buffer.timeout_triggered',
  // Twilio path doesn’t use committed response, but server may emit
  'input_audio_buffer.committed',
] as const;

export const ConversationEvents = [
  'conversation.item.created',
  'conversation.item.deleted',
  'conversation.item.input_audio_transcription.completed',
] as const;

export const ResponseCoreEvents = [
  'response.created',
  'response.output_item.added',
  'response.output_item.done',
  'response.done',
  'error',
] as const;

export const ResponseTextEvents = [
  'response.text.delta',
  'response.text.done',
  'response.output_text.delta',
  'response.output_text.done',
] as const;

export const ResponseAudioEvents = [
  'response.audio.delta',
  'response.audio.done',
  'response.output_audio.delta',
  'response.output_audio.done',
  'response.audio_transcript.delta',
  'response.output_audio_transcript.delta',
  'response.output_audio_transcript.done',
] as const;

export const FunctionToolEvents = [
  'response.function_call_arguments.delta',
  'response.function_call_arguments.done',
  'response.tool_call_arguments.delta',
  'response.tool_call_arguments.done',
] as const;

export const MCPEvents = [
  'response.mcp_call.in_progress',
  'response.mcp_call.completed',
  'response.mcp_call_arguments.delta',
  'response.mcp_call_arguments.done',
  'mcp_list_tools.in_progress',
  'mcp_list_tools.completed',
] as const;

export const AllRealtimeEvents = new Set<string>([
  ...SessionEvents,
  ...InputAudioBufferEvents,
  ...ConversationEvents,
  ...ResponseCoreEvents,
  ...ResponseTextEvents,
  ...ResponseAudioEvents,
  ...FunctionToolEvents,
  ...MCPEvents,
]);

export function isKnownRealtimeEvent(type: string): boolean {
  return AllRealtimeEvents.has(type);
}

