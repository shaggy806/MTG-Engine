import { defineCard } from "../define.js";

// EDHREC rank 3667.
//
// "That player" is the land's controller — the trigger object's
// (`"trigger-controller"`, Sire of Stagnation's shape).
const TEXT = "Whenever a land an opponent controls enters, that player loses 2 life and you gain 2 life.";

export default defineCard({
  name: "Polluted Bonds",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "land", controlledBy: "opponent" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "trigger-controller" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
