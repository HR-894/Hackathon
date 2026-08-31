// =========================================================================
// JugaadBites: Real-Time Hands-Free Voice Chef Assistant
// Zero-dependency Web Speech API (Recognition + Synthesis)
// Allows cooks with sticky / flour-covered hands to cook with zero screen touches
// =========================================================================

export type VoiceCommand =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'REPEAT_STEP' }
  | { type: 'SET_TIMER'; minutes: number }
  | { type: 'STOP' }
  | { type: 'UNKNOWN'; text: string };

interface VoiceChefCallbacks {
  onCommand: (command: VoiceCommand) => void;
  onListeningChange: (isListening: boolean) => void;
  onSpeechRecognized?: (transcript: string) => void;
  onError?: (err: string) => void;
}

// Browser Web Speech Recognition type declarations
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export class VoiceChefAssistant {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private callbacks: VoiceChefCallbacks;
  private isSpeechSynthesisActive: boolean = false;

  constructor(callbacks: VoiceChefCallbacks) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('[VoiceChef] Web Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onListeningChange(true);
      };

      this.recognition.onend = () => {
        // Auto-restart if we intended to stay listening and not intentionally stopped
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening = false;
            this.callbacks.onListeningChange(false);
          }
        } else {
          this.callbacks.onListeningChange(false);
        }
      };

      this.recognition.onerror = (e) => {
        console.warn('[VoiceChef] Recognition error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.isListening = false;
          this.callbacks.onListeningChange(false);
          this.callbacks.onError?.('Microphone permission was denied.');
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Prevent Self-Echo Loop: Ignore microphone input while the assistant itself is speaking
        if (this.isSpeechSynthesisActive) {
          return;
        }

        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const transcript = lastResult[0].transcript.trim().toLowerCase();
          this.callbacks.onSpeechRecognized?.(transcript);
          this.parseAndExecuteCommand(transcript);
        }
      };
    } catch (err) {
      console.warn('[VoiceChef] Failed to initialize recognition:', err);
    }
  }

  private parseAndExecuteCommand(transcript: string) {
    // 1. Next Step
    if (/\b(next|forward|done|finish step|advance|proceed)\b/i.test(transcript)) {
      this.callbacks.onCommand({ type: 'NEXT_STEP' });
      return;
    }

    // 2. Previous Step / Go back
    if (/\b(previous|back|last step|prev)\b/i.test(transcript)) {
      this.callbacks.onCommand({ type: 'PREV_STEP' });
      return;
    }

    // 3. Repeat Step
    if (/\b(repeat|again|say again|what was that|read step)\b/i.test(transcript)) {
      this.callbacks.onCommand({ type: 'REPEAT_STEP' });
      return;
    }

    // 4. Set Timer (e.g. "set timer 2 minutes" or "timer for 5 mins")
    const timerMatch = transcript.match(/\b(?:timer|set timer|count down|alarm)\s*(?:for)?\s*(\d+)\s*(?:minute|min|minutes)?/i);
    if (timerMatch && timerMatch[1]) {
      const minutes = parseInt(timerMatch[1], 10);
      if (!isNaN(minutes) && minutes > 0) {
        this.callbacks.onCommand({ type: 'SET_TIMER', minutes });
        this.speak(`Setting kitchen timer for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
        return;
      }
    }

    // 5. Stop listening
    if (/\b(stop listening|mute|pause voice|cancel)\b/i.test(transcript)) {
      this.stop();
      this.speak('Voice assistant paused.');
      this.callbacks.onCommand({ type: 'STOP' });
      return;
    }

    this.callbacks.onCommand({ type: 'UNKNOWN', text: transcript });
  }

  public start() {
    if (!this.recognition) {
      this.callbacks.onError?.('Voice recognition is not supported in this browser.');
      return;
    }
    if (!this.isListening) {
      try {
        this.isListening = true;
        this.recognition.start();
        this.speak('Chef assistant is listening. Say Next Step or Repeat anytime.');
      } catch (err) {
        console.warn('[VoiceChef] Start error:', err);
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.callbacks.onListeningChange(false);
  }

  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  // Voice narration text-to-speech
  public speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      this.isSpeechSynthesisActive = true;
    };
    utterance.onend = () => {
      this.isSpeechSynthesisActive = false;
    };
    utterance.onerror = () => {
      this.isSpeechSynthesisActive = false;
    };

    window.speechSynthesis.speak(utterance);
  }
}
