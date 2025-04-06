export const toolTemplates = [
  {
    name: "get_weather",
    type: "function",
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
      },
    },
  },
  {
    name: "ping_no_args",
    type: "function",
    description: "A simple ping tool with no arguments",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_nested_args",
    type: "function",
    description: "Fetch user profile by nested identifier",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            metadata: {
              type: "object",
              properties: {
                region: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  {
    name: "calculate_route_more_properties",
    type: "function",
    description: "Calculate travel route with multiple parameters",
    parameters: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        mode: { type: "string", enum: ["car", "bike", "walk"] },
        options: {
          type: "object",
          properties: {
            avoid_highways: { type: "boolean" },
            scenic_route: { type: "boolean" },
          },
        },
      },
    },
  },
  {
    name: "send_dtmf",
    description: "Sends DTMF (keypad) tones during an active phone call. Use this when the conversation requires pressing numbers on a keypad, for example, to navigate an IVR menu (e.g., 'press 1 for sales').",
    parameters: {
      type: "object",
      properties: {
        digits: {
          type: "string",
          description: "The sequence of digits to send. Allowed characters are 0-9, *, #. Use 'w' for a 0.5-second pause between digits if needed (e.g., '12w3')."
        }
      },
      required: ["digits"]
    }
  }
];
