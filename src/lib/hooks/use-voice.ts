import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
};

type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type SttMethod = "web-speech" | "whisper" | null;

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
}

export function useVoice(options?: UseVoiceOptions) {
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const [sttMethod, setSttMethod] = useState<SttMethod>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const conversationActiveRef = useRef(false);
  const onTranscriptRef = useRef(options?.onTranscript);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  onTranscriptRef.current = options?.onTranscript;

  useEffect(() => {
    const hasWebSpeech = !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
    const hasMediaRecorder =
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined";

    if (hasWebSpeech) {
      setSttMethod("web-speech");
      setSupported(true);
    } else if (hasMediaRecorder) {
      setSttMethod("whisper");
      setSupported(true);
    }
  }, []);

  // --- Web Speech API listen ---
  const listenWebSpeech = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setListening(false);
      if (text.trim()) {
        onTranscriptRef.current?.(text);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (
        conversationActiveRef.current &&
        event.error !== "not-allowed" &&
        event.error !== "aborted"
      ) {
        setTimeout(() => {
          if (conversationActiveRef.current) listenWebSpeech();
        }, 500);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  // --- Whisper-based listen (MediaRecorder) ---
  const startWhisperRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") return;

    try {
      const stream =
        mediaStreamRef.current ??
        (await navigator.mediaDevices.getUserMedia({ audio: true }));
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        setListening(false);
        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        const form = new FormData();
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        form.append("audio", blob, `recording.${ext}`);

        try {
          const res = await fetch("/api/stt", { method: "POST", body: form });
          if (!res.ok) return;
          const data = await res.json();
          if (data.text?.trim()) {
            onTranscriptRef.current?.(data.text);
          }
        } catch {
          // STT request failed silently
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setListening(true);
    } catch {
      setRecording(false);
      setListening(false);
    }
  }, []);

  const stopWhisperRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // --- Unified listen/stopListening ---
  const listen = useCallback(() => {
    if (sttMethod === "web-speech") {
      listenWebSpeech();
    } else if (sttMethod === "whisper") {
      startWhisperRecording();
    }
  }, [sttMethod, listenWebSpeech, startWhisperRecording]);

  const stopListening = useCallback(() => {
    if (sttMethod === "web-speech" && recognitionRef.current) {
      recognitionRef.current.abort();
      setListening(false);
    } else if (sttMethod === "whisper") {
      stopWhisperRecording();
    }
  }, [sttMethod, stopWhisperRecording]);

  // --- Audio playback ---
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // already stopped
      }
      sourceNodeRef.current = null;
    }
  }, []);

  const speakWithBrowserFallback = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window.speechSynthesis === "undefined") {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1;
        setSpeaking(true);
        utterance.onend = () => {
          setSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    [],
  );

  const speak = useCallback(
    async (text: string): Promise<void> => {
      cleanupAudio();

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          return speakWithBrowserFallback(text);
        }

        const arrayBuffer = await response.arrayBuffer();

        try {
          const ctx = ensureAudioContext();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          return new Promise((resolve) => {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            sourceNodeRef.current = source;
            setSpeaking(true);

            source.onended = () => {
              setSpeaking(false);
              sourceNodeRef.current = null;
              resolve();
            };

            source.start(0);
          });
        } catch {
          // AudioContext decode failed -- fall back to Audio element
          const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);

          return new Promise((resolve) => {
            const audio = new Audio(url);
            setSpeaking(true);

            audio.onended = () => {
              setSpeaking(false);
              URL.revokeObjectURL(url);
              resolve();
            };

            audio.onerror = () => {
              setSpeaking(false);
              URL.revokeObjectURL(url);
              resolve();
            };

            audio.play().catch(() => {
              setSpeaking(false);
              URL.revokeObjectURL(url);
              speakWithBrowserFallback(text).then(resolve);
            });
          });
        }
      } catch {
        return speakWithBrowserFallback(text);
      }
    },
    [cleanupAudio, ensureAudioContext, speakWithBrowserFallback],
  );

  const speakAndListen = useCallback(
    async (text: string) => {
      await speak(text);
      if (conversationActiveRef.current) {
        listen();
      }
    },
    [speak, listen],
  );

  const startConversation = useCallback(() => {
    ensureAudioContext();
    conversationActiveRef.current = true;
    setConversationActive(true);
    listen();
  }, [listen, ensureAudioContext]);

  const stopConversation = useCallback(() => {
    conversationActiveRef.current = false;
    setConversationActive(false);
    setListening(false);
    setRecording(false);
    setSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.abort();
    stopWhisperRecording();
    cleanupAudio();
    if (typeof window.speechSynthesis !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, [cleanupAudio, stopWhisperRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversationActiveRef.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // already stopped
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      if (typeof window.speechSynthesis !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    supported,
    sttMethod,
    listening,
    recording,
    speaking,
    conversationActive,
    startConversation,
    stopConversation,
    listen,
    stopListening,
    speak,
    speakAndListen,
  };
}
