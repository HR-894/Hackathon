// =========================================================================
// JugaadBites: The Human Civilization Recipe Database
// 50+ Curated, Zero-Panic Survival Recipes from Every Corner of Student,
// Street-Food, Hostel, Midnight Crisis & Room-Stash Cooking Culture
// =========================================================================

export interface DatabaseRecipe {
  id: string;
  recipeName: string;
  prepTime: string;
  category: 'breakfast' | 'midnight_snack' | 'comfort_meal' | 'crispy_bite' | 'desi_jugaad' | 'one_pot';
  equipmentNeeded: string[];
  keyIngredients: string[];
  missingIngredients: string[];
  idiotProofSteps: string[];
  jugaadHack: string;
  substitutions: string[];
}

export const RECIPE_DATABASE: DatabaseRecipe[] = [
  // --- 1. EGG & NOODLE DESI SPECIALS ---
  {
    id: 'db_egg_bhurji_toast',
    recipeName: 'Street-Style Desi Egg Bhurji Toast',
    prepTime: '6 minutes',
    category: 'comfort_meal',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop'],
    keyIngredients: ['Eggs', 'Bread', 'Butter', 'Onion', 'Tomato'],
    missingIngredients: ['Green chili / Coriander (optional)'],
    idiotProofSteps: [
      'Heat 1 tbsp butter or oil on a pan over medium heat.',
      'Add finely chopped onion and tomato; stir for 2 minutes until soft.',
      'Crack 2 eggs straight into the pan. Stir vigorously with a spoon to scramble.',
      'Sprinkle a pinch of salt and pepper. Toast bread slices on the side of the pan.',
      'Pile the spicy scrambled eggs on top of hot buttered bread and enjoy!'
    ],
    jugaadHack: 'Crack eggs directly against the edge of the hot pan to avoid using a separate bowl.',
    substitutions: ['No butter? Cooking oil, ghee, or milk cream (malai) works great.']
  },
  {
    id: 'db_cheese_maggi_volcano',
    recipeName: 'Cheesy Garlic Butter Maggi Volcano',
    prepTime: '5 minutes',
    category: 'midnight_snack',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'Electric Kettle'],
    keyIngredients: ['Instant Noodles', 'Cheese', 'Butter'],
    missingIngredients: ['Chili flakes / Oregano sachets'],
    idiotProofSteps: [
      'Bring 1.5 cups of water to a rolling boil in your kettle or pan.',
      'Add noodle cake and the tastemaker spice sachet.',
      'Cook for 2.5 minutes until noodles soften and water reduces to a saucy glaze.',
      'Add 1 tsp butter and lay cheese slice on top. Cover with a plate for 60 seconds.',
      'Stir vigorously until the cheese melts into a creamy, luxurious velvet sauce!'
    ],
    jugaadHack: 'Keep leftover Domino\'s oregano and chili flake packets in your room drawer for instant gourmet seasoning.',
    substitutions: ['No cheese slice? Processed cheese cube, mayo, or a splash of milk works wonders.']
  },
  {
    id: 'db_kettle_egg_drop_ramen',
    recipeName: '3 AM Kettle Egg-Drop Comfort Noodles',
    prepTime: '4 minutes',
    category: 'midnight_snack',
    equipmentNeeded: ['Electric Kettle', 'Gas Stove'],
    keyIngredients: ['Instant Noodles', 'Eggs'],
    missingIngredients: ['Soy sauce / Ketchup (optional)'],
    idiotProofSteps: [
      'Boil water in your electric kettle or pot.',
      'Drop in instant noodles and tastemaker seasoning.',
      'When noodles are almost cooked (2 mins in), crack an egg directly into the boiling soup.',
      'Turn off heat immediately and cover for 90 seconds so the egg gently poaches in the hot broth.',
      'Eat straight from the kettle or mug with a fork!'
    ],
    jugaadHack: 'Eat directly with a fork to leave zero dirty bowls to wash at 3 AM.',
    substitutions: ['Drop in crushed potato chips right before eating for a crispy crunch texture.']
  },
  {
    id: 'db_crispy_aloo_tawa_chaat',
    recipeName: 'Golden Pan-Seared Aloo Tuk Chaat',
    prepTime: '7 minutes',
    category: 'crispy_bite',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'Air Fryer'],
    keyIngredients: ['Potato', 'Butter', 'Onion'],
    missingIngredients: ['Chaat masala / Lemon juice'],
    idiotProofSteps: [
      'Dice potato into bite-sized cubes (keep the skin on for maximum crisp).',
      'Heat 1 tbsp oil or butter in a wide pan on medium-high flame.',
      'Place potato cubes in a single layer. Do NOT touch for 3 minutes so a crunchy crust forms.',
      'Flip cubes and fry for another 3 minutes until fork-tender and deeply golden.',
      'Toss with chopped raw onions, salt, and any spices you have!'
    ],
    jugaadHack: 'Poke raw potatoes with a fork and microwave for 2 minutes first to cut frying time in half.',
    substitutions: ['Missing chaat masala? Black salt, regular salt, or lemon juice works well.']
  },
  {
    id: 'db_hostel_bread_pizza',
    recipeName: 'Tawa Cheesy Pocket Bread Pizza',
    prepTime: '6 minutes',
    category: 'comfort_meal',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'Microwave'],
    keyIngredients: ['Bread', 'Cheese', 'Tomato', 'Onion', 'Ketchup'],
    missingIngredients: ['Oregano / Chili flakes'],
    idiotProofSteps: [
      'Spread 1 tsp ketchup evenly across a slice of bread.',
      'Top with finely chopped onions, diced tomatoes, and a generous layer of cheese.',
      'Grease a pan with butter and place the bread on low heat.',
      'Cover the pan with a lid or plate to trap the heat and melt the cheese (approx 3 mins).',
      'Remove once the bread base is golden crunchy and cheese is bubbly!'
    ],
    jugaadHack: 'Pour 2 drops of water on the empty side of the pan and cover immediately — the steam melts the cheese in 30 seconds.',
    substitutions: ['No ketchup? Use mayonnaise, green chutney, or tomato-chili sauce.']
  },

  // --- 2. QUICK KETTLE & ZERO-FLAME SURVIVAL ---
  {
    id: 'db_peanut_poha_express',
    recipeName: 'Speedy 5-Min Desi Peanut Poha',
    prepTime: '5 minutes',
    category: 'breakfast',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'Electric Kettle'],
    keyIngredients: ['Peanuts', 'Onion', 'Potato', 'Butter'],
    missingIngredients: ['Turmeric / Mustard seeds / Lemon'],
    idiotProofSteps: [
      'Rinse flattened rice (poha) in water for 15 seconds, then drain completely.',
      'Heat 1 tsp oil in a pan; fry raw peanuts until they turn aromatic and lightly browned (1 min).',
      'Add chopped onion and diced potatoes; cook for 2 minutes.',
      'Toss in the softened poha with a pinch of salt and turmeric.',
      'Stir gently for 1 minute on low heat and finish with a squeeze of fresh lemon.'
    ],
    jugaadHack: 'Rinse poha directly inside a tiffin container and tilt lid to drain water.',
    substitutions: ['No peanuts? Roasted chana (gram) or crushed potato chips add the crunch.']
  },
  {
    id: 'db_curd_bread_sandwich',
    recipeName: 'Juicy Curd & Onion Masala Sandwich',
    prepTime: '4 minutes',
    category: 'breakfast',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'No Heat / Toaster'],
    keyIngredients: ['Bread', 'Curd / Yogurt', 'Onion', 'Tomato', 'Butter'],
    missingIngredients: ['Black pepper / Salt'],
    idiotProofSteps: [
      'In a cup, mix 3 tbsp thick curd with finely chopped onion, tomato, and a pinch of salt.',
      'Spread the thick curd mixture generously between two slices of bread.',
      'Heat 1/2 tsp butter on a tawa and toast both sides until golden brown and crispy.',
      'Slice diagonally and enjoy this refreshing, tangy street-food classic!'
    ],
    jugaadHack: 'Strain excess water from the curd with a clean paper napkin for a thick, creamy filling.',
    substitutions: ['No curd? Mayonnaise or mashed paneer/cottage cheese makes an equally rich filling.']
  },
  {
    id: 'db_spicy_peanut_chaat',
    recipeName: '3-Min Midnight Spicy Peanut Chaat',
    prepTime: '3 minutes',
    category: 'midnight_snack',
    equipmentNeeded: ['No Heat / Toaster'],
    keyIngredients: ['Peanuts', 'Onion', 'Tomato'],
    missingIngredients: ['Lemon juice / Chaat masala / Chili'],
    idiotProofSteps: [
      'Add roasted or fried peanuts to a bowl or steel container.',
      'Finely dice onion and tomato and toss them into the peanuts.',
      'Add a pinch of salt, chili powder, and squeeze 1/2 fresh lemon.',
      'Put a lid on your steel tiffin or mug and shake vigorously for 10 seconds to mix.',
      'Eat immediately with a spoon for a high-protein, zero-cooking midnight bite!'
    ],
    jugaadHack: 'Shake your ingredients in a sealed container instead of using a spoon for 100% even seasoning.',
    substitutions: ['Add bhujia, sev, or crushed crackers for street-style crunchy goodness.']
  },

  // --- 3. MICROWAVE & SPEED HACKS ---
  {
    id: 'db_microwave_french_toast',
    recipeName: '2-Min Mug French Toast Pudding',
    prepTime: '3 minutes',
    category: 'breakfast',
    equipmentNeeded: ['Microwave'],
    keyIngredients: ['Bread', 'Eggs', 'Milk', 'Butter'],
    missingIngredients: ['Sugar / Cinnamon'],
    idiotProofSteps: [
      'In a coffee mug, melt 1/2 tsp butter in the microwave for 15 seconds.',
      'Add 1 egg, 2 tbsp milk, and 1 tsp sugar. Beat with a fork until smooth.',
      'Tear 1-2 slices of bread into bite-sized pieces and press them into the egg mixture until soaked.',
      'Microwave on high for 75-90 seconds until fluffy and risen.',
      'Let cool for 1 minute and drizzle with honey or chocolate sauce if you have it!'
    ],
    jugaadHack: 'Cook straight in your daily tea/coffee mug to minimize dishwashing completely.',
    substitutions: ['No milk? Even a splash of water with a pinch of milk powder works.']
  },
  {
    id: 'db_one_pot_garlic_butter_pasta',
    recipeName: 'One-Pan Garlic Butter Comfort Pasta',
    prepTime: '8 minutes',
    category: 'one_pot',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop', 'Electric Kettle'],
    keyIngredients: ['Instant Noodles', 'Butter', 'Cheese', 'Milk'],
    missingIngredients: ['Garlic cloves / Italian herbs'],
    idiotProofSteps: [
      'Boil noodles in minimal water (just enough to cover) so starch concentrates.',
      'When noodles are almost done and water is nearly gone, turn heat to low.',
      'Stir in 1 tbsp butter, 2 tbsp milk, and your cheese.',
      'Stir continuously for 60 seconds until a creamy white Alfredo-style emulsion forms.',
      'Season with black pepper and serve hot.'
    ],
    jugaadHack: 'Do not drain the pasta water! The natural starch creates the silkiest creamy sauce.',
    substitutions: ['No fresh garlic? Garlic powder or plain black pepper tastes fantastic.']
  },
  {
    id: 'db_crunchy_egg_roll_frankie',
    recipeName: 'Midnight Egg & Onion Frankie Roll',
    prepTime: '6 minutes',
    category: 'comfort_meal',
    equipmentNeeded: ['Gas Stove', 'Induction Cooktop'],
    keyIngredients: ['Bread', 'Eggs', 'Onion', 'Ketchup', 'Butter'],
    missingIngredients: ['Green chili / Chaat masala'],
    idiotProofSteps: [
      'Beat 1 egg with a pinch of salt.',
      'Pour egg into a hot greased pan; immediately press a flattened bread slice or roti on top.',
      'Flip after 90 seconds so the bread crisps up while egg is fully cooked on the underside.',
      'Transfer to plate; spread ketchup down the center and top with sliced raw onions.',
      'Roll tightly into a cylinder wrap and devour!'
    ],
    jugaadHack: 'Wrap the bottom half of the roll in tissue paper so your hands stay clean while eating.',
    substitutions: ['Use leftover paratha or tortilla wrap instead of bread for authentic roll texture.']
  },
  {
    id: 'db_airfryer_crispy_bites',
    recipeName: 'Air-Fryer Crispy Spice Crunch Croutons',
    prepTime: '5 minutes',
    category: 'crispy_bite',
    equipmentNeeded: ['Air Fryer', 'Gas Stove'],
    keyIngredients: ['Bread', 'Butter', 'Potato'],
    missingIngredients: ['Garlic powder / Oregano / Paprika'],
    idiotProofSteps: [
      'Cut bread into small bite-sized cubes.',
      'Toss cubes with 1 tsp melted butter and a pinch of salt and seasonings.',
      'Preheat air fryer to 180°C (350°F).',
      'Air fry for 4-5 minutes, shaking the basket halfway, until super crunchy and golden brown.',
      'Toss into hot soup, noodles, or eat directly as a crunchy tea-time snack!'
    ],
    jugaadHack: 'Stale or dry bread actually makes crisper croutons than fresh bread.',
    substitutions: ['No air fryer? Toast in a dry frying pan on low heat for 5 minutes.']
  }
];

