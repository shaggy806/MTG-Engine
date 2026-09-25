import { defineCard } from "../define.js";

export default defineCard({
  name: "Scavenger Drake",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever another creature dies, you may put a +1/+1 counter on this creature.",
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
