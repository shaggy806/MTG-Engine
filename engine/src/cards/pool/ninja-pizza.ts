import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 4279.
//
// Rulings:
//   [2026-01-27] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token.

const GRANT_TEXT = 'Foods you control have "{T}, Sacrifice this artifact: Add one mana of any color."';
const MAIN_TEXT = "At the beginning of your second main phase, create a Food token.";

const FOODS = { subtype: "Food", controlledBy: "you" } as const;

export default defineCard({
  name: "Ninja Pizza",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${GRANT_TEXT}\n${MAIN_TEXT} (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")`,
  static: [
    {
      affects: { scope: "filter", filter: FOODS },
      grantsActivated: [
        addManaAbility({
          mana: "any-color",
          sacrifice: "self",
          text: "{T}, Sacrifice this artifact: Add one mana of any color.",
        }),
      ],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      // "Your second main phase" — the postcombat main that is the turn's
      // second main phase, not a later one after an extra combat (Kona's shape).
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      condition: { kind: "turn-structure", mainPhase: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: MAIN_TEXT,
    },
  ],
});
