"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Phone } from "lucide-react";
import { BackendTag } from "@/components/backend-tag";

interface OutgoingCallProps {
  onCallInitiated?: (phoneNumber: string, details?: any) => void;
  currentConfig?: any; 
}

export default function OutgoingCall({ onCallInitiated, currentConfig }: OutgoingCallProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "error" | "connected">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [callSid, setCallSid] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setError('');
    
    try {
      // Log detailed information about the outgoing call attempt
      if (onCallInitiated) {
        onCallInitiated(phoneNumber);
      }
      
      // Make API call to initiate the call
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phoneNumber,
          config: currentConfig || {} 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to initiate call");
      }
      
      // Add detailed success logging
      if (onCallInitiated) {
        onCallInitiated('outgoing_call_success', {
          phoneNumber,
          callSid: result.callSid,
          timestamp: new Date().toISOString(),
          responseStatus: response.status,
          responseDetails: result
        });
      }
      
      setCallSid(result.callSid);
      setCallStatus("connected");
      setStatus(`Call initiated to ${phoneNumber}`);
    } catch (err: any) {
      console.error('Error initiating call:', err);
      setError(err.message || 'Failed to initiate call');
      
      // Log detailed error information
      if (onCallInitiated) {
        onCallInitiated('outgoing_call_error', {
          phoneNumber,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
      setCallStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium">Make Outgoing Call</h3>
        </div>
        <BackendTag />
      </div>

      <div className="space-y-3">
        <div className="p-4 border rounded-md shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Make Outgoing Call</h3>
            <BackendTag />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Enter a phone number to initiate an outgoing call using your configured Twilio phone number.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input 
                type="tel" 
                placeholder="Enter phone number (e.g. +1234567890)" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
                disabled={callStatus === "calling" || loading}
              />
              <Button
                type="submit"
                disabled={callStatus === "calling" || loading || !phoneNumber.trim()}
                className={callStatus === "connected" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {callStatus === "idle" ? "Call" : 
                  callStatus === "calling" ? "Calling..." :
                  callStatus === "connected" ? "Connected" : "Call"}
              </Button>
            </div>

            {callStatus === "error" && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {callStatus === "connected" && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Call connected (SID: {callSid.substring(0, 8)}...)
                </Badge>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
