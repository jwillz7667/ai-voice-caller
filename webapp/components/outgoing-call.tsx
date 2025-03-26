"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Phone, PhoneCall, PhoneOff, CheckCircle2, Coins } from "lucide-react";
import { BackendTag } from "@/components/backend-tag";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface OutgoingCallProps {
  onCallInitiated?: (phoneNumber: string, details?: any) => void;
  currentConfig?: any; 
}

const CREDITS_PER_MINUTE = 1;
const MIN_REQUIRED_CREDITS = 1; // Minimum credits required to make a call

export default function OutgoingCall({ onCallInitiated, currentConfig }: OutgoingCallProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "error" | "connected">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [callSid, setCallSid] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to make calls");
      setErrorMessage("Authentication required. Please sign in to make calls.");
      setCallStatus("error");
      return;
    }
    
    // Check if user has enough credits
    if (!profile || profile.credits < MIN_REQUIRED_CREDITS) {
      toast.error(`You need at least ${MIN_REQUIRED_CREDITS} credits to make a call`);
      setErrorMessage(`Insufficient credits. You need at least ${MIN_REQUIRED_CREDITS} credits to make a call.`);
      setCallStatus("error");
      return;
    }
    
    setLoading(true);
    setStatus('');
    setError('');
    setCallStatus("calling");
    
    try {
      // Log detailed information about the outgoing call attempt
      if (onCallInitiated) {
        onCallInitiated(phoneNumber);
      }
      
      // Set call start time for tracking duration
      setCallStartTime(new Date());
      
      // Make API call to initiate the call
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phoneNumber,
          config: currentConfig || {},
          userId: user.id,
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
      setErrorMessage(err.message || 'Failed to initiate call');
      
      // Log detailed error information
      if (onCallInitiated) {
        onCallInitiated('outgoing_call_error', {
          phoneNumber,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
      setCallStatus("error");
      setCallStartTime(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg mr-3">
          <PhoneCall className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Outgoing Call</h3>
        <div className="ml-auto flex items-center gap-2">
          {user && profile && (
            <div className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-300 mr-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{profile.credits || 0} credits</span>
            </div>
          )}
          <BackendTag />
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input 
                type="tel" 
                placeholder="Enter phone number (e.g. +1234567890)" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`pl-12 h-12 text-base rounded-xl border-gray-200 dark:border-gray-700 shadow-sm ${
                  callStatus === "connected" ? "border-green-500 ring-1 ring-green-500" : 
                  callStatus === "error" ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                disabled={callStatus === "calling" || loading}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Phone className="h-5 w-5" />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={callStatus === "calling" || loading || !phoneNumber.trim() || (profile ? profile.credits < MIN_REQUIRED_CREDITS : true)}
              className={`h-12 rounded-xl transition-all duration-300 ${
                callStatus === "connected" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : callStatus === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : callStatus === "calling"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {callStatus === "idle" && <PhoneCall className="h-5 w-5" />}
                {callStatus === "calling" && (
                  <>
                    <span className="animate-pulse">Calling</span>
                    <span className="animate-pulse delay-100">.</span>
                    <span className="animate-pulse delay-200">.</span>
                    <span className="animate-pulse delay-300">.</span>
                  </>
                )}
                {callStatus === "connected" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-1" />
                    Connected
                  </>
                )}
                {callStatus === "error" && (
                  <>
                    <PhoneOff className="h-5 w-5 mr-1" />
                    Retry Call
                  </>
                )}
                {callStatus === "idle" && "Make Call"}
              </div>
            </Button>
          </div>

          {profile && profile.credits < MIN_REQUIRED_CREDITS && callStatus === "idle" && (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p>You need at least {MIN_REQUIRED_CREDITS} credits to make a call.</p>
                <Link href="/dashboard/credits" className="text-primary font-medium hover:underline">
                  Purchase credits
                </Link>
              </div>
            </div>
          )}

          {callStatus === "error" && (
            <div className="flex items-start gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {callStatus === "connected" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Call successfully connected
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Call ID: {callSid.substring(0, 12)}...
                </p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Calls cost {CREDITS_PER_MINUTE} credits per minute, rounded up to the nearest minute.
          </div>
        </form>
      ) : (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center py-4">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Please sign in to make calls
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
