import { defineCard } from "../define.js";

export default defineCard({
  name: "Pirate Peddlers",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhenever you sacrifice another permanent, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice another permanent, put a +1/+1 counter on this creature.",
    },
  ],
});
