"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, PhoneOff, Hash, Asterisk, Delete,
  Send, Clock, Volume2, VolumeX, Keyboard,
  PhoneCall, Navigation, PlayCircle, PauseCircle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DTMFPhonePadProps {
  onDigitPress: (digit: string, options?: DTMFOptions) => void;
  onSequenceSend?: (sequence: string, options?: DTMFOptions) => void;
  onIVRNavigate?: (options: IVROptions) => void;
  onEndCall?: () => void;
  isCallActive: boolean;
  disabled?: boolean;
  ws?: WebSocket | null;
}

interface DTMFOptions {
  sequence?: boolean;
  queue?: boolean;
  delayBetween?: number;
}

interface IVROptions {
  menuOption?: string;
  extension?: string;
  pinCode?: string;
  waitBeforeMenu?: number;
  waitBeforeExtension?: number;
}

const DTMFPhonePad: React.FC<DTMFPhonePadProps> = ({
  onDigitPress,
  onSequenceSend,
  onIVRNavigate,
  onEndCall,
  isCallActive,
  disabled = false,
  ws
}) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [inputSequence, setInputSequence] = useState("");
  const [ivrExtension, setIvrExtension] = useState("");
  const [ivrMenuOption, setIvrMenuOption] = useState("");
  const [ivrPinCode, setIvrPinCode] = useState("");
  const [enableSound, setEnableSound] = useState(true);
  const [sequenceMode, setSequenceMode] = useState(false);
  const [sendingDTMF, setSendingDTMF] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize audio context for DTMF tones
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContext.current?.close();
    };
  }, []);

  // Play DTMF tone
  const playDTMFTone = (digit: string) => {
    if (!enableSound || !audioContext.current) return;

    const frequencies: { [key: string]: [number, number] } = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      'A': [697, 1633], 'B': [770, 1633],
      'C': [852, 1633], 'D': [941, 1633]
    };

    const freqs = frequencies[digit];
    if (!freqs) return;

    const oscillator1 = audioContext.current.createOscillator();
    const oscillator2 = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator1.frequency.value = freqs[0];
    oscillator2.frequency.value = freqs[1];
    gainNode.gain.value = 0.1;

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator1.start();
    oscillator2.start();

    setTimeout(() => {
      oscillator1.stop();
      oscillator2.stop();
    }, 150);
  };

  // Handle single key press
  const handleKeyPress = useCallback((key: string) => {
    if (disabled || !isCallActive) return;

    setPressedKey(key);
    playDTMFTone(key);

    if (sequenceMode) {
      setInputSequence(prev => prev + key);
    } else {
      // Send immediately via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "dtmf",
          digit: key
        }));
      }
      onDigitPress(key);
    }

    // Visual feedback
    setTimeout(() => setPressedKey(null), 150);
  }, [disabled, isCallActive, sequenceMode, ws, onDigitPress]);

  // Handle sequence send
  const handleSequenceSend = () => {
    if (!inputSequence || !isCallActive) return;

    setSendingDTMF(true);

    // Send sequence via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "dtmf",
        digit: inputSequence,
        sequence: true
      }));
    }

    if (onSequenceSend) {
      onSequenceSend(inputSequence, { sequence: true });
    }

    toast({
      title: "DTMF Sequence Sent",
      description: `Sent: ${inputSequence}`,
    });

    setInputSequence("");
    setSendingDTMF(false);
  };

  // Handle IVR navigation
  const handleIVRNavigate = () => {
    if (!isCallActive) return;

    const options: IVROptions = {
      menuOption: ivrMenuOption,
      extension: ivrExtension,
      pinCode: ivrPinCode,
      waitBeforeMenu: 2000,
      waitBeforeExtension: 1000
    };

    // Send IVR navigation request via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "navigate_ivr",
        options
      }));
    }

    if (onIVRNavigate) {
      onIVRNavigate(options);
    }

    toast({
      title: "IVR Navigation Started",
      description: "Navigating through phone menu...",
    });

    // Clear fields
    setIvrMenuOption("");
    setIvrExtension("");
    setIvrPinCode("");
  };

  // Clear sequence
  const handleClearSequence = () => {
    setInputSequence("");
  };

  // Backspace
  const handleBackspace = () => {
    setInputSequence(prev => prev.slice(0, -1));
  };

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCallActive || disabled) return;

      const key = e.key.toUpperCase();
      if (/^[0-9*#]$/.test(key)) {
        handleKeyPress(key);
      } else if (key === 'BACKSPACE') {
        handleBackspace();
      } else if (key === 'ENTER' && sequenceMode) {
        handleSequenceSend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCallActive, disabled, sequenceMode, handleKeyPress]);

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>DTMF Phone Pad</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEnableSound(!enableSound)}
            >
              {enableSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardTitle>
        <CardDescription>
          {isCallActive ? "Call active - Press keys to send DTMF" : "Start a call to use phone pad"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="keypad" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keypad">Keypad</TabsTrigger>
            <TabsTrigger value="sequence">Sequence</TabsTrigger>
            <TabsTrigger value="ivr">IVR Menu</TabsTrigger>
          </TabsList>

          <TabsContent value="keypad" className="space-y-3">
            {/* Standard phone pad */}
            <div className="grid grid-cols-3 gap-2">
              {digits.map((digit) => {
                const Icon = digit.icon;
                return (
                  <Button
                    key={digit.key}
                    variant={pressedKey === digit.key ? "secondary" : "outline"}
                    className={`h-14 sm:h-16 transition-all ${
                      pressedKey === digit.key ? "scale-95" : ""
                    } ${disabled || !isCallActive ? "opacity-50 cursor-not-allowed" : ""}`}
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

            {/* Extended DTMF keys */}
            <div className="grid grid-cols-4 gap-2">
              {['A', 'B', 'C', 'D'].map((key) => (
                <Button
                  key={key}
                  variant={pressedKey === key ? "secondary" : "outline"}
                  size="sm"
                  className={`h-10 ${pressedKey === key ? "scale-95" : ""}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={disabled || !isCallActive}
                >
                  {key}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sequence" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sequence">DTMF Sequence</Label>
              <div className="flex gap-2">
                <Input
                  id="sequence"
                  value={inputSequence}
                  onChange={(e) => setInputSequence(e.target.value.toUpperCase())}
                  placeholder="Enter digits (e.g., 1234#)"
                  disabled={!isCallActive}
                  className="font-mono"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackspace}
                  disabled={!inputSequence}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use 'w' for 0.5s pause, 'W' for 1s pause
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearSequence}
                disabled={!inputSequence}
              >
                Clear
              </Button>
              <Button
                className="flex-1"
                onClick={handleSequenceSend}
                disabled={!inputSequence || !isCallActive || sendingDTMF}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Sequence
              </Button>
            </div>

            {/* Quick sequences */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputSequence("ww1")}
                  disabled={!isCallActive}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Wait → 1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputSequence("0")}
                  disabled={!isCallActive}
                >
                  <PhoneCall className="h-3 w-3 mr-1" />
                  Operator
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ivr" className="space-y-3">
            <div className="space-y-3">
              <div>
                <Label htmlFor="menu">Menu Option</Label>
                <Input
                  id="menu"
                  value={ivrMenuOption}
                  onChange={(e) => setIvrMenuOption(e.target.value)}
                  placeholder="e.g., 2 for Sales"
                  disabled={!isCallActive}
                />
              </div>

              <div>
                <Label htmlFor="extension">Extension</Label>
                <Input
                  id="extension"
                  value={ivrExtension}
                  onChange={(e) => setIvrExtension(e.target.value)}
                  placeholder="e.g., 1234"
                  disabled={!isCallActive}
                />
              </div>

              <div>
                <Label htmlFor="pin">PIN Code (Optional)</Label>
                <Input
                  id="pin"
                  type="password"
                  value={ivrPinCode}
                  onChange={(e) => setIvrPinCode(e.target.value)}
                  placeholder="e.g., 5678"
                  disabled={!isCallActive}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleIVRNavigate}
                disabled={!isCallActive || (!ivrMenuOption && !ivrExtension)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate IVR Menu
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isCallActive && onEndCall && (
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

export default DTMFPhonePad;