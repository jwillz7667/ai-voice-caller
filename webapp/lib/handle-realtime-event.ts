import { Item } from "@/components/types";

export default function handleRealtimeEvent(
  ev: any,
  setItems: React.Dispatch<React.SetStateAction<Item[]>>
) {
  // Helper function to create a new item with default fields
  function createNewItem(base: Partial<Item>): Item {
    return {
      object: "realtime.item",
      timestamp: new Date().toLocaleTimeString(),
      ...base,
    } as Item;
  }

  // Helper function to update an existing item if found by id, or add a new one if not.
  // We can also pass partial updates to reduce repetitive code.
  function updateOrAddItem(id: string, updates: Partial<Item>): void {
    setItems((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...updates };
        return updated;
      } else {
        return [...prev, createNewItem({ id, ...updates })];
      }
    });
  }

  const { type } = ev;

  switch (type) {
    case "session.created": {
      // Starting a new session, clear all items
      setItems([]);
      break;
    }

    case "input_audio_buffer.speech_started": {
      // Create a user message item with running status and placeholder content
      const { item_id } = ev;
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: item_id,
          type: "message",
          role: "user",
          content: [{ type: "text", text: "..." }],
          status: "running",
        }),
      ]);
      break;
    }

    case "conversation.item.created": {
      const { item } = ev;
      if (item.type === "message") {
        // A completed message from user or assistant
        const updatedContent =
          item.content && item.content.length > 0 ? item.content : [];
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...item,
              content: updatedContent,
              status: "completed",
              timestamp:
                updated[idx].timestamp || new Date().toLocaleTimeString(),
            };
            return updated;
          } else {
            return [
              ...prev,
              createNewItem({
                ...item,
                content: updatedContent,
                status: "completed",
              }),
            ];
          }
        });
      }
      // NOTE: We no longer handle function_call items here.
      // The handling of function_call items has been moved to the "response.output_item.done" event.
      else if (item.type === "function_call_output") {
        // Function call output item created
        // Add the output item and mark the corresponding function_call as completed
        // Also display in transcript as tool message with the response
        setItems((prev) => {
          const newItems = [
            ...prev,
            createNewItem({
              ...item,
              role: "tool",
              content: [
                {
                  type: "text",
                  text: `Function call response: ${item.output}`,
                },
              ],
              status: "completed",
            }),
          ];

          return newItems.map((m) =>
            m.call_id === item.call_id && m.type === "function_call"
              ? { ...m, status: "completed" }
              : m
          );
        });
      }
      break;
    }

    case "conversation.item.deleted": {
      const { item_id } = ev;
      setItems((prev) => prev.filter((m) => m.id !== item_id));
      break;
    }

    case "conversation.item.input_audio_transcription.completed": {
      // Update the user message with the final transcript
      const { item_id, transcript } = ev;
      setItems((prev) =>
        prev.map((m) =>
          m.id === item_id && m.type === "message" && m.role === "user"
            ? {
                ...m,
                content: [{ type: "text", text: transcript }],
                status: "completed",
              }
            : m
        )
      );
      break;
    }

    case "response.content_part.added": {
      const { item_id, part, output_index } = ev;
      // Append new content to the assistant message if output_index == 0
      if (part.type === "text" && output_index === 0) {
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item_id);
          if (idx >= 0) {
            const updated = [...prev];
            const existingContent = updated[idx].content || [];
            updated[idx] = {
              ...updated[idx],
              content: [
                ...existingContent,
                { type: part.type, text: part.text },
              ],
            };
            return updated;
          } else {
            // If the item doesn't exist yet, create it as a running assistant message
            return [
              ...prev,
              createNewItem({
                id: item_id,
                type: "message",
                role: "assistant",
                content: [{ type: part.type, text: part.text }],
                status: "running",
              }),
            ];
          }
        });
      }
      break;
    }

    case "response.output_audio_transcript.delta":
    case "response.audio_transcript.delta": {
      // Streaming transcript text (assistant)
      const { item_id, delta, output_index } = ev;
      if (output_index === 0 && delta) {
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item_id);
          if (idx >= 0) {
            const updated = [...prev];
            const existingContent = updated[idx].content || [];
            updated[idx] = {
              ...updated[idx],
              content: [...existingContent, { type: "text", text: delta }],
            };
            return updated;
          } else {
            return [
              ...prev,
              createNewItem({
                id: item_id,
                type: "message",
                role: "assistant",
                content: [{ type: "text", text: delta }],
                status: "running",
              }),
            ];
          }
        });
      }
      break;
    }

    case "response.output_audio_transcript.done": {
      // Nothing specific needed; the streaming delta has already populated text.
      break;
    }

    case "response.output_item.done": {
      const { item } = ev;
      if (item.type === "function_call") {
        // A new function call item
        // Display it in the transcript as an assistant message indicating a function is being requested
        console.log("function_call", item);
        setItems((prev) => [
          ...prev,
          createNewItem({
            ...item,
            role: "assistant",
            content: [
              {
                type: "text",
                text: `${item.name}(${JSON.stringify(
                  JSON.parse(item.arguments)
                )})`,
              },
            ],
            status: "running",
          }),
        ]);
      }
      break;
    }

    // Function/tool args streaming
    case "response.function_call_arguments.delta":
    case "response.tool_call_arguments.delta": {
      const { call_id, delta } = ev;
      // Append visible streaming args as a single assistant line for clarity
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `args_${call_id}_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: `args: ${delta}` }],
          status: "running",
        }),
      ]);
      break;
    }
    case "response.function_call_arguments.done":
    case "response.tool_call_arguments.done": {
      // No extra UI action; the function_call item will be shown and tool_result follows
      break;
    }

    // MCP tool calls and list tools
    case "response.mcp_call.in_progress": {
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: ev.item_id || `mcp_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "MCP call in progress…" }],
          status: "running",
        }),
      ]);
      break;
    }
    case "response.mcp_call.completed": {
      // Mark completion with a simple message entry
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `mcp_done_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "MCP call completed" }],
          status: "completed",
        }),
      ]);
      break;
    }
    case "response.mcp_call_arguments.delta": {
      // Stream mcp args as text for visibility
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `mcp_args_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: `mcp args: ${ev.delta}` }],
          status: "running",
        }),
      ]);
      break;
    }
    case "response.mcp_call_arguments.done": {
      break;
    }
    case "mcp_list_tools.in_progress": {
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `mcp_list_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Listing MCP tools…" }],
          status: "running",
        }),
      ]);
      break;
    }
    case "mcp_list_tools.completed": {
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `mcp_list_done_${Date.now()}`,
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "MCP tools listing completed" }],
          status: "completed",
        }),
      ]);
      break;
    }

    // Handle error events
    case "error": {
      const { error } = ev;
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: `error_${Date.now()}`,
          type: "message",
          role: "system",
          content: [
            {
              type: "text",
              text: `Error: ${error?.message || error?.type || JSON.stringify(error)}`,
            },
          ],
          status: "error",
        }),
      ]);
      break;
    }

    // Handle audio transcription deltas
    case "conversation.item.input_audio_transcription.delta":
    case "response.audio_transcript.delta": {
      const { item_id, transcript, delta } = ev;
      const text = transcript || delta || "";
      if (item_id && text) {
        setItems((prev) =>
          prev.map((m) =>
            m.id === item_id
              ? {
                  ...m,
                  formatted: {
                    ...m.formatted,
                    transcript: (m.formatted?.transcript || "") + text,
                  },
                }
              : m
          )
        );
      }
      break;
    }

    // Handle response audio delta with transcription
    case "response.audio.delta":
    case "response.output_audio.delta": {
      const { item_id } = ev;
      // Mark that audio is being received
      if (item_id) {
        updateOrAddItem(item_id, {
          type: "message",
          role: "assistant",
          status: "streaming_audio",
        });
      }
      break;
    }

    default:
      break;
  }
}
