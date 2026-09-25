import { defineCard } from "../define.js";

export default defineCard({
  name: "Blessed Spirits",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an enchantment spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast an enchantment spell, put a +1/+1 counter on this creature.",
    },
  ],
});
