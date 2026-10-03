import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast a noncreature or Dragon spell, this creature deals 1 damage to each opponent.";

// It resolves before the spell, even if that spell is countered (the ruling).
export default defineCard({
  name: "Firespitter Whelp",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${CAST_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { anyOf: [{ notTypes: ["creature"] }, { subtype: "Dragon" }] },
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
