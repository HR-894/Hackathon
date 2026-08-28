export type Equipment =
  | 'Only Kettle'
  | 'Induction Cooktop'
  | 'Microwave'
  | 'No Heat (Salads/Raw)';

export type Recipe = {
  recipeName: string;
  cookingTime: string;
  method: string[];
  usedIngredients: string[];
  desiJugaad: string;
};

const defaultRecipes: Recipe[] = [
  {
    recipeName: 'Masala Maggi Upgrade',
    cookingTime: '8 min',
    method: [
      'Boil 1¼ cups of water and add the noodles with the tastemaker.',
      'Stir in onion, tomato, chilli, or any chopped vegetables you have.',
      'Finish with a spoon of butter or oil; rest for one minute before eating.',
    ],
    usedIngredients: ['Instant noodles', 'Onion', 'Tomato', 'Green chilli'],
    desiJugaad:
      'No chopping board? Tear soft vegetables by hand straight into the kettle. Less washing, same comfort.',
  },
  {
    recipeName: 'Peanut Poha Cup',
    cookingTime: '10 min',
    method: [
      'Rinse poha quickly until it softens, then drain it well.',
      'Warm oil with peanuts and spices, then fold in the poha and salt.',
      'Cover for two minutes; add lemon, coriander, or sev if the mess has it.',
    ],
    usedIngredients: ['Poha', 'Peanuts', 'Oil', 'Lemon'],
    desiJugaad:
      'A steel tiffin is a perfectly good mixing bowl. Put the lid on and shake gently to season every bite.',
  },
];

export function fetchRecipe(
  ingredients: string[],
  equipment: Equipment,
): Promise<Recipe[]> {
  const pantry = ingredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
  const pantryNames = pantry.slice(0, 4).map((ingredient) => {
    return ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
  });

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(
        defaultRecipes.map((recipe, index) => ({
          ...recipe,
          usedIngredients:
            pantryNames.length > 0
              ? pantryNames.concat(recipe.usedIngredients).filter((item, position, list) => list.findIndex(i => i.toLowerCase() === item.toLowerCase()) === position).slice(0, 4)
              : recipe.usedIngredients,
          desiJugaad:
            equipment === 'No Heat (Salads/Raw)'
              ? index === 0
                ? 'Skip the boil: soak noodles in room-temperature water until soft, then drain and toss with chutney.'
                : 'Rinse poha with cool water and use lemon plus peanuts for all the flavour, without a flame.'
              : recipe.desiJugaad,
        })),
      );
    }, 1150);
  });
}