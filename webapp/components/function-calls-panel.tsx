import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/types";

type FunctionCallsPanelProps = {
  items: Item[];
  ws?: WebSocket | null; // pass down ws from parent
  sendMessage?: (message: any) => void; // Custom message sender with logging
};

const FunctionCallsPanel: React.FC<FunctionCallsPanelProps> = ({
  items,
  ws,
  sendMessage,
}) => {
  const [responses, setResponses] = useState<Record<string, string>>({});

  // Filter function_call items
  const functionCalls = items.filter((it) => it.type === "function_call");

  // For each function_call, check for a corresponding function_call_output
  const functionCallsWithStatus = functionCalls.map((call) => {
    const outputs = items.filter(
      (it) => it.type === "function_call_output" && it.call_id === call.call_id
    );
    const outputItem = outputs[0];
    const completed = call.status === "completed" || !!outputItem;
    const response = outputItem ? outputItem.output : undefined;
    return {
      ...call,
      completed,
      response,
    };
  });

  const handleChange = (call_id: string, value: string) => {
    setResponses((prev) => ({ ...prev, [call_id]: value }));
  };

  const handleSubmit = (callId: string, output: string) => {
    console.log("Submitting output for function call:", { callId, output });
    setResponses({ ...responses, [callId]: "" });

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const message = {
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: output,
          },
        };

        // Use sendMessage if available, otherwise use ws.send directly
        if (sendMessage) {
          sendMessage(message);
        } else {
          ws.send(JSON.stringify(message));
        }

        // Send a response.create message to trigger the assistant to respond
        const createResponse = { type: "response.create" };
        
        if (sendMessage) {
          sendMessage(createResponse);
        } else {
          ws.send(JSON.stringify(createResponse));
        }
      } catch (error) {
        console.error("Error sending output:", error);
      }
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="space-y-1.5 pb-0">
        <CardTitle className="text-base font-semibold">
          Function Calls
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {functionCallsWithStatus.map((call) => (
              <div
                key={call.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{call.name}</h3>
                  <Badge variant={call.completed ? "default" : "secondary"}>
                    {call.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground font-mono break-all">
                  {JSON.stringify(call.params)}
                </div>

                {!call.completed ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter response"
                      value={responses[call.call_id || ""] || ""}
                      onChange={(e) =>
                        handleChange(call.call_id || "", e.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSubmit(call.call_id || "", responses[call.call_id || ""] || "")
                      }
                      disabled={!responses[call.call_id || ""]}
                      className="w-full"
                    >
                      Submit Response
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm rounded-md bg-muted p-3">
                    {JSON.stringify(JSON.parse(call.response || ""))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FunctionCallsPanel;
