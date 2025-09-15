Realtime transcription  
\======================

Learn how to transcribe audio in real-time with the Realtime API.

You can use the Realtime API for transcription-only use cases, either with input from a microphone or from a file. For example, you can use it to generate subtitles or transcripts in real-time. With the transcription-only mode, the model will not generate responses.

If you want the model to produce responses, you can use the Realtime API in \[speech-to-speech conversation mode\](/docs/guides/realtime-conversations).

Realtime transcription sessions  
\-------------------------------

To use the Realtime API for transcription, you need to create a transcription session, connecting via \[WebSockets\](/docs/guides/realtime?use-case=transcription\#connect-with-websockets) or \[WebRTC\](/docs/guides/realtime?use-case=transcription\#connect-with-webrtc).

Unlike the regular Realtime API sessions for conversations, the transcription sessions typically don't contain responses from the model.

The transcription session object is also different from regular Realtime API sessions:

\`\`\`json  
{  
  object: "realtime.transcription\_session",  
  id: string,  
  input\_audio\_format: string,  
  input\_audio\_transcription: \[{  
    model: string,  
    prompt: string,  
    language: string  
  }\],  
  turn\_detection: {  
    type: "server\_vad",  
    threshold: float,  
    prefix\_padding\_ms: integer,  
    silence\_duration\_ms: integer,  
  } | null,  
  input\_audio\_noise\_reduction: {  
    type: "near\_field" | "far\_field"  
  },  
  include: list\[string\] | null  
}  
\`\`\`

Some of the additional properties transcription sessions support are:

\*   \`input\_audio\_transcription.model\`: The transcription model to use, currently \`gpt-4o-transcribe\`, \`gpt-4o-mini-transcribe\`, and \`whisper-1\` are supported  
\*   \`input\_audio\_transcription.prompt\`: The prompt to use for the transcription, to guide the model (e.g. "Expect words related to technology")  
\*   \`input\_audio\_transcription.language\`: The language to use for the transcription, ideally in ISO-639-1 format (e.g. "en", "fr"...) to improve accuracy and latency  
\*   \`input\_audio\_noise\_reduction\`: The noise reduction configuration to use for the transcription  
\*   \`include\`: The list of properties to include in the transcription events

Possible values for the input audio format are: \`pcm16\` (default), \`g711\_ulaw\` and \`g711\_alaw\`.

You can find more information about the transcription session object in the \[API reference\](/docs/api-reference/realtime-sessions/transcription\_session\_object).

Handling transcriptions  
\-----------------------

When using the Realtime API for transcription, you can listen for the \`conversation.item.input\_audio\_transcription.delta\` and \`conversation.item.input\_audio\_transcription.completed\` events.

For \`whisper-1\` the \`delta\` event will contain full turn transcript, same as \`completed\` event. For \`gpt-4o-transcribe\` and \`gpt-4o-mini-transcribe\` the \`delta\` event will contain incremental transcripts as they are streamed out from the model.

Here is an example transcription delta event:

\`\`\`json  
{  
  "event\_id": "event\_2122",  
  "type": "conversation.item.input\_audio\_transcription.delta",  
  "item\_id": "item\_003",  
  "content\_index": 0,  
  "delta": "Hello,"  
}  
\`\`\`

Here is an example transcription completion event:

\`\`\`json  
{  
  "event\_id": "event\_2122",  
  "type": "conversation.item.input\_audio\_transcription.completed",  
  "item\_id": "item\_003",  
  "content\_index": 0,  
  "transcript": "Hello, how are you?"  
}  
\`\`\`

Note that ordering between completion events from different speech turns is not guaranteed. You should use \`item\_id\` to match these events to the \`input\_audio\_buffer.committed\` events and use \`input\_audio\_buffer.committed.previous\_item\_id\` to handle the ordering.

To send audio data to the transcription session, you can use the \`input\_audio\_buffer.append\` event.

You have 2 options:

\*   Use a streaming microphone input  
\*   Stream data from a wav file

Voice activity detection  
\------------------------

The Realtime API supports automatic voice activity detection (VAD). Enabled by default, VAD will control when the input audio buffer is committed, therefore when transcription begins.

Read more about configuring VAD in our \[Voice Activity Detection\](/docs/guides/realtime-vad) guide.

You can also disable VAD by setting the \`turn\_detection\` property to \`null\`, and control when to commit the input audio on your end.

Additional configurations  
\-------------------------

\#\#\# Noise reduction

You can use the \`input\_audio\_noise\_reduction\` property to configure how to handle noise reduction in the audio stream.

The possible values are:

\*   \`near\_field\`: Use near-field noise reduction.  
\*   \`far\_field\`: Use far-field noise reduction.  
\*   \`null\`: Disable noise reduction.

The default value is \`near\_field\`, and you can disable noise reduction by setting the property to \`null\`.

\#\#\# Using logprobs

You can use the \`include\` property to include logprobs in the transcription events, using \`item.input\_audio\_transcription.logprobs\`.

Those logprobs can be used to calculate the confidence score of the transcription.

\`\`\`json  
{  
  "type": "transcription\_session.update",  
  "input\_audio\_format": "pcm16",  
  "input\_audio\_transcription": {  
    "model": "gpt-4o-transcribe",  
    "prompt": "",  
    "language": ""  
  },  
  "turn\_detection": {  
    "type": "server\_vad",  
    "threshold": 0.5,  
    "prefix\_padding\_ms": 300,  
    "silence\_duration\_ms": 500,  
  },  
  "input\_audio\_noise\_reduction": {  
    "type": "near\_field"  
  },  
  "include": \[   
    "item.input\_audio\_transcription.logprobs",  
  \],  
}  
\`\`\`

Was this page useful?  
