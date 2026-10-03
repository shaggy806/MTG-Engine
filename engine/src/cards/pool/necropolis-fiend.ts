import { defineCard } from "../define.js";

// Delve pays only generic mana and doesn't change its mana value (the
// rulings). Its ability's X is the same for the mana and for the cards
// exiled, which are chosen as the cost is paid and can't be fewer than X —
// so X is at most the cards in your graveyard.
const SHRINK_TEXT = "{X}, {T}, Exile X cards from your graveyard: Target creature gets -X/-X until end of turn.";

export default defineCard({
  name: "Necropolis Fiend",
  manaCost: "{7}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\nFlying\n${SHRINK_TEXT}`,
  delve: true,
  activated: [
    {
      cost: { mana: "{X}", tap: true, exileFromGraveyard: { count: "x" } },
      targets: ["creature"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { product: ["x", -1] },
        toughness: { product: ["x", -1] },
        duration: "end-of-turn",
      },
      resolve: null,
      text: SHRINK_TEXT,
    },
  ],
});
