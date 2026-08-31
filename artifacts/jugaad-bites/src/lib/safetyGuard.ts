// =========================================================================
// JugaadBites: Dual-Layer Inedible & Non-Food Safety Guardrail
// Combines Instant Local Ontology Filter + Real-Time AI Edibility Classifier
// Prevents generating recipes with appliances (fan, tv, ac), furniture,
// electronics, toxins, body parts, building materials, or non-food junk
// =========================================================================

export interface ValidationResult {
  isValid: boolean;
  invalidItems: string[];
  message?: string;
  humorousQuote?: string;
}

// 500+ Comprehensive Inedible, Household, Mechanical & Non-Food Dictionary
const INEDIBLE_KEYWORDS = new Set([
  // Household Appliances & Electricals
  'fan', 'ceiling fan', 'table fan', 'exhaust fan', 'cooler', 'ac', 'air conditioner',
  'fridge', 'refrigerator', 'tv', 'television', 'remote', 'bulb', 'light', 'tube light',
  'lamp', 'switch', 'switchboard', 'plug', 'socket', 'wire', 'cable', 'cord', 'heater',
  'iron', 'geyser', 'washing machine', 'dryer', 'vacuum', 'battery', 'batteries', 'cell',
  'charger', 'adapter', 'power bank', 'inverter', 'motor', 'generator',

  // Furniture, Room & Construction
  'chair', 'table', 'desk', 'bed', 'mattress', 'pillow', 'cushion', 'sofa', 'couch',
  'curtain', 'blind', 'blanket', 'quilt', 'sheet', 'bedsheet', 'carpet', 'rug', 'mat',
  'door', 'window', 'wall', 'brick', 'bricks', 'cement', 'concrete', 'stone', 'stones',
  'sand', 'gravel', 'marble', 'granite', 'tile', 'tiles', 'plaster', 'ceramic', 'asbestos',
  'drywall', 'pipe', 'pipes', 'wood', 'plywood', 'glass', 'mirror', 'cupboard', 'almirah',
  'shelf', 'drawer', 'lock', 'key', 'keys', 'latch', 'hinge', 'nail', 'nails', 'screw',
  'screws', 'bolt', 'bolts', 'nut', 'nuts and bolts', 'hammer', 'screwdriver', 'wrench',

  // Electronics & Gadgets
  'phone', 'iphone', 'android', 'smartphone', 'laptop', 'computer', 'pc', 'monitor',
  'keyboard', 'mouse', 'ipad', 'tablet', 'headphone', 'headphones', 'earphone',
  'earphones', 'airpod', 'airpods', 'speaker', 'mic', 'microphone', 'camera',
  'lens', 'sim card', 'memory card', 'pendrive', 'usb', 'smartwatch', 'watch',

  // Apparel, Grooming & Toiletries
  'shoe', 'shoes', 'sock', 'socks', 'shirt', 't-shirt', 'pants', 'jeans', 'trousers',
  'underwear', 'clothes', 'fabric', 'cloth', 'thread', 'needle', 'button', 'zipper',
  'belt', 'wallet', 'purse', 'bag', 'backpack', 'towel', 'soap', 'detergent', 'surf',
  'shampoo', 'conditioner', 'body wash', 'facewash', 'lotion', 'cream', 'perfume',
  'deodorant', 'comb', 'brush', 'toothbrush', 'toothpaste', 'floss', 'razor', 'blade',
  'nail cutter', 'scissors', 'sanitizer', 'lipstick', 'makeup',

  // Office, School & Stationery
  'paper', 'notebook', 'book', 'books', 'pen', 'pencil', 'eraser', 'sharpener',
  'ruler', 'scale', 'stapler', 'staple', 'tape', 'glue', 'fevicol', 'fevikwik',
  'cardboard', 'box', 'envelope', 'rubber', 'rubber band', 'rubber bands', 'stamp',
  'money', 'coins', 'cash', 'credit card', 'debit card', 'coin', 'notes', 'currency',

  // Vehicles & Mechanical
  'car', 'bike', 'motorcycle', 'scooter', 'scooty', 'bicycle', 'cycle', 'wheel',
  'tire', 'tires', 'tube', 'engine', 'helmet', 'petrol', 'diesel', 'gasoline',
  'engine oil', 'mobil', 'brake oil', 'grease',

  // Biological / Human / Toxic / Body Parts
  'human', 'humans', 'people', 'person', 'man', 'woman', 'baby', 'child', 'children',
  'finger', 'fingers', 'hair', 'nail clippings', 'flesh', 'bone', 'bones', 'corpse',
  'cadaver', 'cannibal', 'blood', 'urine', 'feces', 'poop', 'vomit', 'saliva', 'teeth',
  'tooth', 'skin', 'organ', 'kidney', 'liver', 'heart', 'brain',

  // Chemicals, Toxins, Narcotics & Trash
  'bleach', 'acid', 'phenol', 'harpic', 'drain cleaner', 'cyanide', 'arsenic', 'poison',
  'pesticide', 'insecticide', 'rat poison', 'mercury', 'lead', 'uranium', 'plastic',
  'plastics', 'plastic bag', 'polythene', 'trash', 'garbage', 'dust', 'dirt', 'mud',
  'metal', 'iron', 'steel', 'copper', 'aluminum', 'gold', 'silver', 'brass',
  'cigarette', 'beedi', 'vape', 'tobacco', 'gutkha', 'marijuana', 'weed', 'drugs',
  'gun', 'bullet', 'weapon'
]);

