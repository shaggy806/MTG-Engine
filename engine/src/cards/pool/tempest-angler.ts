import { defineCard } from "../define.js";

export default defineCard({
  name: "Tempest Angler",
  manaCost: "{1}{U/R}{U/R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Whenever you cast a noncreature spell, put a +1/+1 counter on this creature.",
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
