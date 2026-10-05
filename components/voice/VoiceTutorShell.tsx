"use client";

import { useState } from "react";

/**
 * Voice-first shell with mandatory text fallback when mic/STT fails.
 */
export function VoiceTutorShell() {
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [micError, setMicError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  async function startMic() {
    setMicError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone not supported on this device");
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setListening(true);
      // Host: record → STT API → tutor → TTS
    } catch {
      setMicError("Microphone unavailable. You can continue with text.");
      setMode("text");
      setListening(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Voice Tutor</h1>
      <p className="text-sm text-navy-600">Speak with your tutor. Text fallback is always available.</p>
      {micError ? <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-navy-800">{micError}</p> : null}
      <div className="flex gap-2">
        <button type="button" className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${mode === "voice" ? "bg-navy-800 text-white" : "border border-navy-200"}`} onClick={() => setMode("voice")}>
          Voice
        </button>
        <button type="button" className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${mode === "text" ? "bg-navy-800 text-white" : "border border-navy-200"}`} onClick={() => setMode("text")}>
          Text
        </button>
      </div>
      {mode === "voice" ? (
        <button type="button" className="w-full rounded-full bg-orange-500 py-6 text-sm font-semibold text-white" onClick={startMic}>
          {listening ? "Listening… (tap host stop control)" : "Tap to speak"}
        </button>
      ) : (
        <textarea className="w-full rounded-xl border border-navy-200 p-3 text-sm" rows={4} placeholder="Type what you want to learn…" />
      )}
      <ol className="list-decimal space-y-1 pl-5 text-sm text-navy-500">
        <li>Greeting</li>
        <li>Subject</li>
        <li>Topic</li>
        <li>Spoken teaching + your replies</li>
      </ol>
    </div>
  );
}
