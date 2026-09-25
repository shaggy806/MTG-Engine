import { defineCard } from "../define.js";

export default defineCard({
  name: "Dryad Arbor",
  colors: ["G"],
  types: ["land", "creature"],
  subtypes: ["Forest", "Dryad"],
  power: 1,
  toughness: 1,
  text: "(This land isn't a spell, it's affected by summoning sickness, and it has \"{T}: Add {G}.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
});
