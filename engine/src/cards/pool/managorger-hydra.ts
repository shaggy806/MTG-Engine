import { defineCard } from "../define.js";

export default defineCard({
  name: "Managorger Hydra",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample\nWhenever a player casts a spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a player casts a spell, put a +1/+1 counter on this creature.",
    },
  ],
});
