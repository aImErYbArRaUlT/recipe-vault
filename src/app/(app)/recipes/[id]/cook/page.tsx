"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoice } from "@/lib/hooks/use-voice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/sheet";
import { MicIcon, StopIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icon";
import { haptic } from "@/components/ui/haptics";
import { cn } from "@/components/ui/cn";

interface CookRecipePageProps {
  params: Promise<{ id: string }>;
}

type Ingredient = {
  name: string;
  quantity?: number;
  unit?: string;
  preparation?: string;
};

type Step = {
  instruction: string;
  timerSeconds?: number | null;
};

type Recipe = {
  title: string;
  ingredients?: Ingredient[] | null;
  steps?: Step[] | null;
};

function formatIngredient(i: Ingredient) {
  const parts: string[] = [];
  if (i.quantity) parts.push(String(i.quantity));
  if (i.unit) parts.push(i.unit);
  parts.push(i.name);
  let line = parts.join(" ");
  if (i.preparation) line += `, ${i.preparation}`;
  return line;
}

type VoiceState = "idle" | "listening" | "speaking" | "thinking" | "ready";

function getVoiceState(opts: {
  active: boolean;
  recording?: boolean;
  listening?: boolean;
  speaking?: boolean;
  sending?: boolean;
}): VoiceState {
  if (!opts.active) return "idle";
  if (opts.recording || opts.listening) return "listening";
  if (opts.speaking) return "speaking";
  if (opts.sending) return "thinking";
  return "ready";
}

const stateLabel: Record<VoiceState, string> = {
  idle: "Start voice",
  listening: "Listening…",
  speaking: "Speaking…",
  thinking: "Thinking…",
  ready: "Ready",
};

const stateClasses: Record<VoiceState, string> = {
  idle: "bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white",
  listening: "bg-[var(--accent-deep)] text-white pulse-accent",
  speaking: "bg-[var(--indigo-ink)] text-white",
  thinking: "bg-[var(--mustard)] text-white",
  ready: "bg-[var(--moss)] text-white",
};

export default function CookRecipePage({ params }: CookRecipePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [logRating, setLogRating] = useState<number | null>(null);
  const [logNotes, setLogNotes] = useState("");
  const [logModifications, setLogModifications] = useState("");
  const [logWouldMakeAgain, setLogWouldMakeAgain] = useState(false);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState("");

  const steps = useMemo(() => recipe?.steps ?? [], [recipe]);
  const currentStep = steps[stepIndex]?.instruction ?? "";

  const sendToAI = useCallback(async (text: string): Promise<string> => {
    const sid = sessionIdRef.current;
    if (!sid || !text) return "";
    setSending(true);

    const response = await fetch("/api/cookguide/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        message: text,
        timerSeconds: text.toLowerCase().includes("timer") ? 90 : undefined,
      }),
    });

    if (!response.body) {
      setSending(false);
      return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (part.startsWith("event: timer")) {
          const dataLine = part.split("\n").find((line) => line.startsWith("data:"));
          if (dataLine) {
            const payload = JSON.parse(dataLine.replace("data:", "").trim());
            setTimerSeconds(payload.seconds);
          }
        } else if (part.startsWith("data:")) {
          const payload = JSON.parse(part.replace("data:", "").trim());
          if (payload.content) {
            fullResponse += payload.content;
            setAssistantMessages((prev) => {
              if (!payload.stream) return [...prev, payload.content];
              if (payload.start || prev.length === 0) return [...prev, payload.content];
              const updated = [...prev];
              updated[updated.length - 1] = `${updated[updated.length - 1]}${payload.content}`;
              return updated;
            });
          }
        }
      }
    }

    setSending(false);
    return fullResponse;
  }, []);

  const voiceRef = useRef<ReturnType<typeof useVoice>>(null!);

  const voice = useVoice({
    onTranscript: useCallback(
      async (text: string) => {
        setMessage(text);
        const response = await sendToAI(text);
        setMessage("");
        if (response) {
          voiceRef.current.speakAndListen(response);
        } else if (voiceRef.current.conversationActive) {
          voiceRef.current.listen();
        }
      },
      [sendToAI],
    ),
  });
  voiceRef.current = voice;

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => res.json())
      .then((data) => setRecipe(data))
      .catch(() => null);
  }, [id]);

  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return;
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((prev) => (prev ? prev - 1 : prev));
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [timerSeconds]);

  useEffect(() => {
    if (timerSeconds !== null && timerSeconds <= 0) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      void haptic("success");
    }
  }, [timerSeconds]);

  useEffect(() => {
    if (!recipe || sessionIdRef.current) return;
    sessionIdRef.current = "pending";

    fetch("/api/cookguide/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: id, voiceEnabled: false }),
    })
      .then((response) => {
        if (!response.ok) {
          sessionIdRef.current = null;
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.id) {
          sessionIdRef.current = data.id;
          setSessionId(data.id);
        }
      })
      .catch(() => {
        sessionIdRef.current = null;
      });
  }, [recipe, id]);

  const sendMessage = useCallback(async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage("");
    const response = await sendToAI(text);
    if (voice.conversationActive && response) {
      voice.speakAndListen(response);
    }
  }, [message, sendToAI, voice]);

  async function handleEndSession() {
    const ok = await confirm({
      title: "End cooking session?",
      description: "You can log how it went on the next screen.",
      confirmLabel: "End session",
      cancelLabel: "Keep cooking",
    });
    if (!ok) return;
    if (voice.conversationActive) voice.stopConversation();
    setShowLog(true);
  }

  async function handleLogCook(e: React.FormEvent) {
    e.preventDefault();
    setLogError("");
    setLogSaving(true);

    const res = await fetch(`/api/recipes/${id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: logRating ?? undefined,
        notes:
          [logNotes, logModifications ? `Modifications: ${logModifications}` : ""]
            .filter(Boolean)
            .join("\n\n") || undefined,
        wouldMakeAgain: logWouldMakeAgain,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setLogError(data?.error ?? "Failed to save cook log.");
      setLogSaving(false);
      return;
    }

    if (sessionId) {
      await fetch("/api/cookguide/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => null);
    }

    void haptic("success");
    router.push(`/recipes/${id}`);
  }

  const voiceState = getVoiceState({
    active: voice.conversationActive,
    recording: voice.recording,
    listening: voice.listening,
    speaking: voice.speaking,
    sending,
  });

  const stepProgress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0;
  const lastAssistant = assistantMessages[assistantMessages.length - 1];

  return (
    <div className="grid gap-6 pb-6">
      {/* HEADER */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Cooking · {recipe?.title ?? "Loading"}</p>
          <h1
            className="mt-1 text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.05]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            Step {stepIndex + 1}
            <span className="text-[var(--ink-soft)]">
              {" / "}
              {steps.length || 1}
            </span>
          </h1>
        </div>
        <Button onClick={handleEndSession} variant="secondary" size="md">
          End
        </Button>
      </header>

      {/* PROGRESS RAIL */}
      {steps.length > 0 ? (
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-[var(--rule-faint)]"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      ) : null}

      {/* STEP DISPLAY - magazine layout */}
      <Card tone="raised" padding="xl">
        {currentStep ? (
          <p
            className="text-[clamp(1.25rem,2.6vw,1.75rem)] font-medium leading-[1.35]"
            style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56, 'SOFT' 50" }}
          >
            {currentStep}
          </p>
        ) : (
          <p className="text-base text-[var(--ink-muted)]">
            No steps yet. Add them by editing this recipe.
          </p>
        )}

        {/* Step nav */}
        {steps.length > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              onClick={() => {
                setStepIndex((v) => Math.max(0, v - 1));
                void haptic("select");
              }}
              disabled={stepIndex === 0}
              variant="secondary"
              size="lg"
              leading={<ChevronLeftIcon size={16} />}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                setStepIndex((v) => Math.min(steps.length - 1, v + 1));
                void haptic("medium");
              }}
              disabled={stepIndex === steps.length - 1}
              variant="primary"
              size="lg"
              trailing={<ChevronRightIcon size={16} />}
            >
              Next step
            </Button>
          </div>
        ) : null}

        {/* Timer */}
        {timerSeconds !== null ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-sunken)] px-4 py-2">
            <ClockIcon size={16} className="text-[var(--accent-deep)]" />
            <span
              className="tabular text-base font-semibold"
              style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
            >
              {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}
            </span>
            {timerSeconds <= 0 ? (
              <span className="text-sm font-semibold text-[var(--oxblood)]">Time&apos;s up</span>
            ) : null}
          </div>
        ) : null}

        {/* Ingredients reference - only if filled */}
        {recipe?.ingredients?.length ? (
          <div className="mt-7 rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--paper)] p-4 md:p-5">
            <p className="eyebrow mb-3">Ingredients on hand</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="flex items-start gap-2 text-sm text-[var(--ink)]"
                >
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <span>{formatIngredient(ingredient)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {/* VOICE COMPANION - only if supported & session ready */}
      {voice.supported && sessionId ? (
        <Card tone="base" padding="lg" className="flex flex-col items-center gap-5">
          <p className="eyebrow">Sous chef</p>

          {!voice.conversationActive ? (
            <button
              type="button"
              onClick={() => {
                void haptic("medium");
                voice.startConversation();
              }}
              className={cn(
                "inline-flex h-28 w-28 items-center justify-center rounded-full text-sm font-semibold shadow-[var(--shadow-lifted)] transition-transform active:scale-95",
                stateClasses.idle,
              )}
              aria-label="Start voice conversation"
            >
              <MicIcon size={32} />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (voice.sttMethod === "whisper") {
                    if (voice.recording) voice.stopListening();
                    else voice.listen();
                  } else {
                    voice.stopConversation();
                  }
                  void haptic("select");
                }}
                disabled={voice.speaking || sending}
                className={cn(
                  "inline-flex h-28 w-28 items-center justify-center rounded-full text-sm font-semibold shadow-[var(--shadow-lifted)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-90",
                  stateClasses[voiceState],
                )}
                aria-label={stateLabel[voiceState]}
              >
                {voiceState === "listening" ? <StopIcon size={28} /> : <MicIcon size={28} />}
              </button>
              <button
                type="button"
                onClick={voice.stopConversation}
                className="text-xs font-semibold text-[var(--ink-soft)] underline-offset-2 hover:underline"
              >
                End voice mode
              </button>
            </div>
          )}

          <p className="max-w-xs text-center text-xs leading-relaxed text-[var(--ink-soft)]">
            {stateLabel[voiceState]}
            {voiceState === "idle"
              ? " · Ask questions, get spoken answers."
              : voice.sttMethod === "whisper"
                ? " · Tap to record. Tap again to send."
                : " · Hands-free. Just talk."}
          </p>
        </Card>
      ) : null}

      {/* CONVERSATION TRANSCRIPT - only when there's content */}
      {lastAssistant ? (
        <Card tone="paper" padding="lg">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Last response</p>
            {voice.supported ? (
              <Button
                onClick={() => voice.speak(lastAssistant)}
                variant="ghost"
                size="sm"
              >
                Replay
              </Button>
            ) : null}
          </div>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink)]">{lastAssistant}</p>
        </Card>
      ) : null}

      {/* TEXT INPUT */}
      <Card tone="base" padding="md">
        <p className="eyebrow mb-2">Ask in writing</p>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            aria-label="Ask your sous chef"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface-raised)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--ink-soft)] hover:border-[var(--rule-strong)]"
            placeholder='Try: "Can I substitute…"'
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            variant="primary"
            size="lg"
            loading={sending}
          >
            Ask
          </Button>
        </div>
      </Card>

      {/* FINISH & LOG */}
      {!showLog ? (
        <Button
          onClick={() => setShowLog(true)}
          variant="outline"
          size="xl"
          fullWidth
        >
          Finish & log this cook
        </Button>
      ) : (
        <Card tone="raised" padding="lg">
          <p className="eyebrow mb-1">How did it go?</p>
          <h2
            className="text-2xl font-medium leading-tight"
            style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56" }}
          >
            Tried This entry
          </h2>
          <form className="mt-5 grid gap-5" onSubmit={handleLogCook}>
            <fieldset className="grid gap-2">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Rating
              </legend>
              <div role="radiogroup" aria-label="Rating" className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const selected = logRating === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setLogRating(star);
                        void haptic("select");
                      }}
                      className={cn(
                        "h-12 w-12 rounded-full border-2 text-base font-semibold tabular transition-colors",
                        selected
                          ? "border-[var(--accent-deep)] bg-[var(--accent)] text-white"
                          : "border-[var(--rule)] bg-[var(--surface-raised)] text-[var(--ink-soft)] hover:border-[var(--rule-strong)]",
                      )}
                    >
                      {star}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Textarea
              label="Notes"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="How did it turn out? Tips for next time?"
              optional
            />

            <Textarea
              label="Modifications"
              value={logModifications}
              onChange={(e) => setLogModifications(e.target.value)}
              placeholder="What did you change from the original?"
              optional
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={logWouldMakeAgain}
                onChange={(e) => setLogWouldMakeAgain(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--rule)] accent-[var(--accent)]"
              />
              <span>Would make again</span>
            </label>

            {logError ? (
              <p className="text-sm font-medium text-[var(--oxblood)]">{logError}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={logSaving}
                loading={logSaving}
                variant="primary"
                size="lg"
                hapticIntensity="success"
              >
                Save cook log
              </Button>
              <Button
                onClick={() => router.push(`/recipes/${id}`)}
                variant="ghost"
                size="lg"
              >
                Skip & finish
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