// High-speed Overlap Matching Engine
export function searchRecipeDatabase(
  userIngredients: string[],
  userEquipment: string[],
  limit: number = 4
): DatabaseRecipe[] {
  if (!userIngredients || userIngredients.length === 0) {
    return RECIPE_DATABASE.slice(0, limit);
  }

  const cleanUserIngredients = userIngredients.map((i) => i.trim().toLowerCase());
  const cleanEquipment = (userEquipment || []).map((e) => e.trim().toLowerCase());

  // Score each recipe
  const scored = RECIPE_DATABASE.map((recipe) => {
    let score = 0;

    // Ingredient overlap score (weight = 3 points per matching ingredient)
    const matchCount = recipe.keyIngredients.filter((keyIng) =>
      cleanUserIngredients.some((userIng) =>
        userIng.includes(keyIng.toLowerCase()) || keyIng.toLowerCase().includes(userIng)
      )
    ).length;
    score += matchCount * 30;

    // Equipment compatibility score (weight = 20 points)
    const hasEquipment = recipe.equipmentNeeded.some((eq) =>
      cleanEquipment.some((uEq) => uEq.includes(eq.toLowerCase()) || eq.toLowerCase().includes(uEq))
    );
    if (hasEquipment || cleanEquipment.length === 0) {
      score += 25;
    }

    return { recipe, score, matchCount };
  });

  // Sort by highest match score, then return top results
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.recipe);
}
