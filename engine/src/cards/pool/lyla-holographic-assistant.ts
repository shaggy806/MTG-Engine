import { defineCard } from "../define.js";

export default defineCard({
  name: "Lyla, Holographic Assistant",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Illusion", "Advisor"],
  power: 2,
  toughness: 2,
  text: "Whenever you draw a card, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, put a +1/+1 counter on target creature.",
    },
  ],
});
