import { defineCard } from "../define.js";

export default defineCard({
  name: "Ultimo, Civilization's End",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 6,
  toughness: 5,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhen Ultimo enters, each opponent sacrifices a creature of their choice.\n{2}{B}, Discard this card: Each opponent sacrifices a creature of their choice.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "{2}{B}, Discard this card: Each opponent sacrifices a creature of their choice.",
      zone: "hand",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "When Ultimo enters, each opponent sacrifices a creature of their choice.",
    },
  ],
});
