import React, { useState, useRef, useEffect, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Utensils,
  Flame,
  Microwave,
  Zap,
  Wind,
  CookingPot,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  Plus,
  ArrowRight,
  RotateCcw,
  ChefHat,
  HeartHandshake,
  ShieldCheck,
  Copy,
  Check,
  Info,
  SlidersHorizontal,
  Smartphone,
  WifiOff,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Timer as TimerIcon,
  Lightbulb,
  Users,
  ChevronDown,
  ChevronUp,
  Award,
  Bot,
  ArrowUp,
  Activity,
  CheckCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { sounds } from '@/lib/sound';
import { fireConfetti } from '@/lib/confetti';
import { SmokeEffect } from '@/components/SmokeEffect';
import { KitchenCursor } from '@/components/KitchenCursor';

// ==========================================
// Types & Interfaces
// ==========================================
export interface Recipe {
  recipeName: string;
  prepTime: string;
  equipmentNeeded: string[];
  missingIngredients: string[];
  idiotProofSteps: string[];
  jugaadHack?: string;
  substitutions?: string[];
}

interface EquipmentOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ==========================================
// Ultra-Fast Groq AI Client (Default Primary Engine)
// ==========================================
export class GroqClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async generateRecipes(prompt: string, systemInstruction: string): Promise<string> {
    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
    ];

    let lastError: Error = new Error('Could not connect to Groq API');

    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt },
            ],
            temperature: 0.35,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) return content;
      } catch (err: unknown) {
        if (err instanceof Error) {
          lastError = err;
        }
      }
    }

    throw lastError;
  }
}

// ==========================================
// Robust Google AI Studio Client (Secondary Fallback Engine)
// ==========================================
export class GoogleGenerativeAI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  getGenerativeModel(options: { model: string; systemInstruction?: string }) {
    const { systemInstruction } = options;

    return {
      generateContent: async (prompt: string) => {
        let targetModels = [
          'gemini-1.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash-latest',
          'gemini-1.5-pro',
          'gemini-pro',
        ];

        try {
          const listRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(this.apiKey)}`
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData?.models)) {
              const usableModels = listData.models
                .filter((m: { supportedGenerationMethods?: string[] }) =>
                  m.supportedGenerationMethods?.includes('generateContent')
                )
                .map((m: { name: string }) => m.name.replace(/^models\//, ''));

              if (usableModels.length > 0) {
                targetModels = [...new Set([...usableModels, ...targetModels])];
              }
            }
          }
        } catch {
          // Fallback to standard candidate list
        }

        let lastError: Error = new Error('Could not connect to Gemini API');

        for (const modelName of targetModels) {
          for (const version of ['v1beta', 'v1']) {
            try {
              const url = `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(
                modelName
              )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

              const effectivePrompt =
                version === 'v1' && systemInstruction
                  ? `[IMPORTANT INSTRUCTIONS]: ${systemInstruction}\n\n${prompt}`
                  : prompt;

              const payload: Record<string, unknown> = {
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: effectivePrompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.35,
                  topK: 40,
                  topP: 0.95,
                },
              };

              if (version === 'v1beta' && systemInstruction) {
                payload.system_instruction = {
                  parts: [{ text: systemInstruction }],
                };
              }

              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData?.error?.message || `HTTP ${response.status}`;
                lastError = new Error(msg);
                continue;
              }

              const data = await response.json();
              const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

              if (outputText) {
                return {
                  response: {
                    text: () => outputText,
                  },
                };
              }
            } catch (err: unknown) {
              if (err instanceof Error) {
                lastError = err;
              }
            }
          }
        }

        throw lastError;
      },
    };
  }
}

// ==========================================
// Static Options & System Prompts
// ==========================================
const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { id: 'Gas Stove', label: 'Gas Stove', desc: 'Standard gas burners', icon: Flame },
  { id: 'Induction Cooktop', label: 'Induction Cooktop', desc: 'Flat electric pan', icon: CookingPot },
  { id: 'Microwave', label: 'Microwave', desc: 'Quick reheat & zap', icon: Microwave },
  { id: 'Air Fryer', label: 'Air Fryer', desc: 'Crispy magic box', icon: Wind },
  { id: 'Electric Kettle', label: 'Electric Kettle', desc: 'Boil & soak master', icon: Zap },
  { id: 'No Heat / Toaster', label: 'No Heat / Raw', desc: 'Zero flames or raw', icon: ShieldCheck },
];

const STARTER_INGREDIENTS = [
  'Bread',
  'Eggs',
  'Instant Noodles',
  'Cheese',
  'Butter',
  'Onion',
  'Tomato',
  'Potato',
  'Milk',
  'Curd / Yogurt',
  'Peanuts',
  'Ketchup',
];

const HUNGER_MODES = [
  { id: 'snack', label: '⚡ Quick Snack (< 5 min)', hint: 'Zero fuss' },
  { id: 'normal', label: '🍛 Hungry Student (10 min)', hint: 'Satisfying' },
  { id: 'crisis', label: '🌙 3 AM Emergency', hint: 'Maximum comfort' },
];

const LOADING_MESSAGES = [
  '🍳 Firing up the culinary AI brain...',
  '🔥 Converting random room stash into edible gold...',
  '⚡ Finding the quickest, zero-panic cooking method...',
  '🍜 Checking how to cook this with zero extra dirty dishes...',
  '💡 Calculating optimal desi jugaad hacks & substitutions...',
  '🥘 Filtering out impossible steps and fancy tools...',
  '✨ Plating 2 idiot-proof survival recipes for you...',
];

