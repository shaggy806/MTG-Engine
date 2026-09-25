import { defineCard } from "../define.js";

export default defineCard({
  name: "Sprite Dragon",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Faerie", "Dragon"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "haste"],
  text: "Flying, haste\nWhenever you cast a noncreature spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, put a +1/+1 counter on this creature.",
    },
  ],
});
