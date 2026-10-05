"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AiMessage } from "@/types/ai";

type Action = "answer" | "simplify" | "another_way" | "steps" | "similar" | "harder" | "easier" | "teach";
type ChatMode = "tutor" | "class" | "voice";

export function AiChatPanel({
  title = "AI Tutor", placeholder = "Ask about a topic or question…", mode = "tutor",
  exam, subject, topic, initialPrompt,
}: {
  title?: string; placeholder?: string; mode?: ChatMode; exam?: string; subject?: string; topic?: string; initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechState, setSpeechState] = useState<"idle" | "speaking" | "paused">("idle");
  const [listening, setListening] = useState(false);
  const [voiceFallback, setVoiceFallback] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<{ start(): void; stop(): void; abort(): void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null } | null>(null);
  const initialSent = useRef(false);
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "";

  const stopSpeech = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeechState("idle");
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window) || !text.trim()) {
      setVoiceFallback("Spoken playback is unavailable here. The transcript is ready below.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-NG";
    utterance.onstart = () => setSpeechState("speaking");
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => { setSpeechState("idle"); setVoiceFallback("Speech playback failed. Continue with the transcript."); };
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
  }, []);

  const send = useCallback(async (text: string, action: Action = "answer", regenerate = false) => {
    const question = text.trim();
    if (!question || busy) return;
    setError(null); setVoiceFallback(null); setInput(""); setBusy(true);
    stopSpeech();
    const userMessage: AiMessage = { id: crypto.randomUUID(), role: "user", content: question, createdAt: new Date().toISOString() };
    const prior = regenerate ? messages.slice(0, -1) : messages;
    const nextMessages = regenerate && prior.at(-1)?.role === "assistant" ? prior.slice(0, -1) : prior;
    const updated = [...nextMessages, ...(regenerate ? [] : [userMessage])];
    const placeholderMessage: AiMessage = { id: crypto.randomUUID(), role: "assistant", content: "", createdAt: new Date().toISOString() };
    setMessages([...updated, placeholderMessage]);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: updated.map(({ role, content }) => ({ role, content })), context: { exam, subject, topic, action } }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "The tutor could not answer just now.");
      }
      if (!response.body) throw new Error("The tutor response did not start. Please try again.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => message.id === placeholderMessage.id ? { ...message, content: answer } : message));
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      answer += decoder.decode();
      setMessages((current) => current.map((message) => message.id === placeholderMessage.id ? { ...message, content: answer || "The tutor returned an empty answer. Please try again." } : message));
      if (mode === "voice" && answer) speak(answer);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "The tutor connection failed. Retry or continue with your question in text.");
      setMessages((current) => current.filter((message) => message.id !== placeholderMessage.id));
    } finally {
      setBusy(false); abortRef.current = null; bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [busy, exam, messages, mode, speak, stopSpeech, subject, topic]);

  useEffect(() => {
    if (initialPrompt && !initialSent.current) { initialSent.current = true; void send(initialPrompt); }
  }, [initialPrompt, send]);

  function startListening() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => typeof recognitionRef.current; webkitSpeechRecognition?: new () => typeof recognitionRef.current }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => typeof recognitionRef.current }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceFallback("Speech-to-text is not supported on this browser. Type your answer below; the lesson transcript is unchanged."); return; }
    try {
      const recognition = new SpeechRecognition();
      if (!recognition) throw new Error("Speech recognition could not start");
      recognitionRef.current = recognition as NonNullable<typeof recognitionRef.current>;
      (recognition as unknown as { lang: string; interimResults: boolean; maxAlternatives: number }).lang = "en-NG";
      (recognition as unknown as { interimResults: boolean }).interimResults = false;
      recognition.onresult = (event) => { const result = event.results[event.results.length - 1]?.[0]?.transcript; if (result) setInput((current) => `${current}${current ? " " : ""}${result}`); };
      recognition.onerror = () => { setListening(false); setVoiceFallback("Microphone or speech recognition failed. You can answer using the text box."); };
      recognition.onend = () => setListening(false);
      recognition.start(); setListening(true); setVoiceFallback(null);
    } catch { setListening(false); setVoiceFallback("Microphone access was blocked. You can answer using the text box."); }
  }

  function toggleListening() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else startListening();
  }

  function submit(event: React.FormEvent) { event.preventDefault(); void send(input); }
  function saveAnswer(text: string) {
    try {
      const saved = JSON.parse(localStorage.getItem("tutorme-ai-saved") ?? "[]") as { content: string; savedAt: string; exam?: string; subject?: string; topic?: string }[];
      if (!saved.some((item) => item.content === text)) saved.unshift({ content: text, savedAt: new Date().toISOString(), exam, subject, topic });
      localStorage.setItem("tutorme-ai-saved", JSON.stringify(saved.slice(0, 100)));
      setVoiceFallback("Saved on this device.");
    } catch { setVoiceFallback("This answer could not be saved on this device."); }
  }

  const actionButtons: { label: string; prompt: string; action: Action }[] = [
    { label: "Explain simply", prompt: "Please explain that simply.", action: "simplify" },
    { label: "Another way", prompt: "Please explain that another way.", action: "another_way" },
    { label: "Step by step", prompt: "Show me how to solve it step by step.", action: "steps" },
    { label: "Similar question", prompt: "Give me a similar question to try.", action: "similar" },
    { label: "Easier", prompt: "Give me an easier question to try.", action: "easier" },
    { label: "Harder", prompt: "Give me a harder question to try.", action: "harder" },
    { label: "Teach this topic", prompt: `Teach me ${topic || subject || "this topic"}.`, action: "teach" },
  ];

  return (
    <section className="flex min-h-[min(72vh,720px)] flex-col rounded-2xl border border-navy-100 bg-white shadow-sm" aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-4 py-3">
        <div><h1 className="text-base font-semibold text-navy-900">{title}</h1><p className="text-xs text-navy-500">{[exam, subject, topic].filter(Boolean).join(" · ") || "Educational AI · clear explanations and practice"}</p></div>
        {mode === "voice" && <div className="flex gap-2"><button className="rounded-lg border px-3 py-1.5 text-xs" type="button" disabled={!lastAssistant || speechState === "speaking"} onClick={() => speak(lastAssistant)}>Play voice</button><button className="rounded-lg border px-3 py-1.5 text-xs" type="button" disabled={speechState === "idle"} onClick={() => { if (speechState === "paused") { window.speechSynthesis.resume(); setSpeechState("speaking"); } else { window.speechSynthesis.pause(); setSpeechState("paused"); } }}>{speechState === "paused" ? "Continue" : "Pause"}</button><button className="rounded-lg border px-3 py-1.5 text-xs" type="button" disabled={speechState === "idle"} onClick={stopSpeech}>Stop voice</button><button className="rounded-lg border px-3 py-1.5 text-xs" type="button" disabled={busy} onClick={toggleListening}>{listening ? "Stop listening" : "Use microphone"}</button></div>}
      </header>
      {mode === "voice" && <p className="border-b border-navy-100 bg-navy-50/70 px-4 py-2 text-xs text-navy-600">This lesson uses your browser’s speech recognition and speech playback when supported. If either is unavailable, continue in the transcript and text box.</p>}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {!messages.length && <p className="text-sm text-navy-500">{mode === "tutor" ? "Ask a question. Follow up, request another explanation, or try a new practice question." : "Your teacher will explain a short section, ask you a question, and wait for your answer."}</p>}
        {messages.map((message) => <article key={message.id} className={message.role === "user" ? "ml-7 rounded-2xl bg-orange-50 px-3 py-2.5 text-sm text-navy-900" : "mr-4 rounded-2xl bg-navy-50 px-3 py-2.5 text-sm leading-6 text-navy-800"}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-navy-500">{message.role === "user" ? "You" : "TUTOR-ME AI"}</p><div className="whitespace-pre-wrap">{message.content || (busy ? "" : "")}</div>
          {message.role === "assistant" && message.content && <div className="mt-2 flex flex-wrap gap-2 border-t border-navy-200/70 pt-2"><button type="button" className="text-xs text-navy-600 underline" onClick={() => void navigator.clipboard?.writeText(message.content)}>Copy</button><button type="button" className="text-xs text-navy-600 underline" onClick={() => saveAnswer(message.content)}>Save</button>{mode !== "voice" && <button type="button" className="text-xs text-navy-600 underline" onClick={() => speak(message.content)}>Listen</button>}{message === messages.at(-1) && !busy && <button type="button" className="text-xs text-navy-600 underline" onClick={() => void send(messages.filter((item) => item.role === "user").at(-1)?.content ?? "Please try again.", "answer", true)}>Regenerate</button>}</div>}
        </article>)}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" className="ml-2 underline" onClick={() => void send(messages.filter((item) => item.role === "user").at(-1)?.content ?? input)}>Retry</button></div>}
        {voiceFallback && <p role="status" className="text-xs text-navy-500">{voiceFallback}</p>}
        {messages.some((message) => message.role === "assistant" && message.content) && mode === "tutor" && <div className="flex flex-wrap gap-2">{actionButtons.map((item) => <button key={item.action} type="button" disabled={busy} className="rounded-full border border-navy-200 px-3 py-1.5 text-xs text-navy-700 hover:border-orange-400 disabled:opacity-50" onClick={() => void send(item.prompt, item.action)}>{item.label}</button>)}</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-navy-100 p-3">
        <label className="sr-only" htmlFor="ai-input">Message</label><textarea id="ai-input" className="min-h-11 flex-1 resize-y rounded-xl border border-navy-200 px-3 py-2.5 text-sm" value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder} rows={1} maxLength={6000} disabled={busy} />
        {busy ? <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm">Stop</button> : <button type="submit" disabled={!input.trim()} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Send</button>}
      </form>
    </section>
  );
}
