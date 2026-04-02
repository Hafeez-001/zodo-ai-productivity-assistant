import React, { useEffect, useState, useRef } from "react";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function VoiceOrb({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setProcessing(true);
      // Simulate processing time for UI feedback
      setTimeout(() => setProcessing(false), 800);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) {
      console.warn("Audio recording is not supported or permission denied.");
      return;
    }
    if (processing) return; // Prevent toggling while processing

    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-8">
      <button
        onClick={toggleListening}
        disabled={processing}
        className={cn(
          "orb flex items-center justify-center cursor-pointer transition-all duration-500 disabled:opacity-80 disabled:cursor-not-allowed",
          listening ? "orb-listening scale-110" : "hover:scale-105"
        )}
      >
        <div className="relative z-10">
          {processing ? (
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          ) : listening ? (
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
          !supported ? "text-red-400" : processing ? "text-purple-600" : listening ? "text-blue-600" : "text-gray-400"
        )}>
          {!supported ? "Voice Input Unsupported" : processing ? "Processing..." : listening ? "Listening..." : "Tap to Speak"}
        </p>
        <p className="text-xs text-gray-400 font-medium">Capture tasks naturally with your voice</p>
      </div>
    </div>
  );
}
