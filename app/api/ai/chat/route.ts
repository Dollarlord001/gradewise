import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai/provider";
import { rateLimit, requestIdentity } from "@/lib/security/rate-limit";
import { getAppIdentity } from "@/lib/firebase/session";
import { createClient } from "@/lib/supabase/server";
import { getAiProviderConfig } from "@/server/ai-route-helpers";
import type { StudentAiContext } from "@/types/ai";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  mode: z.enum(["tutor", "class", "voice"]).default("tutor"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) })).min(1).max(20),
  context: z.object({
    exam: z.string().max(30).optional(), subject: z.string().max(100).optional(), topic: z.string().max(180).optional(),
    action: z.enum(["answer", "simplify", "another_way", "steps", "similar", "harder", "easier", "teach"]).optional(),
  }).optional(),
});

const actionPrompts: Record<string, string> = {
  simplify: "Explain your last answer in simpler language and define any difficult words.",
  another_way: "Explain the same idea using a different approach or analogy.",
  steps: "Give a clear step-by-step solution. Show the reasoning for each step.",
  similar: "Create one new similar practice question, ask me to solve it, and wait for my answer. Do not present it as a past question.",
  harder: "Give me a more challenging original practice question on this idea and wait for my answer.",
  easier: "Give me an easier original practice question on this idea and wait for my answer.",
  teach: "Teach this topic from the foundations using small sections, examples, and a question for me to answer before continuing.",
};

async function enrichContext(context: z.infer<typeof requestSchema>["context"], identity: Awaited<ReturnType<typeof getAppIdentity>>) {
  const result: StudentAiContext & { recentMistakes?: string[]; progress?: string[] } = {
    exam: context?.exam ?? undefined,
    currentSubject: context?.subject ?? undefined,
    currentTopic: context?.topic ?? undefined,
  };
  if (!identity) return result;
  try {
    const supabase = await createClient(identity.idToken);
    const [mistakes, progress] = await Promise.all([
      supabase.from("mistakes").select("questions!inner(prompt,subject,subtopic)").eq("student_id", identity.studentId).order("last_seen", { ascending: false }).limit(5),
      supabase.from("student_progress").select("subject,attempts,correct,updated_at").eq("student_id", identity.studentId).order("updated_at", { ascending: false }).limit(8),
    ]);
    if (!mistakes.error) result.recentMistakes = (mistakes.data ?? []).map((row) => {
      const question = row.questions as unknown as { prompt: string; subject: string; subtopic?: string | null };
      return `${question.subject}${question.subtopic ? ` / ${question.subtopic}` : ""}: ${question.prompt.slice(0, 220)}`;
    });
    if (!progress.error) result.progress = (progress.data ?? []).map((row) => `${row.subject}: ${row.correct}/${row.attempts} correct`);
  } catch {
    // Student context is optional. A database hiccup must not prevent a tutor reply.
  }
  return result;
}

function systemPrompt(mode: "tutor" | "class" | "voice", context: Awaited<ReturnType<typeof enrichContext>>) {
  const prompt = buildSystemPrompt(mode, context);
  const lines = [prompt, "Use plain language, teach one idea at a time, and state uncertainty rather than guessing."];
  if (context.recentMistakes?.length) lines.push(`Recent mistakes to address gently when relevant:\n${context.recentMistakes.map((item) => `- ${item}`).join("\n")}`);
  if (context.progress?.length) lines.push(`Recent practice progress (context only): ${context.progress.join("; ")}.`);
  if (mode === "class" || mode === "voice") lines.push("Teach interactively: explain one short section, ask one check-for-understanding question, then stop and wait for the learner. Evaluate each learner response before moving on. Adapt examples and difficulty to their answer.");
  return lines.join("\n\n");
}

export async function POST(request: Request) {
  let provider: ReturnType<typeof getAiProviderConfig>;
  try { provider = getAiProviderConfig(); }
  catch { return NextResponse.json({ error: "The AI tutor is not configured on the server yet." }, { status: 503 }); }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The message is invalid or too long." }, { status: 400 });
  const identity = await getAppIdentity().catch(() => null);
  const key = identity ? `ai:${identity.uid}` : `ai:${requestIdentity(request.headers)}`;
  const limit = await rateLimit(key, identity ? 18 : 8, 60_000);
  if (!limit.success) return NextResponse.json({ error: "You have reached the tutor's short-term message limit. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  const { mode, messages, context: requestContext } = parsed.data;
  const contextPromise = enrichContext(requestContext, identity);
  const context = await Promise.race([
    contextPromise,
    new Promise<Awaited<typeof contextPromise>>((resolve) => setTimeout(() => resolve({ exam: requestContext?.exam, currentSubject: requestContext?.subject, currentTopic: requestContext?.topic }), 450)),
  ]);
  const action = requestContext?.action;
  const upstreamMessages = [
    { role: "system", content: systemPrompt(mode, context) },
    ...messages.map((message, index) => ({ role: message.role, content: index === messages.length - 1 && message.role === "user" && action && action !== "answer" ? `${message.content}\n\n${actionPrompts[action]}` : message.content })),
  ];

  let upstream: Response;
  try {
    upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST", cache: "no-store", signal: request.signal,
      headers: { authorization: `Bearer ${provider.key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: provider.model, messages: upstreamMessages, stream: true, temperature: 0.35, max_tokens: 1200 }),
    });
  } catch {
    return NextResponse.json({ error: "The tutor could not connect to its AI provider. Your message is still here; retry when your connection is ready." }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    const status = upstream.status === 429 ? 429 : 502;
    return NextResponse.json({ error: upstream.status === 429 ? "The AI provider is busy. Please retry in a moment." : "The AI provider could not answer right now." }, { status });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        carry += decoder.decode(value, { stream: true });
        const lines = carry.split("\n"); carry = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { controller.close(); await reader.cancel(); return; }
          try {
            const token = JSON.parse(data).choices?.[0]?.delta?.content;
            if (typeof token === "string" && token) controller.enqueue(new TextEncoder().encode(token));
          } catch { /* Ignore incomplete/malformed provider events. */ }
        }
      } catch {
        controller.error(new Error("AI stream interrupted"));
      }
    },
    async cancel() { await reader.cancel(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Content-Type-Options": "nosniff" } });
}
