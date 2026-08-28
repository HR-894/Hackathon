import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Flame,
  Leaf,
  Microwave,
  RotateCcw,
  Search,
  Sparkles,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  fetchRecipe,
  type Equipment,
  type Recipe,
} from '@/lib/recipes';

const equipmentOptions: Array<{
  label: Equipment;
  detail: string;
  icon: LucideIcon;
}> = [
  { label: 'Only Kettle', detail: 'Boil + soak', icon: Zap },
  { label: 'Induction Cooktop', detail: 'One pan', icon: Flame },
  { label: 'Microwave', detail: 'Heat + eat', icon: Microwave },
  { label: 'No Heat (Salads/Raw)', detail: 'Zero flame', icon: Leaf },
];

const starterIngredients = ['bread + curd', 'poha + peanuts', 'noodles + onion'];

function AppMark() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-jugaad-bites">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#e65e3d] text-[#fff9ee] shadow-[4px_4px_0_#f4c453]">
        <Utensils size={19} strokeWidth={2.5} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#fbf5e9] bg-[#1d6a64]" />
      </div>
      <div>
        <p className="font-display text-[1.4rem] font-bold leading-none tracking-[-0.03em] text-[#1e3038]">
          Jugaad<span className="text-[#e65e3d]">Bites</span>
        </p>
        <p className="mt-1 text-[0.61rem] font-bold uppercase tracking-[0.2em] text-[#65716f]">
          Hostel survival recipes
        </p>
      </div>
    </div>
  );
}

