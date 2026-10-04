import { defineCard } from "../define.js";

// EDHREC rank 4270.
//
// "One or more … triggers only once each turn" is a per-creature dies trigger
// marked `oncePerTurn` (Morbid Opportunist's shape): the first death of the
// turn triggers it, and every later one — in the same event or not — can't.

const TEXT =
  "Whenever one or more other creatures you control die, each opponent loses 2 life and you gain 2 life. This ability triggers only once each turn.";

export default defineCard({
  name: "Vraan, Executioner Thane",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Vampire"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      oncePerTurn: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