const SYSTEM_PROMPT = `You are a patient culinary AI for absolute beginners. Do not use culinary jargon (e.g., no 'saute' or 'simmer'). Only suggest 2 simple recipes using ONLY the provided ingredients and checked equipment. You MUST return a pure JSON array of objects with the exact keys: "recipeName" (string), "prepTime" (string), "equipmentNeeded" (array of strings), "missingIngredients" (array of strings), and "idiotProofSteps" (array of strings). Do NOT wrap the JSON in markdown blocks.`;

function generateDynamicFallback(ingredients: string[], equipment: string[]): Recipe[] {
  const main1 = ingredients[0] || 'Snack';
  const main2 = ingredients[1] || ingredients[0] || 'Quick Bite';
  const eq = equipment.length > 0 ? equipment : ['Gas Stove', 'Induction Cooktop'];

  return [
    {
      recipeName: `Crispy ${main1} Pan-Toastie`,
      prepTime: '6 minutes',
      equipmentNeeded: [eq[0] || 'Gas Stove'],
      missingIngredients: [],
      idiotProofSteps: [
        `Place your cooking pan on medium-low flame. (Keep the heat low so ${main1.toLowerCase()} browns without burning).`,
        `Grease the pan lightly with butter, ghee, or cooking oil.`,
        `Add your ${main1} into the pan. If using bread or veggies, press gently with a flat spoon for 2 minutes.`,
        `Flip carefully when the bottom turns golden brown.`,
        `Cook the second side for another 1-2 minutes until warm, crispy, and delicious.`,
      ],
      jugaadHack: 'No spatula? Use the flat bottom of a steel glass to press and flip.',
      substitutions: ['No butter? 1 tsp cooking oil, ghee, or milk malai works wonders.'],
    },
    {
      recipeName: `Comfort ${main2} Quick-Bowl`,
      prepTime: '8 minutes',
      equipmentNeeded: [eq[1] || eq[0] || 'Electric Kettle'],
      missingIngredients: ['Salt / Pepper to taste'],
      idiotProofSteps: [
        `Bring 1.5 cups of water to a gentle boil in your kettle or pan.`,
        `Add your ${main2} and any seasonings you have.`,
        `Let it cook for 3 to 4 minutes without stirring aggressively.`,
        `Turn off the heat and let it rest for 60 seconds so flavors settle.`,
        `Pour into a bowl (or eat straight from the tiffin) and enjoy warm!`,
      ],
      jugaadHack: 'No bowl? Eat straight from a steel container to save dishwashing.',
      substitutions: ['Add crushed peanuts or ketchup for instant flavor elevation.'],
    },
  ];
}

