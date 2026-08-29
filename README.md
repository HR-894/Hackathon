# 🍳 JugaadBites: The Idiot-Proof Recipe Finder

> **Terrified of the kitchen? We got you covered.**  
> *JugaadBites turns whatever random ingredients survived in your hostel room into foolproof, zero-panic meals with step-by-step hand-holding.*

---

## 🌟 What is JugaadBites?

Most recipe apps are built for seasoned chefs—they demand fancy spices, expensive equipment, and confuse beginners with terms like *"sauté on medium simmer"* or *"fold the emulsification"*.

**JugaadBites is designed for absolute kitchen beginners and hostel students.** You throw in whatever random food items you have (bread, eggs, butter, Maggi, onions, cheese), select your available tools (even if it's just an electric kettle or no flame at all), and get **2 dead-simple survival recipes** in plain English with zero jargon.

---

## ✨ Key Features

- **🏷️ Smart Ingredient Tag Input:** Quick-add chips with keyboard support (`Enter` / comma) and 1-tap hostel stash favorites.
- **⚡ Multi-Equipment Filtering:** Gas stove, induction, microwave, air fryer, electric kettle, or no-heat raw modes.
- **🚨 Hunger Urgency & Portion Scaling:**
  - ⚡ *Quick Snack (< 5 min)*
  - 🍛 *Hungry Student (10 min)*
  - 🌙 *3 AM Emergency*
  - 👤 *Single Serving vs 👥 Roommate Feast (2-3 People)*
- **💡 Desi Jugaad Hacks & Substitutions:** Practical hostel lifehacks (e.g. using a steel glass bottom as a spatula, tiffin lid chopping boards, butter replacements).
- **👨‍🍳 Interactive Step-by-Step "Cooking Mode":** Full-screen companion modal with tap-to-complete checklists, visual progress bars, and built-in kitchen countdown timers (`+1m`, `+2m`, `+5m`).
- **🔊 Tactile Audio & Confetti:** Web Audio API sound effects (pops, delete clicks, timer alarms, victory fanfares) and HTML5 Canvas confetti celebrations.
- **💨 Ambient Cooking Steam & Spatula Cursor:** GPU-accelerated rising cooking steam particles and a custom interactive Chef Spatula cursor with golden sizzle spark trails on click.
- **🌓 Dual Mode Aesthetics:**
  - **Warm Culinary Light Mode:** Soothing oatmilk cream (`#f6f1e7`) with terracotta accents.
  - **Midnight Dark Mode:** Deep slate (`#0f1518`) with neon mint accents.
- **📱 PWA & 100% Offline Survival Mode:** 1-click install on Android, iOS, and Desktop with offline fallback caching so you can cook even when hostel Wi-Fi dies.
- **🤖 Zero-Fail Gemini AI Engine:** Automated Google AI Studio integration with dynamic model auto-discovery (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-pro`) and zero-fail local fallback generation.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 19 + TypeScript + Vite
- **Styling:** Vanilla Tailwind CSS + Custom Design Tokens (Zero TailwindCSS bloat)
- **Icons:** Lucide React
- **Audio Engine:** Native Web Audio API Synthesizer (Zero external mp3 files, 100% offline)
- **Effects:** HTML5 Canvas Confetti & Ambient Rising Steam
- **PWA:** Web App Manifest + Offline Service Worker
- **AI Engine:** Google Gemini 1.5 Flash via Google AI Studio

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/HR-894/Hackathon.git
cd Hackathon
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file inside `artifacts/jugaad-bites/`:
```bash
cp artifacts/jugaad-bites/.env.example artifacts/jugaad-bites/.env 2>/dev/null || touch artifacts/jugaad-bites/.env
```

Add your free Google Gemini API key:
```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```
> *(Get a free key in 30 seconds at [Google AI Studio](https://aistudio.google.com/app/apikey) — no credit card required).*

### 3. Start the Dev Server
From the project root:
```bash
pnpm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🚢 Free Deployment on Vercel

The project is pre-configured for free static Vercel deployment:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete JugaadBites app"
   git push origin main
   ```

2. **Import into Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select your `Hackathon` repository.
   - The root [`vercel.json`](./vercel.json) automatically configures the build:
     - **Build Command:** `pnpm --filter @workspace/jugaad-bites run build`
     - **Install Command:** `pnpm install --no-frozen-lockfile`
     - **Output Directory:** `public`

3. **Add Environment Variable on Vercel:**
   - In Vercel Project Settings ➔ **Environment Variables**, add:
     - **Key:** `VITE_GEMINI_API_KEY`
     - **Value:** `your_gemini_api_key`
   - Click **Deploy**! 🚀

---

## 📂 Project Structure

```
.
├── artifacts/
│   └── jugaad-bites/          # Main Vite + React + TypeScript application
│       ├── public/             # PWA manifest.json & sw.js
│       ├── src/
│       │   ├── components/     # SmokeEffect.tsx, KitchenCursor.tsx
│       │   ├── lib/            # sound.ts (Web Audio), confetti.ts (Canvas)
│       │   ├── App.tsx         # Main UI & AI Integration
│       │   └── index.css       # Custom Theme Tokens & Animations
│       └── vite.config.ts      # Builds directly to root /public for Vercel
├── public/                     # Output directory served on Vercel
├── vercel.json                 # Vercel deployment configuration
└── README.md                   # Project Documentation
```

---

## 📄 License
MIT License • Built with ❤️ for hackathons and hungry students everywhere.
