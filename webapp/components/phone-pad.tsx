"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneOff, Hash, Asterisk } from "lucide-react";

interface PhonePadProps {
  onDigitPress: (digit: string) => void;
  onEndCall: () => void;
  isCallActive: boolean;
  disabled?: boolean;
}

const PhonePad: React.FC<PhonePadProps> = ({ 
  onDigitPress, 
  onEndCall, 
  isCallActive,
  disabled = false 
}) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    
    setPressedKey(key);
    onDigitPress(key);
    
    // Visual feedback
    setTimeout(() => setPressedKey(null), 150);
  };

  const digits = [
    { key: "1", label: "1", subLabel: "" },
    { key: "2", label: "2", subLabel: "ABC" },
    { key: "3", label: "3", subLabel: "DEF" },
    { key: "4", label: "4", subLabel: "GHI" },
    { key: "5", label: "5", subLabel: "JKL" },
    { key: "6", label: "6", subLabel: "MNO" },
    { key: "7", label: "7", subLabel: "PQRS" },
    { key: "8", label: "8", subLabel: "TUV" },
    { key: "9", label: "9", subLabel: "WXYZ" },
    { key: "*", label: "*", subLabel: "", icon: Asterisk },
    { key: "0", label: "0", subLabel: "+" },
    { key: "#", label: "#", subLabel: "", icon: Hash },
  ];

  return (
    <Card className="w-full max-w-xs mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg">Phone Pad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {digits.map((digit) => {
            const Icon = digit.icon;
            return (
              <Button
                key={digit.key}
                variant={pressedKey === digit.key ? "secondary" : "outline"}
                className={`h-14 sm:h-16 transition-all ${
                  pressedKey === digit.key ? "scale-95" : ""
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleKeyPress(digit.key)}
                disabled={disabled || !isCallActive}
              >
                <div className="flex flex-col items-center">
                  {Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <>
                      <span className="text-lg font-semibold">{digit.label}</span>
                      {digit.subLabel && (
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {digit.subLabel}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
        
        {isCallActive && (
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={onEndCall}
            disabled={disabled}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PhonePad;