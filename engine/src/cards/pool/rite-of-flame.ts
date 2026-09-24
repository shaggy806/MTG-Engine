import { defineCard } from "../define.js";

// Rite of Flame is on the stack as it resolves, so it never counts itself.
export default defineCard({
  name: "Rite of Flame",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Add {R}{R}, then add {R} for each card named Rite of Flame in each graveyard.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-mana", mana: "R", amount: 2 },
      { kind: "add-mana", mana: "R", amount: { countInGraveyard: { name: "Rite of Flame" } } },
    ],
  },
});
