import { defineCard } from "../define.js";

// "One or more … triggers only once each turn" is a per-creature dies trigger
// marked `oncePerTurn`: the first death of the turn triggers it, and every
// later one — in the same event or not — can't.
export default defineCard({
  name: "Morbid Opportunist",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 3,
  text:
    "Whenever one or more other creatures die, draw a card. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text:
        "Whenever one or more other creatures die, draw a card. This ability triggers only once each turn.",
    },
  ],
});
