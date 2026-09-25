import { defineCard } from "../define.js";

export default defineCard({
  name: "Algae Gharial",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 1,
  toughness: 1,
  keywords: ["shroud"],
  text: "Shroud (This creature can't be the target of spells or abilities.)\nWhenever another creature dies, you may put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on ~?",
        effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Whenever another creature dies, you may put a +1/+1 counter on this creature.",
    },
  ],
});
