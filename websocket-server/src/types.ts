import { WebSocket } from "ws";

export interface Session {
  twilioConn?: WebSocket;
  frontendConn?: WebSocket;
  modelConn?: WebSocket;
  config?: any;
  streamSid?: string;
  recordCall?: boolean;
  recordingType?: string;
  recordings?: Recording[];
}

export interface Recording {
  sid: string;
  status: string;
  url: string;
  duration?: string;
  channels?: string;
  source?: string;
  callSid: string;
  timestamp: string;
}

export interface FunctionCallItem {
  name: string;
  arguments: string;
  call_id?: string;
}

export interface FunctionSchema {
  name: string;
  type: "function";
  description?: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

export interface FunctionHandler {
  schema: FunctionSchema;
  handler: (args: any) => Promise<string>;
}
