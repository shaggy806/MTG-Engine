import { defineCard } from "../define.js";

const TEXT = "When this enchantment enters and whenever you cast a spell with mana value 5 or greater, draw a card.";

// A spell with {X} in its cost counts X as chosen (the ruling) — its mana
// value on the stack.
export default defineCard({
  name: "Up the Beanstalk",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { manaValue: { op: "gte", n: 5 } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
