import React, { useState, useRef, type KeyboardEvent } from 'react';
import {
  Utensils,
  Flame,
  Microwave,
  Zap,
  Wind,
  CookingPot,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  ArrowRight,
  RotateCcw,
  KeyRound,
  ChefHat,
  HeartHandshake,
  ShieldCheck,
  Copy,
  Check,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

// ==========================================
// Types & Interfaces
// ==========================================
export interface Recipe {
  recipeName: string;
  prepTime: string;
  equipmentNeeded: string[];
  missingIngredients: string[];
  idiotProofSteps: string[];
}

interface EquipmentOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
}

// ==========================================
// Google AI Studio (Gemini) Client
// Follows the @google/generative-ai interface
// ==========================================
export class GoogleGenerativeAI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getGenerativeModel(options: { model: string; systemInstruction?: string }) {
    const { model, systemInstruction } = options;
    return {
      generateContent: async (prompt: string) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

        const payload: Record<string, unknown> = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
          },
        };

        if (systemInstruction) {
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
          throw new Error(
            errData?.error?.message || `API error (${response.status}: ${response.statusText})`
          );
        }

        const data = await response.json();
        const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
          response: {
            text: () => outputText,
          },
        };
      },
    };
  }
}

// ==========================================
// Static Data & Options
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

const SYSTEM_PROMPT = `You are a patient culinary AI for absolute beginners. Do not use culinary jargon (e.g., no 'saute' or 'simmer'). Only suggest 2 simple recipes using ONLY the provided ingredients and checked equipment. You MUST return a pure JSON array of objects with the exact keys: "recipeName" (string), "prepTime" (string), "equipmentNeeded" (array of strings), "missingIngredients" (array of strings), and "idiotProofSteps" (array of strings). Do NOT wrap the JSON in markdown blocks.`;

// Fallback demo recipes for instant preview without waiting for API key
const DEMO_FALLBACK_RECIPES: Recipe[] = [
  {
    recipeName: 'Zero-Panic Cheesy Crispy Toast',
    prepTime: '6 minutes',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop'],
    missingIngredients: [],
    idiotProofSteps: [
      'Put a pan on the stove and turn the heat to medium-low. (Do not rush it on high heat!).',
      'Spread butter on one side of each bread slice.',
      'Place one bread slice in the pan, buttered side facing down.',
      'Put cheese and chopped onions on top, then cover it with the second bread slice (butter facing up).',
      'Press gently with a flat spoon for 2 minutes until the bottom turns golden brown.',
      'Flip it over carefully and toast the other side for 2 more minutes until cheese gets melty. Eat warm!',
    ],
  },
  {
    recipeName: 'Kettle-Steamed Masala Noodles & Egg',
    prepTime: '8 minutes',
    equipmentNeeded: ['Electric Kettle', 'Microwave'],
    missingIngredients: ['Chilli flakes (optional)'],
    idiotProofSteps: [
      'Pour 1.5 cups of drinking water into your electric kettle or microwave bowl.',
      'Break the instant noodles in half and drop them in with the seasoning packet.',
      'Turn on kettle (or microwave for 3 minutes) until the water starts bubbling.',
      'Carefully crack an egg straight into the hot noodles and do not stir for 1 minute so it cooks softly.',
      'Pour into your favorite bowl, let it cool down for 60 seconds, and enjoy without burning your tongue.',
    ],
  },
];

