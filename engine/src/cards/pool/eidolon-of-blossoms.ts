import { defineCard } from "../define.js";

const TEXT = "Constellation — Whenever this creature or another enchantment you control enters, draw a card.";

// "This creature or another enchantment you control" — it's an enchantment
// creature, so one enchantment filter covers both halves.
export default defineCard({
  name: "Eidolon of Blossoms",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