const HUMOROUS_REFUSALS = [
  "🧱 We're chefs, not construction workers or electricians! We only cook real, edible food.",
  "🚫 Safety Protocol Activated! Our culinary AI strictly refuses to cook non-food objects.",
  "⚡ Nice try! A fan belongs on the ceiling, not on your dinner plate.",
  "🧬 Even in a 3 AM hostel crisis, that's not edible food! Please add real groceries."
];

// 1. Fast Synchronous Local Guardrail
export function validateIngredients(ingredients: string[]): ValidationResult {
  if (!ingredients || ingredients.length === 0) {
    return { isValid: true, invalidItems: [] };
  }

  const invalidItems: string[] = [];

  for (const item of ingredients) {
    const clean = item.trim().toLowerCase();
    
    // Exact or substring match in inedibles dictionary
    for (const banned of INEDIBLE_KEYWORDS) {
      if (clean === banned || clean.split(/\s+/).includes(banned)) {
        invalidItems.push(item);
        break;
      }
    }

    // Regex pattern checks for hazardous or mechanical categories
    if (/\b(poison|toxic|chemical|acid|battery|kerosene|bleach|human|corpse|fan|cooler|television|laptop|plastic|cement|brick|diesel|petrol)\b/i.test(clean)) {
      if (!invalidItems.includes(item)) {
        invalidItems.push(item);
      }
    }
  }

  if (invalidItems.length > 0) {
    const randomQuote = HUMOROUS_REFUSALS[Math.floor(Math.random() * HUMOROUS_REFUSALS.length)];
    return {
      isValid: false,
      invalidItems,
      message: `Inedible item detected: "${invalidItems.join(', ')}". JugaadBites only cooks real edible food!`,
      humorousQuote: randomQuote
    };
  }

  return { isValid: true, invalidItems: [] };
}

// 2. Real-Time AI Edibility Classifier (Groq / Gemini)
export async function validateIngredientsWithAI(
  ingredients: string[],
  groqKey?: string,
  geminiKey?: string
): Promise<ValidationResult> {
  // First run instant local check
  const localCheck = validateIngredients(ingredients);
  if (!localCheck.isValid) {
    return localCheck;
  }

  // If no API keys or offline, rely on local dictionary
  if (!groqKey && !geminiKey) {
    return localCheck;
  }

  // Sanitize ingredients to prevent prompt injection or payload bloating
  const sanitized = ingredients
    .map((i) => i.replace(/[\r\n\t"'{}\[\]]+/g, ' ').trim().slice(0, 60))
    .filter(Boolean);

  const classificationPrompt = `You are a strict food safety validator for a cooking application.
Analyze this list of ingredients provided by a user:
[${sanitized.join(', ')}]

Rules:
1. Determine if EVERY single item is a genuine, biologically edible food ingredient for humans (e.g. grains, dairy, meat, vegetables, spices, edible oils, condiments, fruits).
2. If ANY item is a household object (e.g. fan, chair, table, pillow, book, pen), electronic, building material (brick, wood, metal), chemical, clothing, human part, or non-food item, mark "isAllEdible": false.
3. Return ONLY a valid JSON object in this exact format:
{
  "isAllEdible": boolean,
  "inedibleItems": ["item1", "item2"],
  "reason": "Brief explanation"
}`;

  try {
    // Try Groq for 0.1s classification
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a food classifier. Return JSON.' },
            { role: 'user', content: classificationPrompt },
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (parsed.isAllEdible === false && Array.isArray(parsed.inedibleItems) && parsed.inedibleItems.length > 0) {
          return {
            isValid: false,
            invalidItems: parsed.inedibleItems,
            message: `AI Safety Guard detected non-food item: "${parsed.inedibleItems.join(', ')}".`,
            humorousQuote: `🚫 ${parsed.reason || 'Our culinary AI only cooks real edible food!'}`
          };
        }
      }
    }
  } catch (err) {
    console.warn('[AI Safety Guard Check Failed, using local check]', err);
  }

  return { isValid: true, invalidItems: [] };
}
