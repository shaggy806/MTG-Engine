import { defineCard } from "../define.js";

const TEXT =
  "Whenever a creature you control without flying dies, return it to the battlefield under its owner's control with a flying counter on it.";

// Judged as it last existed: Broodmoth that lost flying but kept this ability
// returns itself, and a creature dying alongside it still returns (the
// rulings). A token has ceased to exist by then and stays gone.
export default defineCard({
  name: "Luminous Broodmoth",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", notKeyword: "flying" } },
      targets: [],
      effect: {
        kind: "put-onto-battlefield",
        target: "trigger-object",
        withCounters: { kind: "flying", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
