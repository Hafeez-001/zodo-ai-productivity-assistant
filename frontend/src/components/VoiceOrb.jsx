import React, { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "../lib/utils";

export default function VoiceOrb({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!supported) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.start();
  };

  return (
    <div className="relative flex flex-col items-center gap-8">
      <button
        onClick={toggleListening}
        className={cn(
          "orb flex items-center justify-center cursor-pointer transition-all duration-500",
          listening ? "orb-listening scale-110" : "hover:scale-105"
        )}
      >
        <div className="relative z-10">
          {listening ? (
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-10 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" />
            </div>
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </div>
        
        {/* Decorative Rings */}
        {listening && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
            <div className="absolute -inset-4 rounded-full border-2 border-white/10 animate-pulse" />
          </>
        )}
      </button>
      
      <div className="text-center space-y-2">
        <p className={cn(
          "text-sm font-black uppercase tracking-[0.2em] transition-colors duration-300",
          !supported ? "text-red-400" : listening ? "text-blue-600" : "text-gray-400"
        )}>
          {!supported ? "Voice Input Unsupported" : listening ? "Listening..." : "Tap to Speak"}
        </p>
        <p className="text-xs text-gray-400 font-medium">Capture tasks naturally with your voice</p>
      </div>
    </div>
  );
}