function EquipmentPicker({
  equipment,
  onChange,
}: {
  equipment: Equipment;
  onChange: (equipment: Equipment) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-bold text-[#263e43]">
        What can you cook with?
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {equipmentOptions.map(({ label, detail, icon: Icon }) => {
          const selected = equipment === label;
          return (
            <label
              key={label}
              className={`group relative flex min-h-[78px] cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all duration-200 ${
                selected
                  ? 'border-[#1d6a64] bg-[#e5f0e9] shadow-[3px_3px_0_#1d6a64]'
                  : 'border-[#dfd3bd] bg-[#fffaf1] hover:-translate-y-0.5 hover:border-[#d59d46] hover:bg-[#fff7e8]'
              }`}
            >
              <input
                type="radio"
                name="equipment"
                value={label}
                checked={selected}
                onChange={() => onChange(label)}
                className="sr-only"
                data-testid={`input-equipment-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              />
              <span className="flex items-center justify-between">
                <Icon
                  size={18}
                  strokeWidth={2.2}
                  className={selected ? 'text-[#1d6a64]' : 'text-[#8b7560]'}
                />
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-[#1d6a64] bg-[#1d6a64] text-[#fffaf1]'
                      : 'border-[#cdbda6] text-transparent'
                  }`}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              </span>
              <span>
                <span className="block text-[0.73rem] font-bold leading-tight text-[#263e43]">
                  {label}
                </span>
                <span className="mt-1 block text-[0.65rem] text-[#7b8179]">
                  {detail}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SearchPanel({
  ingredients,
  equipment,
  phase,
  error,
  onIngredientsChange,
  onEquipmentChange,
  onSubmit,
  onStarterClick,
  onRetry,
  inputRef,
}: {
  ingredients: string;
  equipment: Equipment;
  phase: 'idle' | 'loading' | 'success' | 'error';
  error: string;
  onIngredientsChange: (value: string) => void;
  onEquipmentChange: (value: Equipment) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStarterClick: (value: string) => void;
  onRetry: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const isLoading = phase === 'loading';
  return (
    <form
      onSubmit={onSubmit}
      className="paper-card relative overflow-hidden rounded-[1.35rem] border border-[#dfd3bd] bg-[#fffaf1] p-5 sm:p-7"
      data-testid="form-recipe-search"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f4c453]/30" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#e65e3d]">
          <Search size={14} strokeWidth={2.5} />
          <span>Open the stash</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-[#1e3038] sm:text-[1.75rem]">
          What&apos;s hiding in your cupboard?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#69736f]">
          No grocery run required. Tell us what you have, even if it&apos;s just
          two things.
        </p>

        <label
          htmlFor="ingredient-stash"
          className="mt-6 block text-sm font-bold text-[#263e43]"
        >
          Ingredients
        </label>
        <input
          id="ingredient-stash"
          type="text"
          ref={inputRef}
          value={ingredients}
          onChange={(event) => onIngredientsChange(event.target.value)}
          placeholder="eg. bread, onion, ketchup"
          className="mt-2 h-12 w-full rounded-xl border border-[#d8c9b1] bg-[#fffdf8] px-4 text-[0.92rem] text-[#263e43] outline-none transition placeholder:text-[#a49b8b] focus:border-[#1d6a64] focus:ring-4 focus:ring-[#1d6a64]/10"
          data-testid="input-ingredients"
        />
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[0.68rem] font-semibold text-[#8c877b]">
            Try
          </span>
          {starterIngredients.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onStarterClick(starter)}
              className="rounded-full border border-[#e3d6c2] bg-[#f8efdf] px-2.5 py-1 text-[0.68rem] font-semibold text-[#6c6458] transition hover:border-[#d59d46] hover:bg-[#fff4d9]"
              data-testid={`button-starter-${starter.split(' ')[0]}`}
            >
              {starter}
            </button>
          ))}
        </div>

        <EquipmentPicker equipment={equipment} onChange={onEquipmentChange} />

        {phase === 'error' ? (
          <div
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#e3aaa0] bg-[#fff0ed] px-3 py-2.5 text-sm text-[#984537]"
            data-testid="message-search-error"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 font-bold underline underline-offset-2"
              data-testid="button-retry-search"
            >
              Try again
            </button>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[#e65e3d] px-5 text-sm font-bold text-[#fff9ee] shadow-[0_5px_0_#b74731] transition hover:-translate-y-0.5 hover:bg-[#d95334] hover:shadow-[0_6px_0_#b74731] active:translate-y-0.5 active:shadow-[0_3px_0_#b74731] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0"
          data-testid="button-find-jugaad"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#fff9ee]/35 border-t-[#fff9ee]" />
              Finding your jugaad
            </>
          ) : (
            <>
              Find my jugaad
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[0.68rem] font-medium text-[#918879]">
          Two ideas. Common ingredients. No judgement.
        </p>
      </div>
    </form>
  );
}

function LoadingResults() {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2" data-testid="status-loading-results">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.25rem] border border-[#dfd3bd] bg-[#fffaf1] p-5"
          data-testid={`skeleton-recipe-${item}`}
        >
          <div className="h-3 w-20 rounded-full bg-[#eadfcd]" />
          <div className="mt-5 h-7 w-3/4 rounded bg-[#eadfcd]" />
          <div className="mt-5 h-16 rounded-xl bg-[#f1e8d9]" />
          <div className="mt-5 space-y-2">
            <div className="h-3 rounded-full bg-[#eadfcd]" />
            <div className="h-3 w-5/6 rounded-full bg-[#eadfcd]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const accent = index === 0
    ? { wash: 'bg-[#e5f0e9]', ink: 'text-[#1d6a64]', line: 'border-[#b8d4c6]' }
    : { wash: 'bg-[#fff0d3]', ink: 'text-[#ad622a]', line: 'border-[#ebcc91]' };

  return (
    <article
      className="recipe-card rise-in rounded-[1.25rem] border border-[#dfd3bd] bg-[#fffaf1] p-5 sm:p-6"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`card-recipe-${index + 1}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${accent.wash} ${accent.ink}`}
          data-testid={`text-recipe-label-${index + 1}`}
        >
          {index === 0 ? 'The reliable one' : 'The clever one'}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#7b8179]" data-testid={`text-time-${index + 1}`}>
          <Clock3 size={14} className={accent.ink} />
          {recipe.cookingTime}
        </span>
      </div>
      <h3
        className="mt-5 font-display text-[1.65rem] font-bold leading-[1.06] tracking-[-0.025em] text-[#1e3038]"
        data-testid={`text-recipe-name-${index + 1}`}
      >
        {recipe.recipeName}
      </h3>
      <div className={`mt-4 rounded-xl border ${accent.line} ${accent.wash} p-3.5`}>
        <p className={`text-[0.68rem] font-bold uppercase tracking-[0.13em] ${accent.ink}`}>
          You&apos;ll use
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5" data-testid={`list-used-ingredients-${index + 1}`}>
          {recipe.usedIngredients.map((ingredient) => (
            <span
              key={ingredient}
              className="rounded-md bg-[#fffaf1]/75 px-2 py-1 text-xs font-semibold text-[#53625e]"
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-[#8b8170]">
          Do this
        </p>
        <ol className="mt-3 space-y-3">
          {recipe.method.map((step, stepIndex) => (
            <li key={step} className="flex gap-3 text-sm leading-5 text-[#4e5b58]" data-testid={`text-step-${index + 1}-${stepIndex + 1}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${accent.wash} ${accent.ink}`}>
                {stepIndex + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-5 flex gap-2.5 border-t border-[#e8ddca] pt-4">
        <Sparkles size={17} className={`mt-0.5 shrink-0 ${accent.ink}`} />
        <p className="text-xs leading-5 text-[#68716d]" data-testid={`text-jugaad-${index + 1}`}>
          <span className="font-bold text-[#43514d]">Desi jugaad: </span>
          {recipe.desiJugaad}
        </p>
      </div>
    </article>
  );
}

function Home() {
  const [ingredients, setIngredients] = useState('');
  const [equipment, setEquipment] = useState<Equipment>('Only Kettle');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const ingredientInputRef = useRef<HTMLInputElement>(null);
  const searchIdRef = useRef(0);

  const runSearch = async () => {
    const parsedIngredients = ingredients
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    if (parsedIngredients.length === 0) {
      setPhase('error');
      setError('Tell us what is in your stash first.');
      ingredientInputRef.current?.focus();
      return;
    }

    setPhase('loading');
    setError('');
    
    searchIdRef.current += 1;
    const currentSearchId = searchIdRef.current;

    try {
      const suggestions = await fetchRecipe(parsedIngredients, equipment);
      
      if (searchIdRef.current !== currentSearchId) {
        return; // Ignore stale request
      }

      setRecipes(suggestions.slice(0, 2));
      setPhase('success');
      window.setTimeout(() => {
        document.getElementById('recipe-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch {
      if (searchIdRef.current !== currentSearchId) {
        return; // Ignore stale request
      }
      setPhase('error');
      setError('The recipe tin got stuck. Give it another try.');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch();
  };

  const handleNewSearch = () => {
    setRecipes([]);
    setPhase('idle');
    setError('');
    setIngredients('');
    ingredientInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="texture min-h-[100dvh] overflow-hidden bg-[#fbf5e9]">
      <div className="pointer-events-none absolute left-[-6rem] top-[27rem] h-56 w-56 rounded-full bg-[#f4c453]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-7rem] top-[9rem] h-72 w-72 rounded-full bg-[#1d6a64]/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-5 sm:px-8 sm:pt-7 lg:px-10">
        <header className="flex items-center justify-between">
          <AppMark />
          <div className="hidden items-center gap-2 text-right sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#1d6a64]" />
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-[#69736f]">
              Made for the 11:47 pm hunger
            </span>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-12 pt-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:pb-20 lg:pt-24">
          <div className="rise-in max-w-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-9 bg-[#e65e3d]" />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#e65e3d]">
                Your mess, but make it tasty
              </span>
            </div>
            <h1 className="font-display text-[3.4rem] font-bold leading-[0.93] tracking-[-0.055em] text-[#1e3038] sm:text-[5rem] lg:text-[5.6rem]">
              Good food.
              <br />
              <span className="text-[#e65e3d]">Tiny budget.</span>
            </h1>
            <p className="mt-7 max-w-md text-[1.02rem] leading-7 text-[#5f6c68] sm:text-[1.1rem]">
              Hostel cooking is not a lack of resources. It&apos;s a different
              kind of resourcefulness. Tell us what survived the last grocery
              run and we&apos;ll find a way through.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5 text-xs font-bold text-[#52635e]">
              {['Common pantry stuff', 'One piece of equipment', 'Actually filling'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 rounded-full border border-[#d9cbb5] bg-[#fffaf1]/70 px-3 py-2">
                  <Check size={13} className="text-[#1d6a64]" strokeWidth={3} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rise-in-delay">
            <SearchPanel
              ingredients={ingredients}
              equipment={equipment}
              phase={phase}
              error={error}
              onIngredientsChange={(value) => {
                setIngredients(value);
                if (phase === 'error') setPhase('idle');
              }}
              onEquipmentChange={setEquipment}
              onSubmit={handleSubmit}
              onStarterClick={(value) => setIngredients(value.replace(' + ', ', '))}
              onRetry={() => void runSearch()}
              inputRef={ingredientInputRef}
            />
          </div>
        </section>

        {phase === 'loading' ? (
          <section id="recipe-results" className="border-t border-[#e4d7c1] pt-9">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#e65e3d]">
                  Looking through the tiffin box
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-[#1e3038]">
                  Finding your two best bets
                </h2>
              </div>
              <span className="hidden text-xs text-[#7b8179] sm:block">Just a little stir...</span>
            </div>
            <LoadingResults />
          </section>
        ) : null}

        {phase === 'success' && recipes.length === 2 ? (
          <section id="recipe-results" className="border-t border-[#e4d7c1] pt-9" data-testid="section-recipe-results">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1d6a64]">
                  <span className="h-2 w-2 rounded-full bg-[#1d6a64]" />
                  Your jugaad is ready
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-[#1e3038] sm:text-4xl" data-testid="heading-recipe-results">
                  Pick your kind of brilliant.
                </h2>
                <p className="mt-2 text-sm text-[#6d7771]" data-testid="text-results-summary">
                  Two practical routes from what you already have.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewSearch}
                className="flex w-fit items-center gap-2 rounded-lg border border-[#cdbda6] bg-[#fffaf1] px-3.5 py-2.5 text-xs font-bold text-[#52635e] transition hover:-translate-y-0.5 hover:border-[#1d6a64] hover:text-[#1d6a64]"
                data-testid="button-another-search"
              >
                <RotateCcw size={14} />
                Start another search
              </button>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {recipes.map((recipe, index) => (
                <RecipeCard key={recipe.recipeName} recipe={recipe} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {phase === 'idle' ? (
          <section className="grid gap-5 border-t border-[#e4d7c1] pt-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4c453]/30 text-[#ad622a]">
                <Clock3 size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#354b4a]">Built for the in-between moments</p>
                <p className="mt-1 max-w-lg text-xs leading-5 text-[#747b74]">
                  Before class. After a late shift. When the mess is closed and your wallet says no.
                </p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs font-bold text-[#1d6a64]">
              <span className="h-2 w-2 rounded-full bg-[#e65e3d]" />
              Start with whatever is left
            </p>
          </section>
        ) : null}

        <footer className="mt-16 flex flex-col justify-between gap-2 border-t border-[#e4d7c1] pt-5 text-[0.68rem] text-[#8a887d] sm:flex-row">
          <p>JugaadBites — small kitchen, big imagination.</p>
          <p>Crafted for hostel survival.</p>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;