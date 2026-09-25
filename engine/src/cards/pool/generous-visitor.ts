import { defineCard } from "../define.js";

export default defineCard({
  name: "Generous Visitor",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "Whenever you cast an enchantment spell, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast an enchantment spell, put a +1/+1 counter on target creature.",
    },
  ],
});
