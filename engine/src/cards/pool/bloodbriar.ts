import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodbriar",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Elemental"],
  power: 2,
  toughness: 3,
  text: "Whenever you sacrifice another permanent, put a +1/+1 counter on this creature.",
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
