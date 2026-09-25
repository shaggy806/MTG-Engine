import { defineCard } from "../define.js";

export default defineCard({
  name: "Citanul Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: "Whenever an opponent casts an artifact spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an opponent casts an artifact spell, put a +1/+1 counter on this creature.",
    },
  ],
});
