import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/types";

type FunctionCallsPanelProps = {
  items: Item[];
  ws?: WebSocket | null;
  sendMessage?: (message: any) => void;
  callSid?: string | null;
};

const FunctionCallsPanel: React.FC<FunctionCallsPanelProps> = ({
  items,
  ws,
  sendMessage,
  callSid,
}) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [dtmfStatus, setDtmfStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

  // Filter function_call items
  const functionCalls = items.filter((it) => it.type === "function_call");

  // For each function_call, check for a corresponding function_call_output
  const functionCallsWithStatus = functionCalls.map((call) => {
    const outputs = items.filter(
      (it) => it.type === "function_call_output" && it.call_id === call.call_id
    );
    const outputItem = outputs[0];
    const completed = !!outputItem;
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

  const handleSendDtmf = async (callId: string, digits: string) => {
    if (!callSid) {
      console.error("Cannot send DTMF: Active call SID is missing.");
      setDtmfStatus(prev => ({...prev, [callId]: 'error'}));
      if (sendMessage) {
         sendMessage({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({success: false, error: "Missing call SID"}) },
         });
      }
      return;
    }
    if (!digits) {
        console.error("Cannot send DTMF: Digits are missing.");
        setDtmfStatus(prev => ({...prev, [callId]: 'error'}));
        if (sendMessage) {
             sendMessage({
                type: "conversation.item.create",
                item: { type: "function_call_output", call_id: callId, output: JSON.stringify({success: false, error: "Missing digits"}) },
             });
        }
        return;
    }

    setDtmfStatus(prev => ({...prev, [callId]: 'sending'}));
    console.log(`Sending DTMF digits "${digits}" for call ${callSid}`);

    try {
      // Make sure the endpoint /api/twilio/send-dtmf exists and is configured correctly
      const response = await fetch("/api/twilio/send-dtmf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callSid, digits }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send DTMF via API");
      }

      console.log("DTMF sent successfully via API:", result);
      setDtmfStatus(prev => ({...prev, [callId]: 'sent'}));

      // Send function_call_output back to backend upon success
      if (sendMessage) {
        sendMessage({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({success: true, digitsSent: digits})},
        });
      }

    } catch (error: any) {
      console.error("Error sending DTMF:", error);
      setDtmfStatus(prev => ({...prev, [callId]: 'error'}));
       if (sendMessage) {
         sendMessage({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({success: false, error: error.message || "API Error"}) },
         });
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
            {functionCallsWithStatus.map((call) => {
              const isDtmfCall = call.name === "send_dtmf";
              const currentDtmfStatus = dtmfStatus[call.call_id || ''] || 'idle';

              useEffect(() => {
                 if (isDtmfCall && !call.completed && currentDtmfStatus === 'idle' && call.call_id) {
                    const digits = call.params?.digits;
                    if (typeof digits === 'string' && digits.length > 0) {
                        handleSendDtmf(call.call_id, digits);
                    } else {
                        console.error("DTMF 'digits' parameter missing, empty, or invalid in params:", call.params);
                        setDtmfStatus(prev => ({...prev, [call.call_id!]: 'error'}));
                         if (sendMessage && call.call_id) {
                            sendMessage({
                                type: "conversation.item.create",
                                item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify({success: false, error: "Invalid or missing 'digits' parameter"}) },
                            });
                         }
                    }
                 }
              }, [call.id, call.completed, isDtmfCall, currentDtmfStatus, call.params?.digits, call.call_id, sendMessage, callSid]);

              return (
                <div
                  key={call.id || call.call_id}
                  className="rounded-lg border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{call.name}</h3>
                    <Badge variant={call.completed ? "default" : (isDtmfCall && currentDtmfStatus !== 'idle' ? (currentDtmfStatus === 'sent' ? 'success' : currentDtmfStatus === 'error' ? 'destructive' : 'secondary') : "secondary")}>
                       {isDtmfCall ?
                          (currentDtmfStatus === 'sending' ? 'Sending...' :
                           currentDtmfStatus === 'sent' ? 'Sent' :
                           currentDtmfStatus === 'error' ? 'Error' :
                           (call.completed ? 'Completed' : 'Pending Send'))
                          : (call.completed ? 'Completed' : 'Pending Input')}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground font-mono break-all">
                    {JSON.stringify(call.params)}
                  </div>

                  {isDtmfCall ? (
                    <div className="text-sm text-muted-foreground italic min-h-[3rem]">
                        {currentDtmfStatus === 'sending' && `Sending digits: ${call.params?.digits}...`}
                        {currentDtmfStatus === 'sent' && `Sent digits: ${call.params?.digits}.`}
                        {currentDtmfStatus === 'error' && `Error sending digits: ${call.params?.digits}.`}
                        {currentDtmfStatus === 'idle' && !call.completed && `Preparing to send digits: ${call.params?.digits}...`}
                        {call.completed && call.response && (
                            <div className="text-sm rounded-md bg-muted p-3 mt-2 italic-off">
                                <pre className="whitespace-pre-wrap break-all">
                                    {(() => {
                                        try {
                                            return JSON.stringify(JSON.parse(call.response || ""), null, 2);
                                        } catch {
                                            return call.response || "";
                                        }
                                    })()}
                                </pre>
                            </div>
                        )}
                    </div>
                  ) : !call.completed ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter response"
                        value={responses[call.call_id || ""] || ""}
                        onChange={(e) =>
                          handleChange(call.call_id || "", e.target.value)
                        }
                        disabled={!call.call_id}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                             if (call.call_id) {
                                handleSubmit(call.call_id, responses[call.call_id] || "")
                             }
                         }}
                        disabled={!call.call_id || !responses[call.call_id || ""]}
                        className="w-full"
                      >
                        Submit Response
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm rounded-md bg-muted p-3">
                       <pre className="whitespace-pre-wrap break-all">
                          {(() => {
                              try {
                                  return JSON.stringify(JSON.parse(call.response || ""), null, 2);
                              } catch {
                                  return call.response || "";
                              }
                          })()}
                       </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FunctionCallsPanel;