// ==========================================
// Main Application Component
// ==========================================
export default function App() {
  // State: Ingredients Tag Input
  const [ingredients, setIngredients] = useState<string[]>(['Bread', 'Butter', 'Cheese']);
  const [inputVal, setInputVal] = useState<string>('');

  // State: Multi-Select Equipment
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Gas Stove',
    'Induction Cooktop',
    'Electric Kettle',
  ]);

  // State: API / Results
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // State: Optional User-Provided API Key in UI
  const [customKey, setCustomKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // Tag / Chip Management
  // ------------------------------------------
  const addIngredient = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = ingredients.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setInputVal('');
    if (error) setError(null);
  };

  const removeIngredient = (indexToRemove: number) => {
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

  // ------------------------------------------
  // Equipment Toggle
  // ------------------------------------------
  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ------------------------------------------
  // Gemini API Fetch Function
  // ------------------------------------------
  const fetchRecipes = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient from your stash!');
      inputRef.current?.focus();
      return;
    }

    if (selectedEquipment.length === 0) {
      setError('Please check at least one piece of cooking equipment!');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Resolve API Key: Custom UI Key or Environment Variable
    const apiKey = customKey.trim() || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';

    const userPrompt = `Available Ingredients: ${ingredients.join(', ')}
Available Equipment: ${selectedEquipment.join(', ')}

Please provide 2 beginner-friendly, foolproof recipes with zero confusing terms.`;

    try {
      if (!apiKey) {
        // Zero-latency helpful demo mode if no key is configured yet
        console.warn('VITE_GEMINI_API_KEY not found. Demonstrating instant beginner preview recipes.');
        await new Promise((res) => setTimeout(res, 1000));

        const tailoredFallbacks: Recipe[] = DEMO_FALLBACK_RECIPES.map((rec, i) => ({
          ...rec,
          equipmentNeeded: selectedEquipment.slice(0, 2),
          recipeName:
            i === 0
              ? `Easy ${ingredients[0] || 'Snack'} Toastie`
              : `Hostel-Style ${ingredients[1] || ingredients[0] || 'Quick'} Bowl`,
        }));

        setRecipes(tailoredFallbacks);
        setIsLoading(false);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }

      // Initialize Gemini Client
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(userPrompt);
      const rawText = result.response.text();

      // Clean markdown codeblocks if model wrapped output in ```json ... ```
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse JSON safely
      const parsedData: Recipe[] = JSON.parse(cleanJson);

      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('Received unexpected format from Gemini.');
      }

      setRecipes(parsedData);

      // Smooth scroll to recipes
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      console.error('Error fetching recipes from Gemini:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred.';
      setError(`Failed to generate recipes: ${errorMsg}. Please verify your Gemini API key or try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRecipe = (recipe: Recipe, index: number) => {
    const text = `🍳 ${recipe.recipeName} (${recipe.prepTime})
Equipment: ${recipe.equipmentNeeded.join(', ')}
${recipe.missingIngredients.length > 0 ? `Missing: ${recipe.missingIngredients.join(', ')}\n` : ''}
Steps:
${recipe.idiotProofSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fbf5e9] text-[#1e3038] font-sans antialiased selection:bg-[#e65e3d]/20 selection:text-[#e65e3d]">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#e65e3d]/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-[#f4c453]/20 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-[#1d6a64]/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-[#e4d7c1] bg-[#fffaf1]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e65e3d] text-[#fff9ee] shadow-[3px_3px_0_#f4c453]">
              <Utensils size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#1e3038]">
                  Jugaad<span className="text-[#e65e3d]">Bites</span>
                </span>
                <span className="hidden rounded-full bg-[#1d6a64]/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-[#1d6a64] uppercase sm:inline-block">
                  AI Studio Powered
                </span>
              </div>
              <p className="text-[0.7rem] font-semibold text-[#7b8179]">
                The Idiot-Proof Recipe Finder
              </p>
            </div>
          </div>

          {/* Quick API Key Settings Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#dfd3bd] bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#52635e] transition hover:border-[#1d6a64] hover:text-[#1d6a64]"
              title="Configure Gemini API Key"
            >
              <KeyRound size={14} className={customKey ? 'text-[#1d6a64]' : 'text-[#8b7560]'} />
              <span className="hidden sm:inline">
                {customKey ? 'Key Active' : 'Gemini API Key'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9cbb5] bg-[#fffaf1] px-3.5 py-1 text-xs font-bold text-[#1d6a64] shadow-xs">
            <Sparkles size={14} className="text-[#e65e3d]" />
            <span>Zero Chef Jargon • No Fancy Tools • Absolute Survival</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight text-[#1e3038] sm:text-5xl sm:leading-[1.15]">
            Terrified of the kitchen? <br />
            <span className="text-[#e65e3d]">We got you covered.</span>
          </h1>

          <p className="mt-3 text-sm text-[#5f6c68] sm:text-base leading-relaxed max-w-xl mx-auto">
            Throw in whatever random ingredients survived in your fridge. We&apos;ll give you 2 foolproof, zero-panic recipes with step-by-step hand-holding.
          </p>
        </div>

        {/* Builder Panel Container */}
        <div className="mt-10 mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[#dfd3bd] bg-[#fffaf1] p-5 sm:p-8 shadow-sm backdrop-blur-xs">
            
            {/* Step 1: Ingredients Tag Input */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-[#263e43]">
                  <ChefHat size={18} className="text-[#e65e3d]" />
                  <span>1. What ingredients do you have?</span>
                </label>
                {ingredients.length > 0 && (
                  <button
                    onClick={() => setIngredients([])}
                    className="text-xs font-semibold text-[#8c877b] hover:text-[#e65e3d] transition"
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
                    className="h-11 w-full rounded-xl border border-[#d8c9b1] bg-[#fffdf8] px-4 text-sm text-[#263e43] outline-none transition placeholder:text-[#a49b8b] focus:border-[#1d6a64] focus:ring-3 focus:ring-[#1d6a64]/15"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addIngredient(inputVal)}
                  disabled={!inputVal.trim()}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1d6a64] px-4 text-xs font-bold text-[#fffaf1] transition hover:bg-[#15524d] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag / Chip List */}
              <div className="mt-3 min-h-[38px]">
                {ingredients.length === 0 ? (
                  <p className="text-xs text-[#8c877b] italic">
                    No ingredients added yet. Type above or click a quick suggestion below!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing, index) => (
                      <span
                        key={`${ing}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#c7dccf] bg-[#e6f1ec] px-3 py-1 text-xs font-bold text-[#1d6a64] transition hover:bg-[#d8eadd]"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="rounded-full p-0.5 text-[#1d6a64]/70 hover:bg-[#1d6a64]/20 hover:text-[#1d6a64]"
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
              <div className="mt-4 pt-3 border-t border-[#ede3cf]">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#8c877b] block mb-2">
                  Quick Add Favorites:
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
                            ? 'bg-[#eae3d5] text-[#9c9588] cursor-default'
                            : 'border border-[#dfd3bd] bg-[#f8efdf] text-[#5e564a] hover:border-[#e65e3d] hover:bg-[#fff0ed] hover:text-[#e65e3d]'
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
            <div className="mt-8 pt-6 border-t border-[#ede3cf]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-[#263e43]">
                  <SlidersHorizontal size={18} className="text-[#e65e3d]" />
                  <span>2. What equipment do you have access to?</span>
                </label>
                <span className="text-xs font-semibold text-[#8c877b]">
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
                          ? 'border-[#1d6a64] bg-[#e7f1eb] shadow-[2px_2px_0_#1d6a64]'
                          : 'border-[#dfd3bd] bg-[#fffdf8] hover:border-[#c5b59a] hover:bg-[#fff9ef]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          size={18}
                          className={isChecked ? 'text-[#1d6a64]' : 'text-[#8b7560]'}
                        />
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-md border text-[10px] font-bold ${
                            isChecked
                              ? 'border-[#1d6a64] bg-[#1d6a64] text-white'
                              : 'border-[#c7b9a5] bg-white text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="block text-xs font-bold text-[#263e43] leading-tight">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-[0.65rem] text-[#7b8179] leading-tight">
                          {desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#e3aaa0] bg-[#fff0ed] p-3 text-xs text-[#984537]">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#e65e3d]" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Step 3: The 'Save Me' Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={fetchRecipes}
                disabled={isLoading || ingredients.length === 0}
                className="group relative flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#e65e3d] px-6 text-base font-bold text-[#fff9ee] shadow-[0_5px_0_#b74731] transition-all hover:-translate-y-0.5 hover:bg-[#d95334] hover:shadow-[0_6px_0_#b74731] active:translate-y-0.5 active:shadow-[0_2px_0_#b74731] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#fff9ee]/30 border-t-[#fff9ee]" />
                    <span>Cooking up foolproof instructions...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake size={20} className="text-[#f4c453]" />
                    <span>Save Me! Find Idiot-Proof Recipes</span>
                    <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-4 text-[0.7rem] text-[#8c877b]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#1d6a64]" /> 2 Simple Options
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#1d6a64]" /> No Fancy Jargon
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#1d6a64]" /> Zero Waste
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Results Section */}
        <div ref={resultsRef} className="mt-14 scroll-mt-20">
          {recipes.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e4d7c1] pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1d6a64]">
                    <Sparkles size={14} />
                    <span>Your Survival Menu</span>
                  </div>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-extrabold text-[#1e3038]">
                    Pick what looks easiest:
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setRecipes([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#68716d] hover:text-[#e65e3d] transition w-fit"
                >
                  <RotateCcw size={14} />
                  <span>Start over</span>
                </button>
              </div>

              {/* Recipe Cards Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe, index) => {
                  const isFirst = index === 0;
                  const theme = isFirst
                    ? {
                        headerBg: 'bg-[#e7f1eb]',
                        accentInk: 'text-[#1d6a64]',
                        border: 'border-[#c2dacf]',
                        badge: 'The Easiest One',
                      }
                    : {
                        headerBg: 'bg-[#fff1db]',
                        accentInk: 'text-[#ad622a]',
                        border: 'border-[#eed3a7]',
                        badge: 'The Flavor Upgrade',
                      };

                  return (
                    <article
                      key={`${recipe.recipeName}-${index}`}
                      className="flex flex-col justify-between rounded-2xl border border-[#dfd3bd] bg-[#fffdf8] shadow-sm overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Top Header */}
                      <div>
                        <div className={`p-4 sm:p-5 ${theme.headerBg} border-b ${theme.border}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider ${theme.accentInk} bg-white/80 border border-current/20`}
                            >
                              {theme.badge}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5f6c68]">
                              <Clock size={14} className={theme.accentInk} />
                              <span>{recipe.prepTime}</span>
                            </div>
                          </div>

                          <h3 className="mt-3 font-serif text-xl sm:text-2xl font-bold leading-tight text-[#1e3038]">
                            {recipe.recipeName}
                          </h3>

                          {/* Equipment Needed Tags */}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[0.68rem] font-bold text-[#747e7a] uppercase tracking-wide mr-1">
                              Equipment:
                            </span>
                            {recipe.equipmentNeeded.map((eq) => (
                              <span
                                key={eq}
                                className="rounded-md bg-white/90 px-2 py-0.5 text-[0.7rem] font-semibold text-[#374944] border border-[#d9cebc]"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Ingredients Warning / Good to Go */}
                        <div className="px-5 py-3 border-b border-[#f0e6d6] bg-[#fffaf1]">
                          {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                            <div className="flex items-start gap-2 text-xs text-[#8c6731]">
                              <Info size={14} className="shrink-0 mt-0.5 text-[#ad622a]" />
                              <span>
                                <strong>Missing / Optional:</strong>{' '}
                                {recipe.missingIngredients.join(', ')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d6a64]">
                              <CheckCircle2 size={14} />
                              <span>All ingredients ready! No extra groceries needed.</span>
                            </div>
                          )}
                        </div>

                        {/* Idiot-Proof Steps */}
                        <div className="p-5">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8b8170] mb-3">
                            Idiot-Proof Step-by-Step:
                          </h4>
                          <ol className="space-y-3">
                            {recipe.idiotProofSteps.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="flex items-start gap-3 text-sm leading-snug text-[#3d4b47]"
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${theme.headerBg} ${theme.accentInk} border ${theme.border} mt-0.5`}
                                >
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 border-t border-[#ede3cf] bg-[#fffaf1] flex items-center justify-between">
                        <span className="text-[0.7rem] text-[#8c877b] font-medium">
                          Zero panic guaranteed
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyRecipe(recipe, index)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd3bd] bg-white px-3 py-1.5 text-xs font-semibold text-[#485854] transition hover:border-[#1d6a64] hover:text-[#1d6a64]"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={14} className="text-[#1d6a64]" />
                              <span className="text-[#1d6a64]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy Steps</span>
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

      {/* API Key Modal / Dialog */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#dfd3bd] bg-[#fffdf8] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-[#e65e3d]" />
                <h3 className="font-serif text-lg font-bold text-[#1e3038]">
                  Gemini API Key Settings
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="rounded-lg p-1 text-[#8c877b] hover:bg-[#ede3cf] hover:text-[#1e3038]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#5f6c68]">
              Your key is stored only in your browser session. If not specified here, it automatically uses the{' '}
              <code className="rounded bg-[#ede3cf] px-1 py-0.5 font-mono text-[0.7rem]">
                VITE_GEMINI_API_KEY
              </code>{' '}
              environment variable.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-[#263e43] mb-1">
                Google AI Studio API Key:
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="h-10 w-full rounded-xl border border-[#d8c9b1] bg-white px-3 text-sm text-[#263e43] outline-none focus:border-[#1d6a64] focus:ring-2 focus:ring-[#1d6a64]/20"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setCustomKey('');
                  setShowKeyModal(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#8c877b] hover:text-[#e65e3d]"
              >
                Clear
              </button>
              <button
                onClick={() => setShowKeyModal(false)}
                className="rounded-xl bg-[#1d6a64] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15524d]"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#e4d7c1] bg-[#fffaf1] py-8 text-center text-xs text-[#8a887d]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-semibold text-[#5a6764]">
            JugaadBites: The Idiot-Proof Recipe Finder
          </p>
          <p className="mt-1 text-[0.7rem]">
            Built with React, Vite, Tailwind CSS & Google Gemini 1.5 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
}