// ==========================================
// Main Application Component
// ==========================================
export default function App() {
  // State: Dark Mode / Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jugaad_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // State: Ingredients Tag Input
  const [ingredients, setIngredients] = useState<string[]>(['Bread', 'Butter', 'Cheese']);
  const [inputVal, setInputVal] = useState<string>('');

  // State: Equipment Multi-Select
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Gas Stove',
    'Induction Cooktop',
    'Electric Kettle',
  ]);

  // State: Settings & Preferences
  const [hungerMode, setHungerMode] = useState<string>('normal');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // State: Scroll & Motion
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // State: Results & API
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedHackIndex, setExpandedHackIndex] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // State: Interactive Step-by-Step Cooking Mode Modal
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // State: PWA Install & Offline Status
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('jugaad_pwa_dismissed') === 'true') || false;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Apply Theme Class to Document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('jugaad_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    sounds.playPop();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      if (totalScroll > 0) {
        setScrollProgress((currentScroll / totalScroll) * 100);
      }

      setShowScrollTop(currentScroll > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA Lifecycle
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cycle loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Kitchen Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            sounds.playTimerBell();
            fireConfetti(1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Tag Management
  const addIngredient = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const exists = ingredients.some((item) => item.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      setIngredients((prev) => [...prev, cleanName]);
      sounds.playPop();
    }
    setInputVal('');
  };

  const removeIngredient = (indexToRemove: number) => {
    sounds.playDelete();
    setIngredients((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && ingredients.length > 0) {
      removeIngredient(ingredients.length - 1);
    }
  };

  const toggleEquipment = (id: string) => {
    sounds.playPop();
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleDismissInstall = () => {
    setIsBannerDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jugaad_pwa_dismissed', 'true');
    }
  };

  // 3D Card Hover Perspective Handler
  const handleCardMouseMove = (e: ReactMouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${-y / 35}deg) rotateY(${x / 35}deg) translateY(-5px)`;
  };

  const handleCardMouseLeave = (e: ReactMouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  // Fetch Logic
  const fetchRecipes = async () => {
    if (ingredients.length === 0) {
      inputRef.current?.focus();
      return;
    }

    if (selectedEquipment.length === 0) {
      return;
    }

    setIsLoading(true);
    setStatusNote(null);
    setLoadingMsgIndex(0);

    const groqKey =
      (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GROQ_API_KEY ||
      '';
    const geminiKey =
      (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY ||
      '';

    const userPrompt = `Available Ingredients: ${ingredients.join(', ')}
Available Equipment: ${selectedEquipment.join(', ')}
Target Portions: ${portionMultiplier === 1 ? 'Single serving (1 person)' : '2-3 people'}
Hunger Urgency Mode: ${hungerMode}

Please provide 2 beginner-friendly, foolproof recipes with zero confusing terms.`;

    const parseAndEnrichJson = (rawText: string): Recipe[] | null => {
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsed: Recipe[] | null = null;
      try {
        const data = JSON.parse(cleanJson);
        if (Array.isArray(data)) parsed = data;
        else if (data && Array.isArray(data.recipes)) parsed = data.recipes;
      } catch {
        const match = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            parsed = null;
          }
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((rec, i) => ({
          ...rec,
          jugaadHack:
            rec.jugaadHack ||
            (i === 0
              ? 'No chopping board? Tear soft veggies with clean hands or cut against a tiffin lid.'
              : 'No strainer? Hold the lid slightly tilted over the pan to drain excess water.'),
          substitutions: rec.substitutions || [
            'No butter? 1 teaspoon cooking oil or ghee works equally well.',
            'Missing chillies? A pinch of black pepper or ketchup gives great flavor.',
          ],
        }));
      }
      return null;
    };

    try {
      // 1. Try Groq AI (Default Ultra-Fast Primary Engine)
      if (groqKey && !isOffline) {
        try {
          const groq = new GroqClient(groqKey);
          const rawText = await groq.generateRecipes(userPrompt, SYSTEM_PROMPT);
          const enriched = parseAndEnrichJson(rawText);

          if (enriched) {
            setRecipes(enriched);
            sounds.playSuccess();
            setIsLoading(false);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
            return;
          }
        } catch (groqErr) {
          console.warn('Groq AI fallback triggered:', groqErr);
        }
      }

      // 2. Try Google Gemini AI (Secondary Fallback Engine)
      if (geminiKey && !isOffline) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
          });

          const result = await model.generateContent(userPrompt);
          const rawText = result.response.text();
          const enriched = parseAndEnrichJson(rawText);

          if (enriched) {
            setRecipes(enriched);
            sounds.playSuccess();
            setIsLoading(false);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
            return;
          }
        } catch (apiErr) {
          console.warn('Gemini API fallback triggered:', apiErr);
          setStatusNote('Serving curated survival recipes (auto-fallback mode).');
        }
      }

      // 3. Zero-Fail Local Dynamic Survival Engine (Offline ready)
      await new Promise((res) => setTimeout(res, 600));
      const dynamicFallback = generateDynamicFallback(ingredients, selectedEquipment);
      setRecipes(dynamicFallback);
      sounds.playSuccess();

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRecipe = (recipe: Recipe, index: number) => {
    const text = `🍳 ${recipe.recipeName} (${recipe.prepTime})
Equipment: ${recipe.equipmentNeeded.join(', ')}
${recipe.missingIngredients.length > 0 ? `Missing / Optional: ${recipe.missingIngredients.join(', ')}\n` : ''}
Steps:
${recipe.idiotProofSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

💡 Desi Jugaad: ${recipe.jugaadHack || 'Zero panic cooking.'}`;

    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    sounds.playCheck();
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartCooking = (recipe: Recipe) => {
    setActiveCookingRecipe(recipe);
    setCompletedSteps([]);
    setTimerSeconds(null);
    setIsTimerRunning(false);
    sounds.playPop();
  };

  const toggleStepCompleted = (stepIdx: number) => {
    const isAlreadyDone = completedSteps.includes(stepIdx);
    const newCompleted = isAlreadyDone
      ? completedSteps.filter((idx) => idx !== stepIdx)
      : [...completedSteps, stepIdx];

    setCompletedSteps(newCompleted);

    if (!isAlreadyDone) {
      sounds.playCheck();
      if (
        activeCookingRecipe &&
        newCompleted.length === activeCookingRecipe.idiotProofSteps.length
      ) {
        sounds.playCelebration();
        fireConfetti(3000);
      }
    }
  };

  const startTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
    sounds.playPop();
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const confidenceScore = Math.min(100, ingredients.length * 35);

  return (
    <div className="min-h-screen bg-[#f8f5ee] dark:bg-[#0f1518] text-[#16202a] dark:text-[#f3eee4] font-sans antialiased selection:bg-[#e65e3d]/20 selection:text-[#e65e3d] relative overflow-x-hidden transition-colors duration-300">
      {/* Interactive Kitchen Spatula Cursor */}
      <KitchenCursor />

      {/* Ambient Rising Cooking Steam */}
      <SmokeEffect />

      {/* Top Fixed Reading Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#e65e3d] via-[#f4c453] to-[#166e64] transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Background Ambience Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#e65e3d]/10 dark:bg-[#e65e3d]/15 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-[#f4c453]/20 dark:bg-[#f4c453]/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-[#166e64]/10 dark:bg-[#166e64]/20 blur-3xl" />
      </div>

      {/* Offline Alert Ribbon */}
      {isOffline && (
        <div className="bg-[#b74731] text-white px-4 py-1.5 text-xs text-center font-bold flex items-center justify-center gap-2 fixed top-0 left-0 right-0 z-50 shadow-sm">
          <WifiOff size={14} />
          <span>Offline Mode Active: Using saved local survival recipes</span>
        </div>
      )}

      {/* ========================================== */}
      {/* FIXED GLASS HEADER */}
      {/* ========================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#ded4c1] dark:border-[#27373f] bg-[#f8f5ee]/90 dark:bg-[#151e22]/90 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e65e3d] text-[#fff9ee] shadow-[3px_3px_0_#f4c453] transition duration-300 group-hover:rotate-6 group-hover:scale-105">
              <Utensils size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#16202a] dark:text-[#f3eee4]">
                Jugaad<span className="text-[#e65e3d]">Bites</span>
              </span>
              <p className="text-[0.7rem] font-semibold text-[#52636a] dark:text-[#8f9f99]">
                The Idiot-Proof Recipe Finder
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 rounded-lg border border-[#ded4c1] dark:border-[#2a3c45] bg-[#fffdf9] dark:bg-[#192429] p-2 text-[#374950] dark:text-[#a2b5ae] transition hover:border-[#e65e3d] hover:text-[#e65e3d] dark:hover:text-[#f06c4b]"
              title={theme === 'dark' ? 'Switch to Warm Light Mode' : 'Switch to Midnight Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={15} className="text-[#f4c453]" />
              ) : (
                <Moon size={15} className="text-[#374950]" />
              )}
            </button>

            {/* Audio Effects Toggle */}
            <button
              onClick={handleMuteToggle}
              className="flex items-center gap-1 rounded-lg border border-[#ded4c1] dark:border-[#2a3c45] bg-[#fffdf9] dark:bg-[#192429] px-2.5 py-1.5 text-xs font-semibold text-[#374950] dark:text-[#a2b5ae] transition hover:border-[#166e64] hover:text-[#166e64] dark:hover:text-[#38c9bc]"
              title={isMuted ? 'Turn Sound Effects ON (Pops, Timer Bells)' : 'Turn Sound Effects OFF'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="hidden md:inline text-[0.7rem]">{isMuted ? 'Muted' : 'Sound ON'}</span>
            </button>

            {/* PWA Install Button in Header */}
            {installPrompt && !isAppInstalled && (
              <button
                onClick={async () => {
                  if (!installPrompt) return;
                  await installPrompt.prompt();
                  const { outcome } = await installPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setIsAppInstalled(true);
                    setInstallPrompt(null);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#e65e3d] px-3 py-1.5 text-xs font-bold text-[#fff9ee] shadow-xs transition hover:bg-[#d95334] active:scale-95"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-24 sm:pt-28 pb-16 sm:px-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bfe2d4] dark:border-[#2d3f47] bg-[#e6f4ee] dark:bg-[#162126] px-3.5 py-1 text-xs font-bold text-[#115e54] dark:text-[#38c9bc] shadow-xs">
            <Sparkles size={14} className="text-[#e65e3d]" />
            <span>Zero Chef Jargon • Interactive Step Checklist • Absolute Survival</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight text-[#142228] dark:text-[#f3eee4] sm:text-5xl sm:leading-[1.15]">
            Terrified of the kitchen? <br />
            <span className="text-[#e65e3d]">We got you covered.</span>
          </h1>

          <p className="mt-3 text-sm text-[#455860] dark:text-[#c5d8d0] sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
            Throw in whatever random ingredients survived in your room. We&apos;ll give you 2 foolproof, zero-panic recipes with step-by-step hand-holding.
          </p>

          {/* Kitchen Confidence Meter */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fffdf9] dark:bg-[#162126] border border-[#ded4c1] dark:border-[#2a3c45] px-4 py-1 text-xs font-semibold text-[#3e5058] dark:text-[#9cb0a8] shadow-xs backdrop-blur-xs">
            <Activity size={14} className={confidenceScore >= 70 ? 'text-[#166e64] dark:text-[#38c9bc]' : 'text-[#e65e3d]'} />
            <span>Kitchen Confidence:</span>
            <span className={`font-bold ${confidenceScore >= 70 ? 'text-[#166e64] dark:text-[#38c9bc]' : 'text-[#e65e3d]'}`}>
              {confidenceScore === 0
                ? '0% (Need Groceries)'
                : confidenceScore < 70
                ? `${confidenceScore}% (Quick Snack Ready)`
                : '100% (Foolproof Feast Incoming!)'}
            </span>
          </div>
        </div>

        {/* Builder Panel Container */}
        <div className="mt-10 mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[#ded4c1] dark:border-[#27373f] bg-[#fffdf9] dark:bg-[#162025] p-5 sm:p-8 shadow-sm backdrop-blur-xs paper-card transition-colors">
            
            {/* Step 1: Ingredients Tag Input */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-[#16202a] dark:text-[#e4efe9]">
                  <ChefHat size={18} className="text-[#e65e3d]" />
                  <span>1. What ingredients do you have?</span>
                </label>
                {ingredients.length > 0 && (
                  <button
                    onClick={() => {
                      sounds.playDelete();
                      setIngredients([]);
                    }}
                    className="text-xs font-semibold text-[#61747d] dark:text-[#8e9f99] hover:text-[#e65e3d] transition"
                  >
                    Clear all ({ingredients.length})
                  </button>
                )}
              </div>

              {/* Input Field with Add Button */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type an ingredient (e.g. Bread, Egg, Maggi) and press Enter"
                    className="h-11 w-full rounded-xl border border-[#d0c2ac] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#11181c] px-4 text-sm text-[#16202a] dark:text-[#e4efe9] outline-none transition placeholder:text-[#84969e] dark:placeholder:text-[#6a7d76] focus:border-[#166e64] dark:focus:border-[#38c9bc] focus:ring-3 focus:ring-[#166e64]/15 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addIngredient(inputVal)}
                  disabled={!inputVal.trim()}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#166e64] dark:bg-[#207c72] px-4 text-xs font-bold text-[#ffffff] transition hover:bg-[#115e54] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag / Chip List */}
              <div className="mt-3 min-h-[38px]">
                {ingredients.length === 0 ? (
                  <p className="text-xs text-[#61747d] dark:text-[#84958f] italic">
                    No ingredients added yet. Type above or click a quick suggestion below!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing, index) => (
                      <span
                        key={`${ing}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#b2ded0] dark:border-[#2a4d44] bg-[#def2ea] dark:bg-[#16332c] px-3 py-1 text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc] transition hover:bg-[#cdece0] dark:hover:bg-[#1b3d35] animate-in fade-in zoom-in-95 duration-150 shadow-xs"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="rounded-full p-0.5 text-[#0f5c53]/70 dark:text-[#38c9bc]/70 hover:bg-[#166e64]/20 hover:text-[#0f5c53]"
                          aria-label={`Remove ${ing}`}
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Starter Suggestions */}
              <div className="mt-4 pt-3 border-t border-[#ede3cf] dark:border-[#27373f]">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#61747d] dark:text-[#82938d] block mb-2">
                  Quick Add Stash Favorites:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_INGREDIENTS.map((item) => {
                    const isAdded = ingredients.some(
                      (i) => i.toLowerCase() === item.toLowerCase()
                    );
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => addIngredient(item)}
                        disabled={isAdded}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          isAdded
                            ? 'bg-[#ded4c1]/60 dark:bg-[#202d33] text-[#788a91] dark:text-[#6a7d77] cursor-default'
                            : 'border border-[#ded4c1] dark:border-[#2c3f47] bg-[#f8f3ea] dark:bg-[#182329] text-[#2c3d44] dark:text-[#a8bbb3] hover:border-[#e65e3d] hover:bg-[#ffece6] dark:hover:bg-[#2c1d18] hover:text-[#e65e3d] active:scale-95'
                        }`}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Select Equipment Checkboxes */}
            <div className="mt-8 pt-6 border-t border-[#ede3cf] dark:border-[#27373f]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-[#16202a] dark:text-[#e4efe9]">
                  <SlidersHorizontal size={18} className="text-[#e65e3d]" />
                  <span>2. What equipment do you have access to?</span>
                </label>
                <span className="text-xs font-semibold text-[#61747d] dark:text-[#84958f]">
                  {selectedEquipment.length} selected
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {EQUIPMENT_OPTIONS.map(({ id, label, desc, icon: Icon }) => {
                  const isChecked = selectedEquipment.includes(id);
                  return (
                    <label
                      key={id}
                      onClick={() => toggleEquipment(id)}
                      className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all duration-200 select-none ${
                        isChecked
                          ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#def2ea] dark:bg-[#14322c] shadow-[2px_2px_0_#166e64]'
                          : 'border-[#ded4c1] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#131c20] hover:border-[#b8a994] dark:hover:border-[#3a525d] hover:bg-[#fffdf9] dark:hover:bg-[#182329]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          size={18}
                          className={isChecked ? 'text-[#0f5c53] dark:text-[#38c9bc]' : 'text-[#61747d] dark:text-[#7f918a]'}
                        />
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-md border text-[10px] font-bold ${
                            isChecked
                              ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#166e64] dark:bg-[#38c9bc] text-white dark:text-[#0f1518]'
                              : 'border-[#b8a994] dark:border-[#3a525d] bg-white dark:bg-[#131c20] text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="block text-xs font-bold text-[#16202a] dark:text-[#e4efe9] leading-tight">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-[0.65rem] text-[#52636a] dark:text-[#849791] leading-tight font-medium">
                          {desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Hunger Level & Portions */}
            <div className="mt-8 pt-6 border-t border-[#ede3cf] dark:border-[#27373f] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hunger Urgency */}
              <div>
                <label className="text-xs font-bold text-[#16202a] dark:text-[#e4efe9] block mb-2">
                  Hunger Level:
                </label>
                <div className="flex flex-col gap-1.5">
                  {HUNGER_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setHungerMode(mode.id);
                      }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold border transition text-left ${
                        hungerMode === mode.id
                          ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#def2ea] dark:bg-[#14322c] text-[#0f5c53] dark:text-[#38c9bc] font-bold shadow-xs'
                          : 'border-[#ded4c1] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#131c20] text-[#33464e] dark:text-[#a0b4ac] hover:bg-[#fffdf9] dark:hover:bg-[#182329]'
                      }`}
                    >
                      <span>{mode.label}</span>
                      <span className="text-[0.65rem] text-[#61747d] dark:text-[#758983]">{mode.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Portions Multiplier */}
              <div>
                <label className="text-xs font-bold text-[#16202a] dark:text-[#e4efe9] block mb-2">
                  Portion Size:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setPortionMultiplier(1);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      portionMultiplier === 1
                        ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#def2ea] dark:bg-[#14322c] text-[#0f5c53] dark:text-[#38c9bc] font-bold shadow-xs'
                        : 'border-[#ded4c1] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#131c20] text-[#33464e] dark:text-[#a0b4ac] hover:bg-[#fffdf9] dark:hover:bg-[#182329]'
                    }`}
                  >
                    <span className="text-sm font-bold">1 Person</span>
                    <span className="text-[0.65rem] text-[#52636a] dark:text-[#758983]">Solo Survival</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setPortionMultiplier(2);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      portionMultiplier === 2
                        ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#def2ea] dark:bg-[#14322c] text-[#0f5c53] dark:text-[#38c9bc] font-bold shadow-xs'
                        : 'border-[#ded4c1] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#131c20] text-[#33464e] dark:text-[#a0b4ac] hover:bg-[#fffdf9] dark:hover:bg-[#182329]'
                    }`}
                  >
                    <span className="text-sm font-bold flex items-center gap-1">
                      <Users size={14} /> 2-3 People
                    </span>
                    <span className="text-[0.65rem] text-[#52636a] dark:text-[#758983]">Roommate Feast</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Informational Status Note */}
            {statusNote && (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#854d0e] dark:text-[#e4b568] bg-[#fff9ea] dark:bg-[#2c2214] p-2.5 rounded-xl border border-[#eedab2] dark:border-[#4d381c]">
                <Bot size={15} className="text-[#e65e3d]" />
                <span className="font-semibold">{statusNote}</span>
              </div>
            )}

            {/* The 'Save Me' Submit Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={fetchRecipes}
                disabled={isLoading || ingredients.length === 0}
                className="group relative flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#e65e3d] px-6 text-base font-bold text-[#ffffff] shadow-[0_5px_0_#b74731] transition-all hover:-translate-y-0.5 hover:bg-[#d95334] hover:shadow-[0_6px_0_#b74731] active:translate-y-0.5 active:shadow-[0_2px_0_#b74731] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Cooking up your survival recipes...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake size={20} className="text-[#f4c453]" />
                    <span>Save Me! Find Idiot-Proof Recipes</span>
                    <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-4 text-[0.7rem] text-[#52636a] dark:text-[#849791] font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#166e64] dark:text-[#38c9bc]" /> 2 Simple Options
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#166e64] dark:text-[#38c9bc]" /> No Fancy Jargon
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#166e64] dark:text-[#38c9bc]" /> Zero Waste
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Sizzling Pan Animated Loading Card */}
        {isLoading && (
          <div className="mt-10 mx-auto max-w-xl text-center rounded-2xl border border-[#ded4c1] dark:border-[#2c3d45] bg-[#fffdf9] dark:bg-[#162126] p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#e65e3d]/10 dark:bg-[#e65e3d]/20" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e65e3d] text-white shadow-lg animate-bounce">
                <Flame size={32} />
              </div>
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#16202a] dark:text-[#f3eee4]">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </h3>
            <p className="mt-1.5 text-xs text-[#52636a] dark:text-[#8ca199] font-semibold">
              ✨ Zero panic • Your meal is only a few minutes away!
            </p>
          </div>
        )}

        {/* Results Section */}
        <div ref={resultsRef} className="mt-14 scroll-mt-28">
          {recipes.length > 0 && !isLoading && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#ded4c1] dark:border-[#27373f] pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#166e64] dark:text-[#38c9bc]">
                    <Sparkles size={14} />
                    <span>Your Survival Menu</span>
                  </div>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-extrabold text-[#16202a] dark:text-[#f3eee4]">
                    Pick what looks easiest:
                  </h2>
                </div>
                <button
                  onClick={() => {
                    sounds.playDelete();
                    setRecipes([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#52636a] dark:text-[#8fa39b] hover:text-[#e65e3d] transition w-fit"
                >
                  <RotateCcw size={14} />
                  <span>Start over</span>
                </button>
              </div>

              {/* Recipe Cards Grid with 3D Tilt Hover */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe, index) => {
                  const isFirst = index === 0;
                  const themeColors = isFirst
                    ? {
                        headerBg: 'bg-[#def2ea] dark:bg-[#132c26]',
                        accentInk: 'text-[#0f5c53] dark:text-[#38c9bc]',
                        border: 'border-[#b2ded0] dark:border-[#234d43]',
                        badge: 'The Easiest One',
                      }
                    : {
                        headerBg: 'bg-[#faedd7] dark:bg-[#2a1e14]',
                        accentInk: 'text-[#9e5218] dark:text-[#f39c5a]',
                        border: 'border-[#ebd2ad] dark:border-[#4d3623]',
                        badge: 'The Flavor Upgrade',
                      };

                  const isHackOpen = expandedHackIndex === index;

                  return (
                    <article
                      key={`${recipe.recipeName}-${index}`}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      className={`flex flex-col justify-between rounded-2xl border border-[#ded4c1] dark:border-[#27373f] bg-[#fffdf9] dark:bg-[#162126] recipe-card overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${
                        index === 0 ? 'delay-75' : 'delay-150'
                      }`}
                    >
                      {/* Top Header */}
                      <div>
                        <div className={`p-4 sm:p-5 ${themeColors.headerBg} border-b ${themeColors.border}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider ${themeColors.accentInk} bg-white/90 dark:bg-black/40 border border-current/20 shadow-2xs`}
                            >
                              {themeColors.badge}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4b5d65] dark:text-[#b4cbbf]">
                              <Clock size={14} className={themeColors.accentInk} />
                              <span>{recipe.prepTime}</span>
                            </div>
                          </div>

                          <h3 className="mt-3 font-serif text-xl sm:text-2xl font-bold leading-tight text-[#16202a] dark:text-[#f3eee4]">
                            {recipe.recipeName}
                          </h3>

                          {/* Equipment Needed Tags */}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[0.68rem] font-bold text-[#52636a] dark:text-[#8ba098] uppercase tracking-wide mr-1">
                              Equipment:
                            </span>
                            {recipe.equipmentNeeded.map((eq) => (
                              <span
                                key={eq}
                                className="rounded-md bg-white dark:bg-[#11191d] px-2 py-0.5 text-[0.7rem] font-bold text-[#2c3d44] dark:text-[#cde0d9] border border-[#ded4c1] dark:border-[#2c3f47]"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Ingredients Warning / Good to Go */}
                        <div className="px-5 py-3 border-b border-[#ded4c1]/60 dark:border-[#233238] bg-[#f8f3ea] dark:bg-[#12191d]">
                          {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                            <div className="flex items-start gap-2 text-xs text-[#854d0e] dark:text-[#fcd34d] font-semibold">
                              <Info size={14} className="shrink-0 mt-0.5 text-[#9e5218] dark:text-[#f39c5a]" />
                              <span>
                                <strong>Missing / Optional:</strong>{' '}
                                {recipe.missingIngredients.join(', ')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc]">
                              <CheckCircle2 size={14} />
                              <span>All ingredients ready! No extra groceries needed.</span>
                            </div>
                          )}
                        </div>

                        {/* Idiot-Proof Steps Preview */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5c6f77] dark:text-[#9bb0a8]">
                              Idiot-Proof Step-by-Step:
                            </h4>
                            <span className="text-[0.65rem] text-[#61747d] dark:text-[#7f948c] font-bold">
                              {recipe.idiotProofSteps.length} easy steps
                            </span>
                          </div>

                          <ol className="space-y-3">
                            {recipe.idiotProofSteps.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="flex items-start gap-3 text-sm leading-snug text-[#273840] dark:text-[#e2eee9] font-medium"
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${themeColors.headerBg} ${themeColors.accentInk} border ${themeColors.border} mt-0.5`}
                                >
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>

                          {/* Desi Jugaad & Substitutions Accordion */}
                          <div className="mt-5 pt-4 border-t border-[#ded4c1] dark:border-[#27373f]">
                            <button
                              type="button"
                              onClick={() => setExpandedHackIndex(isHackOpen ? null : index)}
                              className="flex w-full items-center justify-between text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc] hover:text-[#166e64] transition"
                            >
                              <span className="flex items-center gap-1.5">
                                <Lightbulb size={14} className="text-[#e65e3d]" />
                                <span>Desi Jugaad Hacks & Substitutions</span>
                              </span>
                              {isHackOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {isHackOpen && (
                              <div className="mt-3 space-y-2 rounded-xl bg-[#def2ea] dark:bg-[#132c26]/60 p-3 text-xs text-[#1b433b] dark:text-[#c4ded6] border border-[#b2ded0] dark:border-[#224b41] animate-in fade-in duration-200">
                                <div>
                                  <strong className="block text-[#0f5c53] dark:text-[#38c9bc] font-bold">💡 Kitchen Hack:</strong>
                                  <p className="mt-0.5 font-medium">
                                    {recipe.jugaadHack || 'No spatula? Use the flat bottom of a glass to flip and press toast.'}
                                  </p>
                                </div>
                                {recipe.substitutions && recipe.substitutions.length > 0 && (
                                  <div className="pt-2 border-t border-[#b2ded0] dark:border-[#224b41]">
                                    <strong className="block text-[#0f5c53] dark:text-[#38c9bc] font-bold">🔄 Substitutions:</strong>
                                    <ul className="mt-1 list-disc list-inside space-y-0.5 font-medium">
                                      {recipe.substitutions.map((sub, i) => (
                                        <li key={i}>{sub}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="p-4 border-t border-[#ded4c1] dark:border-[#27373f] bg-[#f8f3ea] dark:bg-[#131c20] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartCooking(recipe)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#166e64] dark:bg-[#207c72] py-2 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#115e54] active:scale-95"
                        >
                          <Play size={14} />
                          <span>Start Cooking Mode</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyRecipe(recipe, index)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded4c1] dark:border-[#2c3f47] bg-[#fffdf9] dark:bg-[#182328] px-3 py-2 text-xs font-semibold text-[#374950] dark:text-[#b4cbbf] transition hover:border-[#166e64] hover:text-[#166e64] shrink-0"
                          title="Copy recipe text to clipboard"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={14} className="text-[#0f5c53] dark:text-[#38c9bc]" />
                              <span className="text-[#0f5c53] dark:text-[#38c9bc] font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Scroll-To-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#16202a] dark:bg-[#1e2c33] border border-transparent dark:border-[#384f5a] text-white shadow-lg transition hover:bg-[#e65e3d] hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-200"
          title="Scroll back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* ========================================== */}
      {/* Full-Screen Interactive Cooking Mode Modal */}
      {/* ========================================== */}
      {activeCookingRecipe && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f5ee] dark:bg-[#0e1417] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 transition-colors">
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-10 border-b border-[#ded4c1] dark:border-[#27373f] bg-[#f8f5ee]/95 dark:bg-[#151e22]/95 px-4 py-3 sm:px-8 backdrop-blur-md flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e65e3d] text-white shadow-xs">
                <ChefHat size={20} />
              </div>
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#e65e3d]">
                  Live Cooking Companion
                </span>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#16202a] dark:text-[#f3eee4] line-clamp-1">
                  {activeCookingRecipe.recipeName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Step Progress Pill */}
              <span className="rounded-full bg-[#def2ea] dark:bg-[#1d6a64]/30 px-3 py-1 text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc]">
                {completedSteps.length} / {activeCookingRecipe.idiotProofSteps.length} Steps
              </span>
              <button
                onClick={() => setActiveCookingRecipe(null)}
                className="rounded-xl border border-[#ded4c1] dark:border-[#2d4048] bg-[#fffdf9] dark:bg-[#1a252a] p-2 text-[#52636a] dark:text-[#a0b3ac] hover:bg-[#ded4c1]/50 dark:hover:bg-[#25363e] hover:text-[#16202a] transition"
                title="Exit Cooking Mode"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cooking Mode Body */}
          <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 flex-1 flex flex-col justify-between">
            <div>
              {/* Visual Step Progress Bar */}
              <div className="mb-6 h-2 w-full rounded-full bg-[#ded4c1] dark:bg-[#202d33] overflow-hidden">
                <div
                  className="h-full bg-[#166e64] dark:bg-[#38c9bc] transition-all duration-300 ease-out"
                  style={{
                    width: `${(completedSteps.length / activeCookingRecipe.idiotProofSteps.length) * 100}%`,
                  }}
                />
              </div>

              {/* Quick Reassurance Banner */}
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#def2ea] dark:bg-[#133029] p-3 text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc] border border-[#b2ded0] dark:border-[#224f44]">
                <ShieldCheck size={16} />
                <span>Tap each step to check it off. Take your time—no rush!</span>
              </div>

              {/* Step-by-Step Checklist */}
              <div className="space-y-4">
                {activeCookingRecipe.idiotProofSteps.map((step, idx) => {
                  const isDone = completedSteps.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStepCompleted(idx)}
                      className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 select-none ${
                        isDone
                          ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#def2ea] dark:bg-[#14322b] shadow-xs'
                          : 'border-[#ded4c1] dark:border-[#27373f] bg-[#fffdf9] dark:bg-[#162126] hover:border-[#166e64]/50 dark:hover:border-[#38c9bc]/50 hover:shadow-sm'
                      }`}
                    >
                      {/* Checkbox circle */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5 ${
                          isDone
                            ? 'border-[#166e64] dark:border-[#38c9bc] bg-[#166e64] dark:bg-[#38c9bc] text-white dark:text-[#0f1518] shadow-xs scale-105'
                            : 'border-[#b8a994] dark:border-[#3b505a] bg-[#fffdf9] dark:bg-[#11181c] text-transparent group-hover:border-[#166e64]'
                        }`}
                      >
                        <Check size={16} strokeWidth={3} />
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-extrabold uppercase tracking-wide ${
                              isDone ? 'text-[#0f5c53] dark:text-[#38c9bc]' : 'text-[#5c6f77] dark:text-[#7f948c]'
                            }`}
                          >
                            Step {idx + 1}
                          </span>
                          {isDone && (
                            <span className="text-[0.65rem] font-bold text-[#0f5c53] dark:text-[#38c9bc] uppercase flex items-center gap-1">
                              <CheckCheck size={12} /> Done!
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-base sm:text-lg leading-relaxed font-semibold transition ${
                            isDone ? 'line-through text-[#6a8077] dark:text-[#6a8077]' : 'text-[#1e3038] dark:text-[#e4efe9]'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Kitchen Stopwatch / Quick Timers Widget */}
              <div className="mt-8 rounded-2xl border border-[#ded4c1] dark:border-[#27373f] bg-[#fffdf9] dark:bg-[#162126] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#16202a] dark:text-[#e4efe9]">
                    <TimerIcon size={18} className="text-[#e65e3d]" />
                    <span>Kitchen Countdown Timer</span>
                  </div>
                  {timerSeconds !== null && (
                    <span className="font-mono text-xl font-extrabold text-[#e65e3d] animate-pulse">
                      {formatTimer(timerSeconds)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => startTimer(60)}
                    className="rounded-lg border border-[#ded4c1] dark:border-[#2d4048] bg-[#f8f3ea] dark:bg-[#11181c] px-3 py-1.5 text-xs font-bold text-[#33464e] dark:text-[#c5d8d0] hover:bg-[#166e64] hover:text-white transition active:scale-95"
                  >
                    + 1 Min
                  </button>
                  <button
                    onClick={() => startTimer(120)}
                    className="rounded-lg border border-[#ded4c1] dark:border-[#2d4048] bg-[#f8f3ea] dark:bg-[#11181c] px-3 py-1.5 text-xs font-bold text-[#33464e] dark:text-[#c5d8d0] hover:bg-[#166e64] hover:text-white transition active:scale-95"
                  >
                    + 2 Min
                  </button>
                  <button
                    onClick={() => startTimer(300)}
                    className="rounded-lg border border-[#ded4c1] dark:border-[#2d4048] bg-[#f8f3ea] dark:bg-[#11181c] px-3 py-1.5 text-xs font-bold text-[#33464e] dark:text-[#c5d8d0] hover:bg-[#166e64] hover:text-white transition active:scale-95"
                  >
                    + 5 Min
                  </button>

                  {timerSeconds !== null && (
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="rounded-lg bg-[#166e64] dark:bg-[#207c72] px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                      >
                        {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          setTimerSeconds(null);
                          setIsTimerRunning(false);
                        }}
                        className="rounded-lg border border-[#ded4c1] dark:border-[#2d4048] px-2 py-1.5 text-xs text-[#52636a] dark:text-[#7f948c] hover:text-[#e65e3d] font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Finish Celebration Card */}
            {completedSteps.length === activeCookingRecipe.idiotProofSteps.length && (
              <div className="mt-8 rounded-2xl bg-[#166e64] dark:bg-[#163a33] p-6 text-center text-white shadow-xl animate-in zoom-in-95 duration-300">
                <Award size={36} className="mx-auto text-[#f4c453] mb-2" />
                <h3 className="font-serif text-2xl font-bold">You did it! 🎉</h3>
                <p className="mt-1 text-sm text-[#def2ea] max-w-md mx-auto font-medium">
                  You successfully cooked <span className="font-bold underline">{activeCookingRecipe.recipeName}</span> without panic. Time to eat!
                </p>
                <button
                  onClick={() => {
                    fireConfetti(2000);
                    setActiveCookingRecipe(null);
                  }}
                  className="mt-5 rounded-xl bg-[#f4c453] px-6 py-2.5 text-sm font-bold text-[#16202a] shadow-md transition hover:bg-[#f3bc3e] active:scale-95"
                >
                  Done Cooking & Return
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Sleek Bottom-Right PWA Install Banner */}
      {/* ========================================== */}
      {installPrompt && !isAppInstalled && !isBannerDismissed && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#166e64] dark:border-[#38c9bc] bg-[#fffdf9] dark:bg-[#162126] p-3.5 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e65e3d] text-white shadow-xs">
                <Smartphone size={18} />
              </div>
              <div className="pr-1">
                <p className="text-xs font-extrabold text-[#16202a] dark:text-[#f3eee4]">
                  Install App
                </p>
                <p className="text-[0.68rem] text-[#52636a] dark:text-[#8ca199] leading-tight font-medium">
                  1-click kitchen survival on your home screen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  if (!installPrompt) return;
                  await installPrompt.prompt();
                  const { outcome } = await installPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setIsAppInstalled(true);
                    setInstallPrompt(null);
                  }
                }}
                className="rounded-xl bg-[#166e64] dark:bg-[#207c72] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#115e54] active:scale-95"
              >
                Install
              </button>
              <button
                onClick={handleDismissInstall}
                className="rounded-lg p-1 text-[#61747d] dark:text-[#7d928b] hover:bg-[#ded4c1]/50 dark:hover:bg-[#25363e] hover:text-[#16202a] transition"
                title="Dismiss permanently"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}
      <footer className="relative z-10 mt-20 border-t border-[#ded4c1] dark:border-[#27373f] bg-[#f8f5ee] dark:bg-[#151e22] py-8 text-center text-xs text-[#52636a] dark:text-[#7a8e87] transition-colors">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-semibold text-[#374950] dark:text-[#9bb0a8]">
            JugaadBites: The Idiot-Proof Recipe Finder
          </p>
          <p className="mt-1 text-[0.7rem] text-[#61747d] dark:text-[#7a8e87]">
            Built with React, Vite, Tailwind CSS & Google Gemini 1.5 Flash • PWA Installable.
          </p>
        </div>
      </footer>
    </div>
  );
}